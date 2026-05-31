import { useState, useEffect } from 'react';
import api from '../config/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import PageHeader from '../components/ui/PageHeader';
import toast from 'react-hot-toast';

export default function QRCodes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labs, setLabs] = useState([]);
  const [items, setItems] = useState([]);
  const [qrCodes, setQrCodes] = useState({});
  const [activeTab, setActiveTab] = useState('labs');
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_JURUSAN';

  useEffect(() => {
    if (isAdmin) {
      fetchLabs();
      fetchItems();
    }
  }, []);

  const fetchLabs = async () => {
    try {
      const { data } = await api.get('/labs');
      setLabs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch labs');
    }
  };

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/items');
      setItems(data.data || []);
    } catch (err) {
      console.error('Failed to fetch items');
    }
  };

  const generateLabQRCode = async (labId) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get(`/qr/lab/${labId}`);
      setQrCodes(prev => ({
        ...prev,
        [`lab_${labId}`]: data.data
      }));
      setSelectedLab(data.data);
      toast.success('QR Code generated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateItemQRCode = async (itemId) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get(`/qr/item/${itemId}`);
      setQrCodes(prev => ({
        ...prev,
        [`item_${itemId}`]: data.data
      }));
      setSelectedItem(data.data);
      toast.success('QR Code generated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateBatchQRCodes = async () => {
    if (!window.confirm('Generate QR codes for all labs? This may take a moment.')) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/qr/labs/batch');
      
      const newQrCodes = {};
      data.data.forEach(qr => {
        newQrCodes[`lab_${qr.labId}`] = qr;
      });
      
      setQrCodes(prev => ({ ...prev, ...newQrCodes }));
      toast.success(`Generated ${data.count} QR codes successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate batch QR codes');
      toast.error('Failed to generate batch QR codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (qrCodeData, filename) => {
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded');
  };

  const printQRCode = (qrCodeData, title) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${title}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            h1 {
              margin-bottom: 10px;
              font-size: 24px;
            }
            img {
              max-width: 400px;
              margin: 20px 0;
            }
            .instructions {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${title}</h1>
            <img src="${qrCodeData}" alt="QR Code" />
            <div class="instructions">
              <p>Scan this QR code to check-in</p>
              <p>School Laboratory Management System</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only administrators can manage QR codes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Code Management"
        description="Generate and manage QR codes for labs and equipment"
        action={
          <button
            onClick={generateBatchQRCodes}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium shadow-md disabled:opacity-50"
          >
            Generate All Lab QR Codes
          </button>
        }
      />

      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'labs'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Laboratory QR Codes
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'items'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Equipment QR Codes
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labs.map(lab => (
                  <div key={lab.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-1">{lab.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{lab.description}</p>
                    
                    {qrCodes[`lab_${lab.id}`] ? (
                      <div className="space-y-3">
                        <img
                          src={qrCodes[`lab_${lab.id}`].qrCode}
                          alt={`QR Code for ${lab.name}`}
                          className="w-full border border-gray-200 rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadQRCode(qrCodes[`lab_${lab.id}`].qrCode, `lab-${lab.name}`)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => printQRCode(qrCodes[`lab_${lab.id}`].qrCode, lab.name)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Print
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateLabQRCode(lab.id)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        Generate QR Code
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600 mb-3">Category: {item.category || 'N/A'}</p>
                    
                    {qrCodes[`item_${item.id}`] ? (
                      <div className="space-y-3">
                        <img
                          src={qrCodes[`item_${item.id}`].qrCode}
                          alt={`QR Code for ${item.name}`}
                          className="w-full border border-gray-200 rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadQRCode(qrCodes[`item_${item.id}`].qrCode, `item-${item.name}`)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => printQRCode(qrCodes[`item_${item.id}`].qrCode, item.name)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Print
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateItemQRCode(item.id)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        Generate QR Code
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          QR Code Usage
        </h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>Lab QR Codes:</strong> Print and place at lab entrance for easy check-in</li>
          <li>• <strong>Equipment QR Codes:</strong> Attach to equipment for quick loan requests</li>
          <li>• <strong>Download:</strong> Save QR code as PNG image</li>
          <li>• <strong>Print:</strong> Print QR code with label for physical display</li>
          <li>• <strong>Batch Generate:</strong> Create QR codes for all labs at once</li>
        </ul>
      </div>
    </div>
  );
}
