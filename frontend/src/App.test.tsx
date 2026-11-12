import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { makeReport } from './test/fixtures';

/** Pretends the window is phone-sized or desktop-sized (jsdom has no real matchMedia). */
function setDesktop(isDesktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

/** Shows the current URL, so tests can check it. */
function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>,
  );
}

const currentUrl = () => screen.getByTestId('location').textContent;

const reports = [
  makeReport({ id: 145, description: 'Cracked paving by the main gate', status: 'waiting' }),
  makeReport({ id: 142, isMine: true }),
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ reports: reports.slice(1) })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('phone layout', () => {
  it('shows the SIPKAK top bar with the Map/List switch and the bottom nav', () => {
    setDesktop(false);
    renderAt('/');

    expect(screen.getByText('SIPKAK')).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(labels).toEqual(['Map', 'Report', 'My reports', 'Notifications']);
    expect(within(nav).getByRole('link', { name: 'Map' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('changes screen from the bottom nav', () => {
    setDesktop(false);
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });

    fireEvent.click(within(nav).getByRole('link', { name: 'My reports' }));
    expect(screen.getByRole('heading', { name: 'My reports' })).toBeTruthy();

    fireEvent.click(within(nav).getByRole('link', { name: 'Notifications' }));
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeTruthy();

    fireEvent.click(within(nav).getByRole('link', { name: 'Report' }));
    expect(screen.getByRole('heading', { name: 'Report damage' })).toBeTruthy();
  });

  it('switches between map and list', async () => {
    setDesktop(false);
    renderAt('/');
    const toggle = screen.getByRole('navigation', { name: 'Show reports as' });

    fireEvent.click(within(toggle).getByRole('link', { name: 'List' }));

    expect(within(toggle).getByRole('link', { name: 'List' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(await screen.findByText('1 report on campus · newest first')).toBeTruthy();
    // The Map tab of the bottom nav stays highlighted on the list.
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Map' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });
});

describe('desktop layout', () => {
  it('shows three panes and no bottom nav', () => {
    setDesktop(true);
    renderAt('/');

    expect(screen.getByRole('complementary', { name: 'Reports' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Map' })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
  });

  it('changes the left tab and opens the form from the header button', () => {
    setDesktop(true);
    renderAt('/');
    const tabs = screen.getByRole('navigation', { name: 'Lists' });

    fireEvent.click(within(tabs).getByRole('link', { name: 'Notifications' }));
    expect(
      within(tabs).getByRole('link', { name: 'Notifications' }).getAttribute('aria-current'),
    ).toBe('page');

    fireEvent.click(screen.getByRole('link', { name: 'Report damage' }));
    expect(screen.getByRole('form', { name: 'Report damage' })).toBeTruthy();
    expect(
      within(tabs).getByRole('link', { name: 'All reports' }).getAttribute('aria-current'),
    ).toBe('page');
  });
});

describe('map', () => {
  it('loads the reports from the API and shows them as markers', async () => {
    setDesktop(false);
    renderAt('/');

    expect(
      await screen.findByRole('button', { name: 'Lamp by the east stairs is out, In progress' }),
    ).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith('/api/reports', expect.anything());
  });

  it('says so when the reports cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    setDesktop(true);
    renderAt('/');

    expect((await screen.findByRole('alert')).textContent).toContain('Couldn’t load the reports');
  });

  it('is where unknown paths end up', async () => {
    setDesktop(false);
    renderAt('/nope');

    expect(await screen.findByRole('list', { name: 'Legend' })).toBeTruthy();
  });
});

describe('selecting a report', () => {
  const useTwoReports = () =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ reports })),
    );

  it('opens the sheet from a marker on the phone and puts the id in the URL', async () => {
    useTwoReports();
    setDesktop(false);
    renderAt('/');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Lamp by the east stairs is out, In progress' }),
    );

    expect(currentUrl()).toBe('/?report=142');
    const sheet = screen.getByRole('article', { name: 'Report #0142' });
    expect(within(sheet).getByText('Note from facilities:')).toBeTruthy();

    fireEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
    expect(currentUrl()).toBe('/');
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('opens a report from the phone list on the map', async () => {
    useTwoReports();
    setDesktop(false);
    renderAt('/list');

    expect(await screen.findByText('Sent by you')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Cracked paving by the main gate/ }));

    expect(currentUrl()).toBe('/?report=145');
    expect(screen.getByRole('article', { name: 'Report #0145' })).toBeTruthy();
  });

  it('shows the report in the right pane on desktop and highlights its row and pin', async () => {
    useTwoReports();
    setDesktop(true);
    const { container } = renderAt('/');

    const list = screen.getByRole('complementary', { name: 'Reports' });
    fireEvent.click(
      await within(list).findByRole('button', { name: /Cracked paving by the main gate/ }),
    );

    expect(currentUrl()).toBe('/?report=145');
    const details = screen.getByRole('complementary', { name: 'Details' });
    expect(within(details).getByText('Report #0145')).toBeTruthy();
    const row = within(list).getByRole('button', { name: /Cracked paving by the main gate/ });
    expect(row.getAttribute('aria-current')).toBe('true');
    const selectedPin = container.querySelector('.leaflet-marker-icon[class*="selected"]');
    expect(selectedPin?.getAttribute('aria-label')).toBe(
      'Cracked paving by the main gate, Waiting for review',
    );
  });

  it('opens straight to the report when the URL has ?report=', async () => {
    useTwoReports();
    setDesktop(true);
    renderAt('/?report=142');

    const details = screen.getByRole('complementary', { name: 'Details' });
    expect(await within(details).findByText('Report #0142')).toBeTruthy();
  });

  it('ignores an unknown report id', async () => {
    useTwoReports();
    setDesktop(true);
    renderAt('/?report=9999');

    expect(await screen.findByText('Select a report on the map or in the list.')).toBeTruthy();
  });
});

describe('sending a report', () => {
  const created = makeReport({
    id: 146,
    description: 'Broken window in the stairwell',
    status: 'waiting',
    note: null,
    confirmations: 0,
    isMine: true,
    createdAt: '2026-11-11T04:32:00Z',
    history: [{ status: 'waiting', at: '2026-11-11T04:32:00Z' }],
  });

  /** A fake API where the list gains the new report once it is posted. */
  function fakeApi() {
    let list = [...reports];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/buildings') {
          return Response.json({
            buildings: [{ name: 'Aula Barat', lat: -6.89246, lng: 107.609824 }],
          });
        }
        if (url.startsWith('/api/reports/nearby')) return Response.json({ reports: [] });
        if (url === '/api/reports' && init?.method === 'POST') {
          list = [created, ...list];
          return Response.json(created, { status: 201 });
        }
        return Response.json({ reports: list });
      }),
    );
  }

  async function fillAndSend() {
    fireEvent.click(await screen.findByRole('button', { name: 'Use my location' }));
    await screen.findAllByRole('option', { name: 'Aula Barat' });
    fireEvent.change(screen.getByLabelText("What's wrong?"), {
      target: { value: 'Broken window in the stairwell' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    return screen.findByRole('dialog', { name: 'Report sent' });
  }

  it('shows "Report sent" with the number and time, and a new orange marker', async () => {
    fakeApi();
    setDesktop(true);
    renderAt('/report/new');

    const dialog = await fillAndSend();

    expect(within(dialog).getByText('#0146 · 11/11/2026 · 11:32 WIB')).toBeTruthy();
    // While the form is open the markers aren't buttons (clicks place your pin), so look them up
    // by their label.
    await waitFor(() =>
      expect(
        document.querySelector(
          '[aria-label="Broken window in the stairwell, Waiting for review"] [class*="waiting"]',
        ),
      ).toBeTruthy(),
    );
  });

  it('"Close" on desktop shows the new report in the right pane', async () => {
    fakeApi();
    setDesktop(true);
    renderAt('/report/new');

    const dialog = await fillAndSend();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(currentUrl()).toBe('/?report=146');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      await within(screen.getByRole('complementary', { name: 'Details' })).findByText(
        'Report #0146',
      ),
    ).toBeTruthy();
  });

  it('"See it in My reports" on the phone opens My reports', async () => {
    fakeApi();
    setDesktop(false);
    renderAt('/report/new');

    const dialog = await fillAndSend();
    fireEvent.click(within(dialog).getByRole('button', { name: 'See it in My reports' }));

    expect(currentUrl()).toBe('/mine');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('"Back to map" on the phone opens the new report on the map', async () => {
    fakeApi();
    setDesktop(false);
    renderAt('/report/new');

    const dialog = await fillAndSend();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back to map' }));

    expect(currentUrl()).toBe('/?report=146');
    expect(await screen.findByRole('article', { name: 'Report #0146' })).toBeTruthy();
  });
});
