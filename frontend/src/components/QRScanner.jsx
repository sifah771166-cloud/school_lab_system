import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import Webcam from 'react-webcam';

export default function QRScanner({ onScan, onError, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const webcamRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    // Initialize code reader
    codeReaderRef.current = new BrowserMultiFormatReader();

    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => {
        setHasPermission(false);
        setError('Camera permission denied');
      });

    return () => {
      // Cleanup
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const handleScan = async () => {
    if (!webcamRef.current || scanning) return;

    setScanning(true);
    setError('');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Decode QR code from image
      const result = await codeReaderRef.current.decodeFromImageUrl(imageSrc);
      
      if (result && result.text) {
        setScanning(false);
        onScan(result.text);
      }
    } catch (err) {
      // Continue scanning if no QR code found
      if (err.name !== 'NotFoundException') {
        setError('Failed to scan QR code');
        if (onError) onError(err);
      }
    } finally {
      setScanning(false);
    }
  };

  // Auto-scan every 500ms
  useEffect(() => {
    if (hasPermission && !scanning) {
      const interval = setInterval(() => {
        handleScan();
      }, 500);

      return () => clearInterval(interval);
    }
  }, [hasPermission, scanning]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold">Camera Access Denied</p>
        </div>
        <p className="text-gray-600 mb-4">
          Please allow camera access to scan QR codes
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }}
          className="w-full h-auto"
        />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Corner borders */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-purple-500"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-purple-500"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-purple-500"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-purple-500"></div>
            
            {/* Scanning line animation */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-purple-500 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
          {scanning ? (
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Scanning...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Position QR code in frame
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-2">📱 Scanning Tips:</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Hold your device steady</li>
          <li>• Ensure good lighting</li>
          <li>• Position QR code within the frame</li>
          <li>• Keep QR code flat and visible</li>
        </ul>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="mt-4 w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
      >
        Cancel Scanning
      </button>
    </div>
  );
}
