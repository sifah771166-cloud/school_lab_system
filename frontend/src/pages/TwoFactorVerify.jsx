import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;
  const userId = location.state?.userId;

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Invalid session</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    try {
      if (!code || (useBackupCode ? code.length < 8 : code.length !== 6)) {
        setError(useBackupCode ? 'Please enter a valid backup code' : 'Please enter a valid 6-digit code');
        return;
      }

      setLoading(true);
      setError('');

      // Verify 2FA token
      const verifyResponse = await axios.post(`${API_URL}/auth/2fa/verify-login`, {
        userId,
        token: code,
        useBackupCode
      });

      if (verifyResponse.data.data.verified) {
        // Complete login
        const loginResponse = await axios.post(`${API_URL}/auth/login-2fa`, { userId });
        
        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Verification</h1>
          <p className="text-gray-300 mb-6">Enter your verification code</p>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
            </label>
            <input
              type="text"
              maxLength={useBackupCode ? 9 : 6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setCode(useBackupCode ? val : val.replace(/\D/g, ''));
              }}
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              className="w-full bg-gray-800/50 border border-gray-600 text-white px-4 py-3 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Toggle Backup Code */}
          <button
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError('');
            }}
            className="text-purple-300 hover:text-purple-200 text-sm mb-6 transition"
          >
            {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
          </button>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || code.length < (useBackupCode ? 8 : 6)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          {/* Back to Login */}
          <button
            onClick={() => navigate('/login')}
            className="w-full text-gray-300 hover:text-white py-2 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
