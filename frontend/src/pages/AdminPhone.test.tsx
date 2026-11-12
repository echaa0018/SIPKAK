import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { makeReport } from '../test/fixtures';

const reports = [
  makeReport({ id: 145, description: 'Cracked paving by the main gate', status: 'waiting' }),
  makeReport({ id: 142, lat: -6.8915 }),
  makeReport({ id: 127, description: 'Broken chair, third row', status: 'done', lat: -6.8905 }),
];

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>,
  );
}

const currentUrl = () => screen.getByTestId('location').textContent;
const nav = () => screen.getByRole('navigation', { name: 'Admin' });

beforeEach(() => {
  sessionStorage.setItem('sipkak.adminToken', 'admin-token');
  // A phone-sized window.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
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

describe('admin on the phone', () => {
  it('has a bottom nav with Map and Reports', () => {
    renderAt('/admin');

    const links = within(nav()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Map', 'Reports']);
    expect(links[0].getAttribute('aria-current')).toBe('page');
  });

  it('opens a sheet from a pin, and "Update status" opens the report page', async () => {
    renderAt('/admin');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Lamp by the east stairs is out, In progress' }),
    );
    expect(currentUrl()).toBe('/admin?report=142');
    const sheet = screen.getByRole('article', { name: 'Report #0142' });
    expect(within(sheet).getByText('In progress')).toBeTruthy();
    expect(within(sheet).queryByRole('button', { name: /Same problem/ })).toBeNull();

    fireEvent.click(within(sheet).getByRole('link', { name: 'Update status' }));

    expect(currentUrl()).toBe('/admin/reports/142');
    expect(screen.getByRole('heading', { name: 'Report #0142' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Status' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save and notify reporter' })).toBeTruthy();
    // As in its wireframe, the phone page has no pin coordinates.
    expect(screen.queryByText('Pin')).toBeNull();
  });

  it('goes back to the map with Back', async () => {
    renderAt('/admin?report=142');

    fireEvent.click(
      within(await screen.findByRole('article', { name: 'Report #0142' })).getByRole('link', {
        name: 'Update status',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(currentUrl()).toBe('/admin?report=142');
  });

  it('lists reports with the filter under Reports', async () => {
    renderAt('/admin');

    fireEvent.click(within(nav()).getByRole('link', { name: 'Reports' }));

    expect(currentUrl()).toBe('/admin/reports');
    expect(within(nav()).getByRole('link', { name: 'Reports' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(await screen.findByRole('button', { name: 'All 3' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Done 1' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('opens a report from the list, and Back returns to the list', async () => {
    renderAt('/admin/reports');

    fireEvent.click(await screen.findByRole('button', { name: /Cracked paving/ }));

    expect(currentUrl()).toBe('/admin/reports/145');
    expect(within(nav()).getByRole('link', { name: 'Reports' }).getAttribute('aria-current')).toBe(
      'page',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(currentUrl()).toBe('/admin/reports');
  });

  it('says so when the report does not exist', async () => {
    renderAt('/admin/reports/9999');

    expect(await screen.findByText('Report not found.')).toBeTruthy();
  });
});
