import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { ReportStatus } from '../api/reports';
import { makeReport } from '../test/fixtures';

// The 8 seed reports' ids and statuses (4 waiting, 2 in progress, 2 done), newest first.
const seed: [number, string, ReportStatus][] = [
  [145, 'Cracked paving by the main gate', 'waiting'],
  [144, 'Leaking tap in the 2nd-floor toilet', 'waiting'],
  [142, 'Lamp by the east stairs is out', 'in_progress'],
  [139, 'Projector won’t turn on', 'waiting'],
  [133, 'Loose handrail on the ramp', 'in_progress'],
  [127, 'Broken chair, third row', 'done'],
  [120, 'Flickering lights in the reading room', 'done'],
  [98, 'Tap leaking in the men’s toilet', 'waiting'],
];
const reports = seed.map(([id, description, status], i) =>
  // Spread them out a little so each has its own spot on the map.
  makeReport({
    id,
    description,
    status,
    // Two of them are toilet reports, for the category filter.
    category: description.includes('tap') || description.includes('Tap') ? 'toilets' : 'lighting',
    lat: -6.89 - i * 0.0003,
    lng: 107.61,
  }),
);

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

function renderAdmin(path = '/admin') {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>,
  );
  return result.container;
}

const currentUrl = () => screen.getByTestId('location').textContent;
const list = () => screen.getByRole('complementary', { name: 'Reports' });
const rows = () => within(list()).getAllByRole('listitem');
const markers = (container: HTMLElement) =>
  [...container.querySelectorAll('.leaflet-marker-icon')].map((m) => m.getAttribute('aria-label'));

beforeEach(() => {
  sessionStorage.setItem('sipkak.adminToken', 'admin-token');
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ reports })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('admin dashboard', () => {
  it('counts the reports per status', async () => {
    renderAdmin();
    await within(list()).findByText('Cracked paving by the main gate');

    const filter = screen.getByRole('group', { name: 'Show reports' });
    expect(
      within(filter)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['All 8', 'Waiting 4', 'In progress 2', 'Done 2']);
    expect(rows()).toHaveLength(8);
  });

  it('narrows the list, the map and the status counts to one category', async () => {
    const container = renderAdmin();
    await within(list()).findByText('Cracked paving by the main gate');

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'toilets' } });

    expect(rows().map((r) => within(r).getAllByText(/./)[0].textContent)).toEqual([
      'Leaking tap in the 2nd-floor toilet',
      'Tap leaking in the men’s toilet',
    ]);
    expect(markers(container)).toHaveLength(2);
    const filter = screen.getByRole('group', { name: 'Show reports' });
    expect(within(filter).getAllByRole('button')[0].textContent).toBe('All 2');
  });

  it('shows the report number on each row', async () => {
    renderAdmin();

    const first = await within(list()).findByRole('button', { name: /Cracked paving/ });
    expect(first.textContent).toContain('#0145');
  });

  it('filters the list and the map pins together', async () => {
    const container = renderAdmin();
    await within(list()).findByText('Cracked paving by the main gate');

    fireEvent.click(screen.getByRole('button', { name: 'Done 2' }));

    expect(screen.getByRole('button', { name: 'Done 2' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(rows()).toHaveLength(2);
    expect(markers(container)).toEqual([
      'Broken chair, third row, Done',
      'Flickering lights in the reading room, Done',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'All 8' }));
    expect(markers(container)).toHaveLength(8);
  });

  it('selects the pin when you click a row', async () => {
    const container = renderAdmin();

    fireEvent.click(await within(list()).findByRole('button', { name: /Lamp by the east/ }));

    expect(currentUrl()).toBe('/admin?report=142');
    const pin = container.querySelector('.leaflet-marker-icon[class*="selected"]');
    expect(pin?.getAttribute('aria-label')).toBe('Lamp by the east stairs is out, In progress');
    // The selected pin is labelled on the map.
    expect(container.querySelector('.leaflet-tooltip')?.textContent).toBe(
      'Lamp by the east stairs is out',
    );
  });

  it('selects the row when you click a pin', async () => {
    renderAdmin();
    await within(list()).findByText('Loose handrail on the ramp');

    fireEvent.click(
      within(screen.getByRole('region', { name: 'Map' })).getByRole('button', {
        name: 'Loose handrail on the ramp, In progress',
      }),
    );

    expect(currentUrl()).toBe('/admin?report=133');
    const row = within(list()).getByRole('button', { name: /Loose handrail/ });
    expect(row.getAttribute('aria-current')).toBe('true');
  });
});

describe('updating a report', () => {
  it('saves the new status, says so, and the list and map follow', async () => {
    // A fake API that applies the PATCH to its copy of the reports.
    let current = reports.map((r) => ({ ...r }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'PATCH') {
          const id = Number(url.split('/').pop());
          const body = JSON.parse(String(init.body));
          current = current.map((r) => (r.id === id ? { ...r, ...body } : r));
          return Response.json(current.find((r) => r.id === id));
        }
        return Response.json({ reports: current });
      }),
    );
    const container = renderAdmin('/admin?report=145');

    const details = screen.getByRole('complementary', { name: 'Details' });
    fireEvent.click(await within(details).findByLabelText('In progress'));
    fireEvent.change(within(details).getByLabelText('Note to reporter (optional)'), {
      target: { value: 'Crew booked for Friday.' },
    });
    fireEvent.click(within(details).getByRole('button', { name: 'Save and notify reporter' }));

    expect((await within(details).findByRole('status')).textContent).toBe(
      'Saved. The reporter will see this in Notifications.',
    );
    expect(await within(details).findByText('Crew booked for Friday.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'In progress 3' })).toBeTruthy();
    expect(markers(container)).toContain('Cracked paving by the main gate, In progress');
  });
});
