import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Login } from '@/pages/Login';
import { RequireAuth } from '@/pages/RequireAuth';
import { EmployeesPage } from '@/pages/manager/EmployeesPage';
import { ManagerLayout } from '@/pages/manager/ManagerLayout';
import { StaffLayout } from '@/pages/staff/StaffLayout';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={
        user!.role === 'EMPLOYER' ? '/manager/employees' : '/staff/availability'
      }
      replace
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth role="EMPLOYER" />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Navigate to="employees" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route
              path="employees/new"
              element={
                <PlaceholderPage title="Register employee" issue="#15" />
              }
            />
            <Route
              path="employees/:id"
              element={<PlaceholderPage title="Edit employee" issue="#15" />}
            />
            <Route
              path="job-schedule"
              element={<PlaceholderPage title="Job schedule" issue="#16" />}
            />
            <Route
              path="work-schedule"
              element={<PlaceholderPage title="Work schedule" issue="#30" />}
            />
          </Route>
        </Route>

        <Route element={<RequireAuth role="EMPLOYEE" />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="availability" replace />} />
            <Route
              path="availability"
              element={<PlaceholderPage title="My availability" issue="#17" />}
            />
            <Route
              path="schedule"
              element={<PlaceholderPage title="My schedule" issue="#18" />}
            />
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
