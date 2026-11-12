import { categories, type ReportCategory } from '../lib/categories';
import styles from './CategoryFilter.module.css';

export type CategoryFilterValue = ReportCategory | 'all';

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

/** A drop-down that narrows the admin's list and map to one kind of damage. */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <label className={styles.filter}>
      <span className={styles.label}>Category</span>
      <select
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value as CategoryFilterValue)}
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
