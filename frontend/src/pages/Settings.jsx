import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    appearance: {
      theme: 'light',
      language: 'id',
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
    },
  });

  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTwoFAStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/2fa/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTwoFAStatus(response.data.data);
      } catch (err) {
        console.error('Failed to fetch 2FA status:', err);
      }
    };

    if (token) {
      fetchTwoFAStatus();
    }
  }, [token, API_URL]);

  const handleSaveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
      appearance: {
        theme: 'light',
        language: 'id',
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
      },
    };
    setSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
    toast.success('Settings reset to default');
  };

  const handleSetup2FA = () => {
    navigate('/2fa-setup');
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/auth/2fa/disable`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTwoFAStatus({ enabled: false, backupCodesRemaining: 0 });
      toast.success('2FA disabled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const password = prompt('Enter your password to regenerate backup codes:');
    if (!password) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/auth/2fa/backup-codes/regenerate`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const codes = response.data.data.backupCodes;
      const codesText = codes.join('\n');
      navigator.clipboard.writeText(codesText);
      toast.success('Backup codes regenerated and copied to clipboard');
      
      const statusResponse = await axios.get(`${API_URL}/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFAStatus(statusResponse.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your application preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Manage how you receive notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive push notifications in browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings - 2FA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security</h3>
              <p className="text-sm text-gray-600">Manage your account security</p>
            </div>
          </div>

          <div className="space-y-4">
            {twoFAStatus && (
              <>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">
                      {twoFAStatus.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    twoFAStatus.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {twoFAStatus.enabled ? '✓ Active' : 'Inactive'}
                  </div>
                </div>

                {twoFAStatus.enabled && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Backup codes remaining: <span className="font-semibold">{twoFAStatus.backupCodesRemaining}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!twoFAStatus.enabled ? (
                    <button
                      onClick={handleSetup2FA}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      Enable 2FA
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleRegenerateBackupCodes}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        Regenerate Codes
                      </button>
                      <button
                        onClick={handleDisable2FA}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        Disable 2FA
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
              <p className="text-sm text-gray-600">Customize how the app looks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, theme: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.appearance.language}
                onChange={(e) => setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, language: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
              <p className="text-sm text-gray-600">Control your privacy settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Visibility
              </label>
              <select
                value={settings.privacy.profileVisibility}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, profileVisibility: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Show Email Address</p>
                <p className="text-sm text-gray-600">Display email on your profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.showEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, showEmail: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
              <p className="text-sm text-gray-600">Application details</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Version:</span>
              <span className="text-gray-900 font-medium">2.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900 font-medium">31 Mei 2026</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Environment:</span>
              <span className="text-gray-900 font-medium">Production</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Build:</span>
              <span className="text-gray-900 font-medium font-mono text-xs">phase-4-2fa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          Save Settings
        </button>
        <button
          onClick={handleResetSettings}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
