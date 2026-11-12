import styles from './FacilitiesNote.module.css';

/** The latest note from the facilities team, in a soft grey box. */
export function FacilitiesNote({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <p className={styles.note}>
      <strong>Note from facilities:</strong> {note}
    </p>
  );
}
