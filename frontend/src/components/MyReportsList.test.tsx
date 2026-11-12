import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeReport } from '../test/fixtures';
import { MyReportsList } from './MyReportsList';

afterEach(cleanup);

const reports = [
  makeReport({ id: 146, description: 'Broken window', isMine: true, status: 'waiting' }),
  makeReport({ id: 145, description: 'Cracked paving by the main gate', status: 'waiting' }),
  makeReport({ id: 142, isMine: true }),
  makeReport({
    id: 98,
    description: 'Tap leaking in the men’s toilet',
    building: 'CC Timur',
    isMine: true,
    status: 'waiting',
    createdAt: '2026-10-21T03:05:00Z',
  }),
];

function renderList(variant: 'phone' | 'desktop', list = reports, onSelect = vi.fn()) {
  render(
    <MemoryRouter>
      <MyReportsList reports={list} loading={false} onSelect={onSelect} variant={variant} />
    </MemoryRouter>,
  );
  return { onSelect };
}

const rows = () => screen.getAllByRole('button');

describe('MyReportsList', () => {
  it('lists only your reports, newest first', () => {
    renderList('phone');

    expect(rows().map((row) => row.querySelector('span span')?.textContent)).toEqual([
      'Broken window',
      'Lamp by the east stairs is out',
      'Tap leaking in the men’s toilet',
    ]);
  });

  it('shows "Sent <date>" and the full status on the phone', () => {
    renderList('phone');

    expect(screen.getByText('Saved on this phone · no account needed')).toBeTruthy();
    const tap = rows()[2];
    expect(within(tap).getByText('Sent 21/10/2026 · 10:05 WIB')).toBeTruthy();
    expect(within(tap).getByText('Waiting for review')).toBeTruthy();
    expect(within(rows()[1]).getByText('In progress')).toBeTruthy();
    expect(screen.queryByText('Sent by you')).toBeNull();
  });

  it('uses the short desktop rows', () => {
    renderList('desktop');

    expect(screen.getByText('Saved on this browser · no account needed')).toBeTruthy();
    expect(within(rows()[2]).getByText('21/10/2026 · 10:05 WIB')).toBeTruthy();
    expect(within(rows()[2]).getByText('Waiting')).toBeTruthy();
  });

  it('opens a report when its row is clicked', () => {
    const { onSelect } = renderList('phone');

    fireEvent.click(rows()[1]);

    expect(onSelect).toHaveBeenCalledWith(142);
  });

  it('points to the form when you have sent nothing yet', () => {
    renderList('phone', [reports[1]]);

    expect(screen.getByText('You haven’t sent any reports yet.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Report damage' }).getAttribute('href')).toBe(
      '/report/new',
    );
  });
});
