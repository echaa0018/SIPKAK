import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Report } from '../api/reports';
import { makeReport } from '../test/fixtures';
import { AdminReportDetail } from './AdminReportDetail';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const paving = makeReport({
  id: 145,
  description: 'Cracked paving by the main gate',
  building: 'Main gate (Jl. Ganesha)',
  floor: null,
  status: 'waiting',
  note: null,
  confirmations: 0,
  lat: -6.893057,
  lng: 107.610385,
  createdAt: '2026-11-11T03:47:00Z',
});

function renderDetail(report: Report = paving, response = () => Response.json(report)) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => response());
  vi.stubGlobal('fetch', fetchMock);
  const onSaved = vi.fn();
  const onUnauthorized = vi.fn();
  render(
    <AdminReportDetail
      report={report}
      token="admin-token"
      onClose={vi.fn()}
      onSaved={onSaved}
      onUnauthorized={onUnauthorized}
    />,
  );
  return { fetchMock, onSaved, onUnauthorized };
}

const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save and notify reporter' }));

describe('AdminReportDetail', () => {
  it('shows the report facts', () => {
    renderDetail(makeReport());

    expect(screen.getByText('Report #0142')).toBeTruthy();
    const facts = screen.getByText('Reported').parentElement!;
    expect(facts.textContent).toContain('Reported11/11/2026 · 09:12 WIB');
    expect(facts.textContent).toContain('Confirmed3 others');
    expect(facts.textContent).toMatch(/Pin−6\.89261, 107\.6099\d · ±12 m/);
    expect(screen.getByText('Technician scheduled for 12/11/2026.')).toBeTruthy();
  });

  it('starts on the current status', () => {
    renderDetail();

    const group = screen.getByRole('group', { name: 'Status' });
    expect((within(group).getByLabelText('Waiting') as HTMLInputElement).checked).toBe(true);
  });

  it('saves a new status with a note and says the reporter will be notified', async () => {
    const { fetchMock, onSaved } = renderDetail();

    fireEvent.click(screen.getByLabelText('In progress'));
    fireEvent.change(screen.getByLabelText('Note to reporter (optional)'), {
      target: { value: ' Crew booked for Friday. ' },
    });
    save();

    expect((await screen.findByRole('status')).textContent).toBe(
      'Saved. The reporter will see this in Notifications.',
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/admin/reports/145');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      status: 'in_progress',
      note: 'Crew booked for Friday.',
    });
    expect(onSaved).toHaveBeenCalled();
    expect(
      (screen.getByLabelText('Note to reporter (optional)') as HTMLTextAreaElement).value,
    ).toBe('');
  });

  it('can send only a note', async () => {
    const { fetchMock } = renderDetail();

    fireEvent.change(screen.getByLabelText('Note to reporter (optional)'), {
      target: { value: 'Looking into it.' },
    });
    save();

    await screen.findByRole('status');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ note: 'Looking into it.' });
  });

  it('asks for a change before saving', () => {
    const { fetchMock } = renderDetail();

    save();

    expect(screen.getByRole('alert').textContent).toBe('Change the status or write a note first.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks you to sign in again when the token is refused', async () => {
    const { onUnauthorized } = renderDetail(paving, () =>
      Response.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in' } }, { status: 401 }),
    );

    fireEvent.click(screen.getByLabelText('Done'));
    save();

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it('enlarges the photo', () => {
    renderDetail({ ...paving, photo: 'data:image/jpeg;base64,AAAA' });

    fireEvent.click(screen.getByRole('button', { name: "Enlarge the reporter's photo" }));

    const dialog = screen.getByRole('dialog', { name: 'Cracked paving by the main gate' });
    expect(within(dialog).getByRole('img').getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
  });
});
