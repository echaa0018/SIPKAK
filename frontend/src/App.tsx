import { Navigate, Route, Routes } from 'react-router';
import { ReporterShell } from './components/ReporterShell';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      {/* The shell stays mounted across these routes and reads the path itself,
          so the desktop map isn't rebuilt when you switch tabs. */}
      <Route element={<ReporterShell />}>
        <Route index />
        <Route path="list" />
        <Route path="report/new" />
        <Route path="mine" />
        <Route path="notifications" />
      </Route>

      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route
        path="admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
