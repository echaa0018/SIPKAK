import { describe, expect, it } from 'vitest';
import { confirmationsText, formatPlace, notificationTitle, reportNumber } from './reportText';

describe('reportNumber', () => {
  it('pads the id to four digits', () => {
    expect(reportNumber(142)).toBe('#0142');
    expect(reportNumber(98)).toBe('#0098');
    expect(reportNumber(12345)).toBe('#12345');
  });
});

describe('formatPlace', () => {
  it('writes a numbered floor as "Floor n"', () => {
    expect(formatPlace({ building: 'Aula Barat', floor: '1' })).toBe('Aula Barat · Floor 1');
  });

  it('writes a named floor as "… floor"', () => {
    expect(formatPlace({ building: 'Labtek XI', floor: 'Ground' })).toBe(
      'Labtek XI · Ground floor',
    );
  });

  it('keeps a floor that already says "floor"', () => {
    expect(formatPlace({ building: 'CC Timur', floor: 'Top floor' })).toBe('CC Timur · Top floor');
  });

  it('shows only the building without a floor', () => {
    expect(formatPlace({ building: 'Main gate (Jl. Ganesha)', floor: null })).toBe(
      'Main gate (Jl. Ganesha)',
    );
  });
});

describe('notificationTitle', () => {
  it('says what changed', () => {
    expect(notificationTitle({ kind: 'status', status: 'in_progress' })).toBe(
      'Your report is now In progress',
    );
    expect(notificationTitle({ kind: 'status', status: 'done' })).toBe('Your report is Done');
    expect(notificationTitle({ kind: 'status', status: 'waiting' })).toBe(
      'Your report is now Waiting for review',
    );
    expect(notificationTitle({ kind: 'note', status: null })).toBe(
      'Admin added a note to your report',
    );
  });
});

describe('confirmationsText', () => {
  it('counts the others who confirmed', () => {
    expect(confirmationsText(3)).toBe('3 others confirmed this');
    expect(confirmationsText(1)).toBe('1 other confirmed this');
    expect(confirmationsText(0)).toBe('No one else has confirmed this yet');
  });
});
