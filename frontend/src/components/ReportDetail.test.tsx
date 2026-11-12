import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeReport } from '../test/fixtures';
import { ReportDetail } from './ReportDetail';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderDetail = (report = makeReport(), onConfirmed = vi.fn()) => {
  render(<ReportDetail report={report} onClose={vi.fn()} onConfirmed={onConfirmed} />);
  return { onConfirmed };
};

describe('ReportDetail', () => {
  it('shows the number, description, place and note', () => {
    renderDetail();

    expect(screen.getByText('Report #0142')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lamp by the east stairs is out' })).toBeTruthy();
    expect(screen.getByText('Aula Barat · Floor 1')).toBeTruthy();
    expect(screen.getByText('Technician scheduled for 12/11/2026.')).toBeTruthy();
    expect(screen.getByText('No photo')).toBeTruthy();
  });

  it('shows the timeline with WIB dates and "Not yet"', () => {
    renderDetail();

    const steps = within(screen.getByRole('list', { name: 'Progress' })).getAllByRole('listitem');
    expect(steps.map((step) => step.textContent)).toEqual([
      'Reported11/11/2026 · 09:12 WIB',
      'In progress11/11/2026 · 11:20 WIB',
      'DoneNot yet',
    ]);
  });

  it('shows the photo when there is one', () => {
    renderDetail(makeReport({ photo: 'data:image/jpeg;base64,AAAA' }));

    expect(screen.getByRole('img', { name: 'Photo: Lamp by the east stairs is out' })).toBeTruthy();
  });

  it('counts the others who confirmed', () => {
    renderDetail();

    expect(screen.getByText('3 others confirmed this')).toBeTruthy();
  });

  it('hides the +1 button on your own report', () => {
    renderDetail(makeReport({ isMine: true }));

    expect(screen.queryByRole('button', { name: /Same problem/ })).toBeNull();
  });

  it('sends a +1 once, then disables the button', async () => {
    const fetchMock = vi.fn(async () => Response.json({ confirmations: 4 }));
    vi.stubGlobal('fetch', fetchMock);
    const { onConfirmed } = renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Same problem here (+1)' }));

    const done = await screen.findByRole('button', { name: 'You confirmed this' });
    expect((done as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/reports/142/confirmations', expect.anything());
    expect(onConfirmed).toHaveBeenCalled();
  });

  it('remembers the +1 after a reload', () => {
    localStorage.setItem('sipkak.confirmed', '[142]');
    renderDetail();

    expect(
      (screen.getByRole('button', { name: 'You confirmed this' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('disables the button when the API says you already confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: { code: 'CONFLICT', message: 'Already' } }, { status: 409 }),
      ),
    );
    const { onConfirmed } = renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Same problem here (+1)' }));

    expect(await screen.findByRole('button', { name: 'You confirmed this' })).toBeTruthy();
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('says so when the +1 could not be sent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Same problem here (+1)' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Couldn’t send your +1. Try again.',
    );
    expect(screen.getByRole('button', { name: 'Same problem here (+1)' })).toBeTruthy();
  });
});
