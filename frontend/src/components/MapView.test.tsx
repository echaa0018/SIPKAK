import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { makeReport } from '../test/fixtures';
import { MapView } from './MapView';

afterEach(cleanup);

const reports = [
  makeReport({ id: 145, description: 'Cracked paving by the main gate', status: 'waiting' }),
  makeReport({ id: 142 }),
  makeReport({ id: 127, description: 'Broken chair, third row', status: 'done' }),
];

describe('MapView', () => {
  it('shows one labelled marker per report', () => {
    render(<MapView reports={reports} variant="desktop" />);

    expect(
      screen.getByRole('button', { name: 'Cracked paving by the main gate, Waiting for review' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Lamp by the east stairs is out, In progress' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Broken chair, third row, Done' })).toBeTruthy();
  });

  it('draws each status in its own style, with a check for done', () => {
    const { container } = render(<MapView reports={reports} variant="desktop" />);
    const markers = container.querySelectorAll('.leaflet-marker-icon span');

    expect(markers).toHaveLength(3);
    expect([...markers].map((m) => m.className)).toEqual([
      expect.stringContaining('waiting'),
      expect.stringContaining('in_progress'),
      expect.stringContaining('done'),
    ]);
    expect(markers[2].querySelector('svg')).toBeTruthy();
  });

  it('puts the campus map image on the map', () => {
    const { container } = render(<MapView reports={[]} variant="phone" />);

    const image = container.querySelector('img.leaflet-image-layer');
    expect(image?.getAttribute('src')).toBe('/map/itb-ganesha-map.svg');
  });

  it('shows the legend and the OpenStreetMap credit', () => {
    render(<MapView reports={[]} variant="desktop" />);

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend.textContent).toBe('Waiting for reviewIn progressDone');
    expect(screen.getByText('© OpenStreetMap contributors')).toBeTruthy();
  });

  it('uses short legend labels and no zoom buttons on the phone', () => {
    render(<MapView reports={[]} variant="phone" />);

    expect(screen.getByRole('list', { name: 'Legend' }).textContent).toBe('WaitingIn progressDone');
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
  });
});
