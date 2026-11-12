import type { Report, ReportStatus } from '../api/reports';
import { statuses, statusLabels } from '../lib/status';
import styles from './StatusFilter.module.css';

export type StatusFilterValue = ReportStatus | 'all';

interface StatusFilterProps {
  /** All reports: the counts are worked out from these. */
  reports: Report[];
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

/** "All 8 · Waiting 4 · In progress 2 · Done 2". The chosen one is underlined. */
export function StatusFilter({ reports, value, onChange }: StatusFilterProps) {
  const options: { value: StatusFilterValue; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: reports.length },
    ...statuses.map((status) => ({
      value: status,
      label: statusLabels[status].short,
      count: reports.filter((r) => r.status === status).length,
    })),
  ];

  return (
    <div className={styles.filter} role="group" aria-label="Show reports">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label} <span className={styles.count}>{option.count}</span>
        </button>
      ))}
    </div>
  );
}
