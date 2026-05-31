import { useState, useEffect } from 'react';
import api from '../config/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import PageHeader from '../components/ui/PageHeader';
import QRScanner from '../components/QRScanner';
import toast from 'react-hot-toast';

export default function QRCheckIn() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [checkInForm, setCheckInForm] = useState({
    teacherName: '',
    classTeaching: ''
  });

  const handleQRScan = async (qrData) => {
    setLoading(true);
    setError('');

    try {
      // Validate QR code
      const { data } = await api.post('/qr/validate', { qrData });

      if (data.valid && data.type === 'lab_checkin') {
        setScannedData(data.data);
        setShowScanner(false);
        toast.success(`QR Code valid: ${data.data.labName}`);
      } else {
        setError('Invalid QR code for check-in');
        toast.error('Invalid QR code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to validate QR code');
      toast.error('QR validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    
    if (!scannedData) {
      setError('Please scan a QR code first');
      return;
    }

    if (!checkInForm.teacherName || !checkInForm.classTeaching) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const qrData = JSON.stringify(scannedData);
      
      await api.post('/qr/checkin', {
        qrData,
        teacherName: checkInForm.teacherName,
        classTeaching: checkInForm.classTeaching
      });

      toast.success('Check-in successful!');
      
      // Reset form
      setScannedData(null);
      setCheckInForm({
        teacherName: '',
        classTeaching: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check-in');
      toast.error('Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (err) => {
    console.error('Scan error:', err);
    toast.error('Failed to scan QR code');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Check-In"
        description="Scan QR code untuk check-in ke laboratorium"
      />

      {error && <ErrorMessage message={error} />}

      {/* Scanner Section */}
      {!showScanner && !scannedData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan Lab QR Code</h3>
            <p className="text-gray-600 mb-6">
              Scan QR code yang tersedia di laboratorium untuk check-in
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium shadow-md transition-all"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open Scanner
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Scanner Component */}
      {showScanner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <QRScanner
            onScan={handleQRScan}
            onError={handleScanError}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Check-in Form */}
      {scannedData && !showScanner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">QR Code Scanned</h3>
                <p className="text-sm text-gray-600">Complete the form to check-in</p>
              </div>
            </div>

            {/* Lab Info */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Laboratory</p>
                  <p className="font-semibold text-gray-900">{scannedData.labName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Department</p>
                  <p className="font-semibold text-gray-900">{scannedData.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <p className="font-semibold text-gray-900">{scannedData.capacity} students</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={checkInForm.teacherName}
                onChange={(e) => setCheckInForm({ ...checkInForm, teacherName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter teacher name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class/Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={checkInForm.classTeaching}
                onChange={(e) => setCheckInForm({ ...checkInForm, classTeaching: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., XII RPL 1 - Web Programming"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Check-In Now'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScannedData(null);
                  setCheckInForm({ teacherName: '', classTeaching: '' });
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to Use QR Check-In
        </h4>
        <ol className="text-sm text-blue-800 space-y-2">
          <li>1. Click "Open Scanner" button</li>
          <li>2. Allow camera access when prompted</li>
          <li>3. Point camera at the lab QR code</li>
          <li>4. Wait for automatic scan</li>
          <li>5. Fill in teacher name and class information</li>
          <li>6. Click "Check-In Now" to complete</li>
        </ol>
      </div>
    </div>
  );
}
