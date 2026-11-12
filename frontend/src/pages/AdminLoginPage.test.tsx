import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

function Location() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>,
  );
}

const currentPath = () => screen.getByTestId('location').textContent;

/** The API: "right-password" gets a token, anything else a 401. */
function fakeApi() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/admin/login') {
      const { password } = JSON.parse(String(init?.body));
      return password === 'right-password'
        ? Response.json({ token: 'admin-token' })
        : Response.json(
            { error: { code: 'UNAUTHORIZED', message: 'Wrong password' } },
            { status: 401 },
          );
    }
    return Response.json({ reports: [], notifications: [], unread: 0 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function signIn(password: string) {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => {
  sessionStorage.clear();
  fakeApi();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('admin sign-in', () => {
  it('sends /admin to /admin/login when you are not signed in', () => {
    renderAt('/admin');

    expect(currentPath()).toBe('/admin/login');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  });

  it('shows an error for a wrong password', async () => {
    renderAt('/admin/login');

    await signIn('guess');

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong password. Try again.');
    expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).toBe('true');
    expect(currentPath()).toBe('/admin/login');
    expect(sessionStorage.getItem('sipkak.adminToken')).toBeNull();
  });

  it('asks for a password before sending anything', async () => {
    const fetchMock = fakeApi();
    renderAt('/admin/login');

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('alert').textContent).toBe('Enter the admin password.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens /admin with the right password and keeps the token for this tab', async () => {
    renderAt('/admin');

    await signIn('right-password');

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(currentPath()).toBe('/admin');
    expect(sessionStorage.getItem('sipkak.adminToken')).toBe('admin-token');
  });

  it('stays signed in after a refresh', () => {
    sessionStorage.setItem('sipkak.adminToken', 'admin-token');
    renderAt('/admin');

    expect(currentPath()).toBe('/admin');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });

  it('skips the sign-in page when you are already signed in', () => {
    sessionStorage.setItem('sipkak.adminToken', 'admin-token');
    renderAt('/admin/login');

    expect(currentPath()).toBe('/admin');
  });

  it('signs out', () => {
    sessionStorage.setItem('sipkak.adminToken', 'admin-token');
    renderAt('/admin');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(currentPath()).toBe('/admin/login');
    expect(sessionStorage.getItem('sipkak.adminToken')).toBeNull();
  });
});
