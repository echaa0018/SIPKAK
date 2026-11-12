import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { getAdminToken } from '../lib/adminSession';

/** Shows the admin pages only when signed in; otherwise sends you to /admin/login and back. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
