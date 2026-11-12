import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Report } from '../api/reports';
import type { LatLng } from '../lib/geo';
import { makeReport, mockGeolocation } from '../test/fixtures';
import { NewReportForm } from './NewReportForm';

// jsdom can't draw on a canvas, so pretend every photo resizes to this.
vi.mock('../lib/resizeImage', () => ({
  resizeImage: vi.fn(async () => 'data:image/jpeg;base64,RESIZED'),
}));

const lamp = { ...makeReport(), distanceM: 26 };
let fetchMock: ReturnType<typeof vi.fn>;

/** A fake API: buildings, nearby (the lamp is 26 m from the simulated spot) and create. */
function fakeApi(createResponse: () => Response = () => Response.json(makeReport({ id: 146 }))) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/buildings') {
      return Response.json({
        buildings: [
          { name: 'Aula Barat', lat: -6.89246, lng: 107.609824 },
          { name: 'Labtek V', lat: -6.890588, lng: 107.609788 },
          { name: 'Outdoor area / walkway', lat: null, lng: null },
        ],
      });
    }
    if (url.startsWith('/api/reports/nearby')) {
      const near = url.includes('lat=-6.89258&');
      return Response.json({ reports: near ? [lamp] : [] });
    }
    if (url === '/api/reports' && init?.method === 'POST') return createResponse();
    return Response.json({});
  });
  vi.stubGlobal('fetch', fetchMock);
}

const nearbyCalls = () =>
  fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/reports/nearby'));

/** The form with its pin kept in state, like the layouts do. */
function Harness({
  variant = 'desktop',
  onSent = vi.fn(),
}: {
  variant?: 'phone' | 'desktop';
  onSent?: (r: Report) => void;
}) {
  const [pin, setPin] = useState<LatLng | null>(null);
  return (
    <NewReportForm
      variant={variant}
      pin={pin}
      onPinChange={setPin}
      reports={[]}
      onSent={onSent}
      onConfirmed={vi.fn()}
      onClose={vi.fn()}
    />
  );
}

async function renderForm(onSent = vi.fn()) {
  render(<Harness onSent={onSent} />);
  // Wait for the building list to arrive (both selects list the buildings).
  await screen.findAllByRole('option', { name: 'Labtek V' });
  return { onSent };
}

const buildingSelect = () => screen.getByLabelText('Building') as HTMLSelectElement;

/** Picks a category and a photo, the two fields every report needs besides the text. */
async function addCategoryAndPhoto(category = 'other') {
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: category } });
  const file = new File(['fake'], 'crack.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Photo'), { target: { files: [file] } });
  await screen.findByRole('img', { name: 'Preview of your photo' });
}

// "Use my location" finds you 26 m from the lamp report, ±12 m.
const atAulaBarat = { lat: -6.89258, lng: 107.61015, accuracy: 12 };

beforeEach(() => {
  fakeApi();
  mockGeolocation(atAulaBarat);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('location', () => {
  it('"Use my location" moves the pin to your GPS position and picks the nearest building', async () => {
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(screen.getByText('−6.89258, 107.61015')).toBeTruthy();
    expect(screen.getByText('Accurate to ±12 m')).toBeTruthy();
    expect(buildingSelect().value).toBe('Aula Barat');
  });

  it('warns about a report 26 m away, 400 ms after the pin stops moving', async () => {
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(nearbyCalls()).toHaveLength(0);

    const warning = await screen.findByRole('status');
    expect(warning.textContent).toContain('Already reported 26 m away');
    expect(warning.textContent).toContain('Lamp by the east stairs is out');
    expect(screen.getByRole('button', { name: 'Same problem (+1)' })).toBeTruthy();
    expect(nearbyCalls()).toHaveLength(1);
  });

  it('shows the GPS accuracy it got', async () => {
    mockGeolocation({ ...atAulaBarat, accuracy: 7.6 });
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(screen.getByText('Accurate to ±8 m')).toBeTruthy();
  });

  it('asks you to place the pin when location access is blocked', async () => {
    mockGeolocation({ errorCode: 1 });
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(
      screen.getByText(
        'Location access is blocked. Allow it in your browser, or place the pin on the map.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('not placed yet')).toBeTruthy();
  });

  it('does not move the pin when you are outside the campus', async () => {
    mockGeolocation({ lat: -6.9, lng: 107.6, accuracy: 10 });
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(
      screen.getByText('You seem to be outside ITB Ganesha. Place the pin on the map instead.'),
    ).toBeTruthy();
    expect(screen.getByText('not placed yet')).toBeTruthy();
  });

  it('can "stand" at any building with the simulate select', async () => {
    await renderForm();

    fireEvent.change(screen.getByLabelText('Simulate being at a building'), {
      target: { value: 'Labtek V' },
    });

    expect(screen.getByText('−6.89059, 107.60979')).toBeTruthy();
    expect(buildingSelect().value).toBe('Labtek V');
    // Nothing else is reported near there.
    await waitFor(() => expect(nearbyCalls()).toHaveLength(1));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps the building you chose yourself when the pin moves', async () => {
    await renderForm();

    fireEvent.change(buildingSelect(), { target: { value: 'Labtek V' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(buildingSelect().value).toBe('Labtek V');
  });
});

describe('validation', () => {
  it('shows messages next to the fields and sends nothing', async () => {
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));

    expect(screen.getByText('Click the map to place your pin, or use your location.')).toBeTruthy();
    expect(screen.getByText('Choose a building.')).toBeTruthy();
    expect(screen.getByText('Choose a category.')).toBeTruthy();
    expect(screen.getByText('Add a photo of the damage.')).toBeTruthy();
    const description = screen.getByLabelText("What's wrong?");
    expect(description.getAttribute('aria-invalid')).toBe('true');
    expect(
      document.getElementById(description.getAttribute('aria-describedby')!)?.textContent,
    ).toBe('Tell us what’s wrong (at least 5 characters).');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/reports', expect.anything());
  });

  it('shows the API’s field messages too', async () => {
    fakeApi(() =>
      Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: { floor: 'At most 20 characters' },
          },
        },
        { status: 400 },
      ),
    );
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await addCategoryAndPhoto();
    fireEvent.change(screen.getByLabelText("What's wrong?"), {
      target: { value: 'Broken window' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText('At most 20 characters')).toBeTruthy();
  });
});

describe('photo', () => {
  it('shrinks the photo and shows a preview you can remove', async () => {
    await renderForm();

    const file = new File(['fake'], 'crack.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Photo'), { target: { files: [file] } });

    const preview = await screen.findByRole('img', { name: 'Preview of your photo' });
    expect(preview.getAttribute('src')).toBe('data:image/jpeg;base64,RESIZED');

    fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('sending', () => {
  it('sends the report and hands it back', async () => {
    const { onSent } = await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await addCategoryAndPhoto('lighting');
    fireEvent.change(screen.getByLabelText('Floor'), { target: { value: ' 1 ' } });
    fireEvent.change(screen.getByLabelText("What's wrong?"), {
      target: { value: '  Broken window in the stairwell ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));

    await waitFor(() => expect(onSent).toHaveBeenCalledWith(expect.objectContaining({ id: 146 })));
    const post = fetchMock.mock.calls.find(([url, init]) => url === '/api/reports' && init?.method);
    expect(JSON.parse(post![1].body)).toEqual({
      description: 'Broken window in the stairwell',
      category: 'lighting',
      building: 'Aula Barat',
      floor: '1',
      lat: -6.89258,
      lng: 107.61015,
      accuracyM: 12,
      photo: 'data:image/jpeg;base64,RESIZED',
    });
    // The form is empty again for the next report.
    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('');
    // The form is empty again for the next report.
    expect((screen.getByLabelText("What's wrong?") as HTMLTextAreaElement).value).toBe('');
  });
});

describe('phone', () => {
  it('has its own small map to drag', async () => {
    render(<Harness variant="phone" />);

    expect(await screen.findByText('Drag the map to adjust')).toBeTruthy();
    expect(document.querySelector('.leaflet-container')).toBeTruthy();
    expect(screen.getByText('Take or upload a photo')).toBeTruthy();
  });
});
