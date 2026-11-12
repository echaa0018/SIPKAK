import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeReport } from '../test/fixtures';
import { ReportSentDialog } from './ReportSentDialog';

afterEach(cleanup);

const sent = makeReport({ id: 146, createdAt: '2026-11-11T04:32:00Z' });

function renderDialog(variant: 'phone' | 'desktop') {
  const onClose = vi.fn();
  const onSeeMine = vi.fn();
  render(
    <ReportSentDialog report={sent} variant={variant} onClose={onClose} onSeeMine={onSeeMine} />,
  );
  return { onClose, onSeeMine, dialog: screen.getByRole('dialog', { name: 'Report sent' }) };
}

describe('ReportSentDialog', () => {
  it('shows the number and the WIB time', () => {
    const { dialog } = renderDialog('phone');

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getByText('#0146 · 11/11/2026 · 11:32 WIB')).toBeTruthy();
  });

  it('offers "See it in My reports" first and "Back to map" on the phone', () => {
    const { dialog, onClose, onSeeMine } = renderDialog('phone');
    const buttons = within(dialog).getAllByRole('button');

    expect(buttons.map((b) => b.textContent)).toEqual(['See it in My reports', 'Back to map']);
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.click(buttons[1]);
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(buttons[0]);
    expect(onSeeMine).toHaveBeenCalled();
  });

  it('offers "Close" and "See it in My reports" on desktop', () => {
    const { dialog } = renderDialog('desktop');

    expect(
      within(dialog)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Close', 'See it in My reports']);
    expect(dialog.textContent).toContain('notification here when');
  });

  it('closes with Escape and keeps Tab inside', () => {
    const { dialog, onClose } = renderDialog('desktop');
    const [first, last] = within(dialog).getAllByRole('button');

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
