import { useEffect, useId, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { createReport, listBuildings, type Building, type Report } from '../api/reports';
import { isInsideCampus, simulatedPosition } from '../lib/campusMap';
import { categories, type ReportCategory } from '../lib/categories';
import { distanceM, formatCoords, type LatLng } from '../lib/geo';
import { resizeImage } from '../lib/resizeImage';
import { useNearbyReport } from '../lib/useNearbyReport';
import { ConfirmButton } from './ConfirmButton';
import { CameraIcon, CloseIcon, CrosshairIcon } from './icons';
import styles from './NewReportForm.module.css';
import { PinPicker } from './PinPicker';

type Field = 'location' | 'photo' | 'category' | 'building' | 'floor' | 'description';
type Errors = Partial<Record<Field | 'form', string>>;

interface NewReportFormProps {
  /** Phone: a small map inside the form. Desktop: you place the pin on the big map. */
  variant: 'phone' | 'desktop';
  pin: LatLng | null;
  onPinChange: (pin: LatLng) => void;
  /** Shown on the phone's small map, so you can see what is already reported nearby. */
  reports: Report[];
  onSent: (report: Report) => void;
  /** After a "+1" from the duplicate warning: reload the counts. */
  onConfirmed: () => void;
  onClose?: () => void;
}

/** Where the current pin came from, and how accurate it is in metres. */
interface PinSource {
  pin: LatLng;
  kind: 'gps' | 'simulated';
  accuracyM: number;
}

/** A message for each way the browser can fail to give a position. */
function locationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location access is blocked. Allow it in your browser, or place the pin on the map.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Finding your location took too long. Try again, or place the pin on the map.';
  }
  return 'Couldn’t find your location. Try again, or place the pin on the map.';
}

/** The building whose centre is closest to the pin. */
function nearestBuilding(pin: LatLng | null, buildings: Building[]): string {
  let best = '';
  let bestDistance = Infinity;
  for (const b of buildings) {
    if (!pin || b.lat === null || b.lng === null) continue;
    const d = distanceM(pin, { lat: b.lat, lng: b.lng });
    if (d < bestDistance) [best, bestDistance] = [b.name, d];
  }
  return best;
}

/** Turns the API's per-field messages into the form's fields. */
function errorsFromApi(error: unknown): Errors {
  if (!(error instanceof ApiError)) return { form: 'Couldn’t send the report. Try again.' };
  if (error.code === 'PAYLOAD_TOO_LARGE') return { photo: 'This photo is too large.' };
  if (error.code !== 'VALIDATION_ERROR') {
    return {
      form: error.code === 'NETWORK' ? error.message : 'Couldn’t send the report. Try again.',
    };
  }
  const { lat, lng, description, category, building, floor, photo } = error.details;
  return {
    location: lat || lng ? 'This spot is outside the campus map.' : undefined,
    description,
    category,
    building,
    floor,
    photo,
  };
}

/** "Report damage": where, a photo, which building and floor, and what's wrong. */
export function NewReportForm(props: NewReportFormProps) {
  const { variant, pin, onPinChange, reports, onSent, onConfirmed, onClose } = props;
  const isPhone = variant === 'phone';
  const id = useId();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsFailed, setBuildingsFailed] = useState(false);
  // Until you pick a building yourself, the form suggests the one nearest the pin.
  const [chosenBuilding, setChosenBuilding] = useState<string | null>(null);
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [locating, setLocating] = useState(false);
  // Set by "Use my location" or the simulate select. Moving the pin by hand makes it stale.
  const [source, setSource] = useState<PinSource | null>(null);
  const pinSource =
    source && pin && source.pin.lat === pin.lat && source.pin.lng === pin.lng ? source : null;

  const nearby = useNearbyReport(pin);
  const building = chosenBuilding ?? nearestBuilding(pin, buildings);

  useEffect(() => {
    listBuildings().then(setBuildings, () => setBuildingsFailed(true));
  }, []);

  const placesToSimulate = buildings.filter((b) => b.lat !== null && b.lng !== null);

  /** Moves the pin and remembers where it came from, so its accuracy can be shown and sent. */
  function placePin(next: LatLng, kind: PinSource['kind'], accuracyM: number) {
    setSource({ pin: next, kind, accuracyM });
    setErrors((e) => ({ ...e, location: undefined }));
    onPinChange(next);
  }

  /** "Use my location": asks the browser for a GPS fix (it asks you for permission first). */
  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setErrors((e) => ({
        ...e,
        location: 'This browser can’t share your location. Place the pin on the map.',
      }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const here = { lat: coords.latitude, lng: coords.longitude };
        if (!isInsideCampus(here)) {
          setErrors((e) => ({
            ...e,
            location: 'You seem to be outside ITB Ganesha. Place the pin on the map instead.',
          }));
          return;
        }
        placePin(here, 'gps', Math.max(1, Math.round(coords.accuracy)));
      },
      (error) => {
        setLocating(false);
        setErrors((e) => ({ ...e, location: locationErrorMessage(error) }));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  // For testing away from campus: "stands" at a fixed spot or at a building.
  function simulateAt(value: string) {
    if (value === 'default') {
      placePin(
        { lat: simulatedPosition.lat, lng: simulatedPosition.lng },
        'simulated',
        simulatedPosition.accuracyM,
      );
      return;
    }
    const place = placesToSimulate.find((b) => b.name === value);
    if (place)
      placePin({ lat: place.lat!, lng: place.lng! }, 'simulated', simulatedPosition.accuracyM);
  }

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    setErrors((e) => ({ ...e, photo: undefined }));
    try {
      setPhoto(await resizeImage(file));
    } catch (error) {
      setErrors((e) => ({ ...e, photo: (error as Error).message }));
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const problems: Errors = {};
    if (!pin) problems.location = 'Click the map to place your pin, or use your location.';
    if (!photo) problems.photo = 'Add a photo of the damage.';
    if (!category) problems.category = 'Choose a category.';
    if (!building) problems.building = 'Choose a building.';
    if (description.trim().length < 5) {
      problems.description = 'Tell us what’s wrong (at least 5 characters).';
    }
    setErrors(problems);
    if (Object.keys(problems).length > 0 || !pin || !photo || !category) return;

    setSending(true);
    try {
      const report = await createReport({
        description: description.trim(),
        category,
        building,
        floor: floor.trim() || null,
        lat: pin.lat,
        lng: pin.lng,
        // Only a GPS or simulated pin has a known accuracy; the API has a default otherwise.
        ...(pinSource && { accuracyM: pinSource.accuracyM }),
        photo,
      });
      setChosenBuilding(null);
      setCategory('');
      setFloor('');
      setDescription('');
      setPhoto(null);
      setSource(null);
      onSent(report);
    } catch (error) {
      setErrors(errorsFromApi(error));
    } finally {
      setSending(false);
    }
  }

  // Wires a field to its error message for screen readers.
  const errorProps = (field: Field) =>
    errors[field]
      ? { 'aria-invalid': true, 'aria-describedby': `${id}-${field}-error` }
      : { 'aria-invalid': false };
  const errorText = (field: Field) =>
    errors[field] && (
      <p id={`${id}-${field}-error`} className={styles.error}>
        {errors[field]}
      </p>
    );

  return (
    <form
      className={`${styles.form} ${isPhone ? styles.phone : styles.desktop}`}
      onSubmit={send}
      noValidate
      aria-label="Report damage"
    >
      {!isPhone && (
        <header className={styles.header}>
          <h2 className={styles.heading}>Report damage</h2>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
      )}

      <fieldset
        className={styles.field}
        aria-describedby={errors.location ? `${id}-location-error` : undefined}
      >
        <legend className={isPhone ? styles.legendRow : styles.visuallyHidden}>
          <span className={styles.label}>Location</span>
          {isPhone && <span className={styles.hint}>Drag the map to adjust</span>}
        </legend>
        {isPhone && <PinPicker pin={pin} onChange={onPinChange} reports={reports} />}

        <div className={styles.locationRow}>
          <p className={styles.coords} aria-live="polite">
            {!isPhone && <strong>Pin: </strong>}
            {pin ? formatCoords(pin) : 'not placed yet'}
            <span className={styles.muted}>
              {!pin
                ? 'Click the map to place it'
                : pinSource?.kind === 'gps'
                  ? `Accurate to ±${pinSource.accuracyM} m`
                  : pinSource?.kind === 'simulated'
                    ? `Simulated, ±${pinSource.accuracyM} m`
                    : 'Placed on the map'}
            </span>
          </p>
          <div className={styles.locate}>
            <button
              type="button"
              className={styles.secondary}
              onClick={useMyLocation}
              disabled={locating}
            >
              <CrosshairIcon size={20} />
              {locating ? 'Finding you…' : 'Use my location'}
            </button>
            {/* For testing away from campus: "stand" at any building without GPS. */}
            <select
              className={styles.simulate}
              value=""
              aria-label="Simulate being at a building"
              onChange={(event) => simulateAt(event.target.value)}
            >
              <option value="" disabled>
                Simulate being at…
              </option>
              <option value="default">{simulatedPosition.label}</option>
              {placesToSimulate.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {errorText('location')}
      </fieldset>

      {nearby && (
        <div className={styles.warning} role="status">
          <p>
            <strong>Already reported {nearby.distanceM} m away</strong>
            <span>{nearby.description}</span>
          </p>
          <ConfirmButton key={nearby.id} report={nearby} onConfirmed={onConfirmed} tone="warning" />
        </div>
      )}

      <div className={styles.field}>
        <span className={styles.label} id={`${id}-photo-label`}>
          Photo
        </span>
        {photo ? (
          <div className={styles.preview}>
            <img src={photo} alt="Preview of your photo" />
            <button type="button" className={styles.secondary} onClick={() => setPhoto(null)}>
              Remove photo
            </button>
          </div>
        ) : (
          <label
            className={styles.dropZone}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void choosePhoto(event.dataTransfer.files[0]);
            }}
          >
            <CameraIcon />
            {isPhone ? 'Take or upload a photo' : 'Drop a photo here or click to upload'}
            <input
              type="file"
              accept="image/*"
              className={styles.visuallyHidden}
              aria-labelledby={`${id}-photo-label`}
              {...errorProps('photo')}
              onChange={(event) => void choosePhoto(event.target.files?.[0])}
            />
          </label>
        )}
        {errorText('photo')}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-category`}>
          Category
        </label>
        <select
          id={`${id}-category`}
          className={styles.input}
          value={category}
          onChange={(event) => setCategory(event.target.value as ReportCategory | '')}
          {...errorProps('category')}
        >
          <option value="">Choose…</option>
          {categories.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        {errorText('category')}
      </div>

      <div className={styles.row}>
        <div className={`${styles.field} ${styles.grow}`}>
          <label className={styles.label} htmlFor={`${id}-building`}>
            Building
          </label>
          <select
            id={`${id}-building`}
            className={styles.input}
            value={building}
            onChange={(event) => setChosenBuilding(event.target.value)}
            {...errorProps('building')}
          >
            <option value="">{buildingsFailed ? 'Couldn’t load buildings' : 'Choose…'}</option>
            {buildings.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          {errorText('building')}
        </div>
        <div className={`${styles.field} ${styles.floor}`}>
          <label className={styles.label} htmlFor={`${id}-floor`}>
            Floor
          </label>
          <input
            id={`${id}-floor`}
            className={styles.input}
            placeholder="e.g. 1"
            maxLength={20}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            {...errorProps('floor')}
          />
          {errorText('floor')}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-description`}>
          What&apos;s wrong?
        </label>
        <textarea
          id={`${id}-description`}
          className={`${styles.input} ${styles.textarea}`}
          placeholder="e.g. The lamp by the east stairs has been out for days"
          rows={isPhone ? 2 : 3}
          maxLength={280}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          {...errorProps('description')}
        />
        {errorText('description')}
      </div>

      {errors.form && (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={sending}>
        {sending ? 'Sending…' : 'Send report'}
      </button>
    </form>
  );
}
