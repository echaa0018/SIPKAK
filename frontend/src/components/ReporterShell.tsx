import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { Notification } from '../api/notifications';
import type { Report } from '../api/reports';
import { useIsDesktop } from '../lib/useIsDesktop';
import { useNotifications } from '../lib/useNotifications';
import { useReports } from '../lib/useReports';
import { DesktopLayout } from './DesktopLayout';
import { PhoneLayout } from './PhoneLayout';

/** Which reporter screen the URL asks for. */
export type ReporterView = 'map' | 'list' | 'new' | 'mine' | 'notifications';

const viewByPath: Record<string, ReporterView> = {
  '/': 'map',
  '/list': 'list',
  '/report/new': 'new',
  '/mine': 'mine',
  '/notifications': 'notifications',
};

/** What both layouts get from the shell. */
export interface LayoutProps {
  view: ReporterView;
  reports: Report[];
  loading: boolean;
  loadError: boolean;
  /** The report in the URL (?report=142), if any. */
  selected: Report | undefined;
  onSelect: (id: number) => void;
  onCloseSelected: () => void;
  /** Fetch the reports again after a change (a +1, a new report). */
  reload: () => void;
  notifications: Notification[];
  unread: number;
  /** Marks the notification read and opens its report. */
  onOpenNotification: (notification: Notification) => void;
}

/** The reporter app: the phone layout below 900 px, the three-pane desktop layout above. */
export function ReporterShell() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const view = viewByPath[pathname] ?? 'map';
  const { reports, loading, error, reload } = useReports();

  // The selected report lives in the URL, so it survives a reload and can be shared.
  const selectedId = Number(searchParams.get('report'));
  const selected = reports.find((report) => report.id === selectedId);

  // On the phone a selected report always opens on the map. On desktop the left tab stays,
  // except on the form, where the right pane is taken.
  const onSelect = (id: number) => {
    const target = isDesktop && view !== 'new' ? pathname : '/';
    navigate({ pathname: target, search: `?report=${id}` });
  };
  const onCloseSelected = () => navigate({ pathname, search: '' });

  const { notifications, unread, markRead } = useNotifications();
  const onOpenNotification = (notification: Notification) => {
    markRead(notification.id);
    onSelect(notification.reportId);
  };

  const Layout = isDesktop ? DesktopLayout : PhoneLayout;
  return (
    <Layout
      view={view}
      reports={reports}
      loading={loading}
      loadError={error}
      selected={selected}
      onSelect={onSelect}
      onCloseSelected={onCloseSelected}
      reload={reload}
      notifications={notifications}
      unread={unread}
      onOpenNotification={onOpenNotification}
    />
  );
}
