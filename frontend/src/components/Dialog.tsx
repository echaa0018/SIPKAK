import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

const focusable = 'a[href], button:not([disabled]), input, select, textarea';

interface DialogProps {
  /** id of the element that names the dialog (its heading). */
  labelledBy: string;
  describedBy?: string;
  /** Escape and a click on the dimmed backdrop call this. */
  onClose: () => void;
  /** "sheet" slides up from the bottom (phone); "centered" floats in the middle (desktop). */
  variant: 'sheet' | 'centered';
  children: ReactNode;
}

/**
 * A modal pop-up. Focus moves into it when it opens, stays inside while you Tab, and goes back
 * where it was when it closes.
 */
export function Dialog({ labelledBy, describedBy, onClose, variant, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>(focusable)?.focus();
    return () => previous?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !ref.current) return;
    // Wrap Tab from the last button to the first, and Shift+Tab the other way.
    const items = [...ref.current.querySelectorAll<HTMLElement>(focusable)];
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return createPortal(
    <div
      className={`${styles.backdrop} ${styles[variant]}`}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
