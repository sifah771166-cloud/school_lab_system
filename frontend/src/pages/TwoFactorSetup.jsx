import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('setup'); // setup, verify, success
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  // Generate 2FA setup
  const handleGenerateSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(
        `${API_URL}/auth/2fa/setup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSecret(response.data.data.secret);
      setQrCode(response.data.data.qrCode);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate setup');
    } finally {
      setLoading(false);
    }
  };

  // Verify and enable 2FA
  const handleVerify = async () => {
    try {
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      setLoading(true);
      setError('');
      const response = await axios.post(
        `${API_URL}/auth/2fa/enable`,
        { secret, token: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBackupCodes(response.data.data.backupCodes);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  // Copy backup codes to clipboard
  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Setup Step */}
        {step === 'setup' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-300 mb-6">Secure your account with 2FA</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateSetup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {loading ? 'Generating...' : 'Start Setup'}
            </button>
          </div>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">Scan QR Code</h1>
            <p className="text-gray-300 mb-6">Use an authenticator app to scan this QR code</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* QR Code Display */}
            <div className="bg-white p-4 rounded-lg mb-6 flex justify-center">
              {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48" />}
            </div>

            {/* Manual Entry */}
            <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
              <p className="text-gray-400 text-sm mb-2">Or enter manually:</p>
              <p className="text-white font-mono text-center break-all">{secret}</p>
            </div>

            {/* Verification Code Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Enter 6-digit code from your authenticator
              </label>
              <input
                type="text"
                maxLength="6"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-gray-800/50 border border-gray-600 text-white px-4 py-3 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">2FA Enabled!</h1>
              <p className="text-gray-300">Your account is now protected</p>
            </div>

            {/* Backup Codes */}
            <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
              <p className="text-gray-300 text-sm font-semibold mb-3">Save your backup codes</p>
              <div className="bg-gray-900/50 p-3 rounded max-h-40 overflow-y-auto mb-3">
                {backupCodes.map((code, idx) => (
                  <p key={idx} className="text-gray-300 font-mono text-sm">{code}</p>
                ))}
              </div>
              <p className="text-gray-400 text-xs mb-3">
                Store these codes in a safe place. You can use them to access your account if you lose access to your authenticator.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyBackupCodes}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded text-sm transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadBackupCodes}
                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-2 rounded text-sm transition"
                >
                  Download
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;
