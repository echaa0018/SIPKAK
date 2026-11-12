import { useLocation } from 'react-router';
import { useIsDesktop } from '../lib/useIsDesktop';
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

/** The reporter app: the phone layout below 900 px, the three-pane desktop layout above. */
export function ReporterShell() {
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const view = viewByPath[pathname] ?? 'map';
  const { reports, error } = useReports();

  const Layout = isDesktop ? DesktopLayout : PhoneLayout;
  return <Layout view={view} reports={reports} loadError={error} />;
}
