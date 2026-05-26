import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'ADMIN_JURUSAN': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'USER': return 'bg-gradient-to-r from-green-500 to-teal-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN_JURUSAN': return 'Admin Jurusan';
      case 'USER': return 'User';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-4 lg:px-6 shadow-sm">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none transition-colors p-2 rounded-lg hover:bg-gray-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" /> {/* Spacer */}

      {/* Notifications */}
      <button className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      </button>

      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all p-2 rounded-lg hover:bg-gray-100"
        >
          <div className={`w-10 h-10 rounded-full ${getRoleBadgeColor(user?.role)} flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-105 transition-transform`}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
          </div>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in">
            <div className={`${getRoleBadgeColor(user?.role)} px-4 py-3 text-white`}>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-xs opacity-90">{user?.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                {getRoleLabel(user?.role)}
              </span>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}