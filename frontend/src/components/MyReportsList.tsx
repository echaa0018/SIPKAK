import { Link } from 'react-router';
import type { Report } from '../api/reports';
import { ReportList } from './ReportList';

interface MyReportsListProps {
  reports: Report[];
  loading: boolean;
  onSelect: (id: number) => void;
  selectedId?: number;
  variant: 'phone' | 'desktop';
}

/**
 * "My reports": the reports sent from this browser, newest first. There are no accounts: the
 * API marks a report `isMine` when it was sent with this browser's reporter ID.
 */
export function MyReportsList({ reports, variant, ...rest }: MyReportsListProps) {
  const mine = reports.filter((report) => report.isMine);
  const device = variant === 'phone' ? 'phone' : 'browser';

  return (
    <ReportList
      {...rest}
      reports={mine}
      variant={variant}
      kind="mine"
      summary={`Saved on this ${device} · no account needed`}
      empty={
        <>
          <p>You haven’t sent any reports yet.</p>
          <Link to="/report/new">Report damage</Link>
        </>
      }
    />
  );
}
