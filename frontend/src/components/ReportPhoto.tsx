import type { Report } from '../api/reports';
import styles from './ReportPhoto.module.css';

interface ReportPhotoProps {
  report: Pick<Report, 'photo' | 'description'>;
  size: 'thumb' | 'large';
}

/** The reporter's photo, or a grey "No photo" box. */
export function ReportPhoto({ report, size }: ReportPhotoProps) {
  const className = `${styles.photo} ${styles[size]}`;
  if (!report.photo) {
    return <div className={`${className} ${styles.empty}`}>No photo</div>;
  }
  return <img className={className} src={report.photo} alt={`Photo: ${report.description}`} />;
}
