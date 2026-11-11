import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows the SIPKAK name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<App />);

    expect(screen.getByRole('heading', { name: 'SIPKAK' })).toBeTruthy();
    await screen.findByText('API: offline');
  });

  it('shows "connected" when the health check succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, store: 'memory' }));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(await screen.findByText('API: connected')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });

  it('shows "offline" when the backend answers with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    render(<App />);

    expect(await screen.findByText('API: offline')).toBeTruthy();
  });
});
