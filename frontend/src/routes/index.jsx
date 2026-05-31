import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layout components (loaded immediately)
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleProtectedRoute from '../components/RoleProtectedRoute';

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Lazy load all pages
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Departments = lazy(() => import('../pages/Departments'));
const Labs = lazy(() => import('../pages/Labs'));
const Schedules = lazy(() => import('../pages/Schedules'));
const Kunjungan = lazy(() => import('../pages/Kunjungan'));
const Items = lazy(() => import('../pages/Items'));
const Loans = lazy(() => import('../pages/Loans'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Analytics = lazy(() => import('../pages/Analytics'));
const AdvancedAnalytics = lazy(() => import('../pages/AdvancedAnalytics'));
const QRCheckIn = lazy(() => import('../pages/QRCheckIn'));
const QRCodes = lazy(() => import('../pages/QRCodes'));
const TwoFactorSetup = lazy(() => import('../pages/TwoFactorSetup'));
const TwoFactorVerify = lazy(() => import('../pages/TwoFactorVerify'));

// Wrapper component for Suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspenseWrapper><Login /></SuspenseWrapper>,
  },
  {
    path: '/register',
    element: <SuspenseWrapper><Register /></SuspenseWrapper>,
  },
  {
    path: '/2fa-verify',
    element: <SuspenseWrapper><TwoFactorVerify /></SuspenseWrapper>,
  },
  {
    // Protected routes wrapper
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
           {
             index: true,
             element: <SuspenseWrapper><Dashboard /></SuspenseWrapper>,
           },
           // Profile and Settings (accessible to all authenticated users)
           {
             path: 'profile',
             element: <SuspenseWrapper><Profile /></SuspenseWrapper>,
           },
           {
             path: 'settings',
             element: <SuspenseWrapper><Settings /></SuspenseWrapper>,
           },
           {
             path: '2fa-setup',
             element: <SuspenseWrapper><TwoFactorSetup /></SuspenseWrapper>,
           },
           {
             path: 'analytics',
             element: <SuspenseWrapper><AdvancedAnalytics /></SuspenseWrapper>,
           },
           // QR Check-in (accessible to all authenticated users)
           {
             path: 'qr-checkin',
             element: <SuspenseWrapper><QRCheckIn /></SuspenseWrapper>,
           },
           // USER accessible routes
           {
             path: 'kunjungan',
             element: <SuspenseWrapper><Kunjungan /></SuspenseWrapper>,
           },
           {
             path: 'loans',
             element: <SuspenseWrapper><Loans /></SuspenseWrapper>,
           },
          // ADMIN_JURUSAN and SUPER_ADMIN only routes
          {
            element: <RoleProtectedRoute allowedRoles={['ADMIN_JURUSAN', 'SUPER_ADMIN']} />,
            children: [
              {
                path: 'labs',
                element: <SuspenseWrapper><Labs /></SuspenseWrapper>,
              },
              {
                path: 'schedules',
                element: <SuspenseWrapper><Schedules /></SuspenseWrapper>,
              },
              {
                path: 'items',
                element: <SuspenseWrapper><Items /></SuspenseWrapper>,
              },
              {
                path: 'qr-codes',
                element: <SuspenseWrapper><QRCodes /></SuspenseWrapper>,
              },
            ],
          },
          // SUPER_ADMIN only routes
          {
            element: <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
            children: [
              {
                path: 'departments',
                element: <SuspenseWrapper><Departments /></SuspenseWrapper>,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
  },
]);

export default router;