import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
