import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import useAuth from '../../hooks/useAuth';

// Navigation items berdasarkan role
const getNavigationByRole = (role) => {
  // Menu untuk USER - hanya Dashboard, Kunjungan, Peminjaman
  if (role === 'USER') {
    return [
      { name: 'Dashboard', href: '/', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
      { name: 'Kunjungan', href: '/kunjungan', icon: '👥', gradient: 'from-purple-500 to-pink-500' },
      { name: 'Peminjaman', href: '/loans', icon: '📋', gradient: 'from-green-500 to-teal-500' },
    ];
  }

  // Menu untuk ADMIN_JURUSAN - USER menu + management features
  if (role === 'ADMIN_JURUSAN') {
    return [
      { name: 'Dashboard', href: '/', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
      { name: 'Analytics', href: '/analytics', icon: '📈', gradient: 'from-cyan-500 to-blue-500' },
      { name: 'Kunjungan', href: '/kunjungan', icon: '👥', gradient: 'from-purple-500 to-pink-500' },
      { name: 'Peminjaman', href: '/loans', icon: '📋', gradient: 'from-green-500 to-teal-500' },
      { name: 'Labs', href: '/labs', icon: '🧪', gradient: 'from-orange-500 to-red-500' },
      { name: 'Items', href: '/items', icon: '📦', gradient: 'from-yellow-500 to-orange-500' },
      { name: 'Schedules', href: '/schedules', icon: '📅', gradient: 'from-indigo-500 to-purple-500' },
    ];
  }

  // Menu untuk SUPER_ADMIN - semua menu
  if (role === 'SUPER_ADMIN') {
    return [
      { name: 'Dashboard', href: '/', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
      { name: 'Analytics', href: '/analytics', icon: '📈', gradient: 'from-cyan-500 to-blue-500' },
      { name: 'Kunjungan', href: '/kunjungan', icon: '👥', gradient: 'from-purple-500 to-pink-500' },
      { name: 'Peminjaman', href: '/loans', icon: '📋', gradient: 'from-green-500 to-teal-500' },
      { name: 'Departments', href: '/departments', icon: '🏫', gradient: 'from-pink-500 to-rose-500' },
      { name: 'Labs', href: '/labs', icon: '🧪', gradient: 'from-orange-500 to-red-500' },
      { name: 'Items', href: '/items', icon: '📦', gradient: 'from-yellow-500 to-orange-500' },
      { name: 'Schedules', href: '/schedules', icon: '📅', gradient: 'from-indigo-500 to-purple-500' },
    ];
  }

  // Default fallback untuk USER
  return [
    { name: 'Dashboard', href: '/', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Kunjungan', href: '/kunjungan', icon: '👥', gradient: 'from-purple-500 to-pink-500' },
    { name: 'Peminjaman', href: '/loans', icon: '📋', gradient: 'from-green-500 to-teal-500' },
  ];
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const navigation = getNavigationByRole(user?.role || 'USER');

  return (
    <>
      {/* Backdrop overlay - hanya muncul di mobile saat sidebar open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700/50 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🧪</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              LabManager
            </h1>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mx-4 mt-4 p-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl backdrop-blur-sm border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Animated background on hover */}
                  {!isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  )}
                  
                  <span className="relative z-10 text-xl mr-3 transform group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </span>
                  <span className="relative z-10">{item.name}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <div className="text-center text-xs text-gray-500">
            <p className="mb-1">School Lab System</p>
            <p className="text-gray-600">v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
