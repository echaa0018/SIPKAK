import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

/** Pretends the window is phone-sized or desktop-sized (jsdom has no real matchMedia). */
function setDesktop(isDesktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

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

  it('switches between map and list', () => {
    setDesktop(false);
    renderAt('/');
    const toggle = screen.getByRole('navigation', { name: 'Show reports as' });

    fireEvent.click(within(toggle).getByRole('link', { name: 'List' }));

    expect(within(toggle).getByRole('link', { name: 'List' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByText('All reports')).toBeTruthy();
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
    expect(screen.getByText('Report damage form')).toBeTruthy();
    expect(
      within(tabs).getByRole('link', { name: 'All reports' }).getAttribute('aria-current'),
    ).toBe('page');
  });
});

it('sends unknown paths back to the map', () => {
  setDesktop(false);
  renderAt('/nope');

  expect(screen.getByText('Campus map')).toBeTruthy();
});
