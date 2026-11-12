import { Navigate, Route, Routes } from 'react-router';
import { ReporterShell } from './components/ReporterShell';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
