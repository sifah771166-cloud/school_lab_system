import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import api from '../config/axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    labUsage: [],
    equipmentUtilization: [],
    loanStats: [],
    attendanceStats: [],
    departmentStats: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch data dari berbagai endpoints
      const [labs, items, loans, attendance] = await Promise.all([
        api.get('/labs'),
        api.get('/items'),
        api.get('/loans/all'),
        api.get('/attendance'),
      ]);

      // Process lab usage data
      const labUsageData = labs.data.data.map(lab => ({
        name: lab.name,
        usage: Math.floor(Math.random() * 100), // Placeholder - akan diganti dengan real data
        capacity: lab.capacity || 30,
      }));

      // Process equipment utilization
      const equipmentData = items.data.data.slice(0, 5).map(item => ({
        name: item.name,
        available: item.quantity,
        borrowed: Math.floor(Math.random() * item.quantity),
      }));

      // Process loan statistics
      const loanStats = [
        { name: 'Pending', value: loans.data.data.filter(l => l.status === 'pending').length },
        { name: 'Approved', value: loans.data.data.filter(l => l.status === 'approved').length },
        { name: 'Returned', value: loans.data.data.filter(l => l.status === 'returned').length },
        { name: 'Rejected', value: loans.data.data.filter(l => l.status === 'rejected').length },
      ];

      // Process attendance statistics
      const attendanceByDay = [
        { day: 'Mon', visits: Math.floor(Math.random() * 50) },
        { day: 'Tue', visits: Math.floor(Math.random() * 50) },
        { day: 'Wed', visits: Math.floor(Math.random() * 50) },
        { day: 'Thu', visits: Math.floor(Math.random() * 50) },
        { day: 'Fri', visits: Math.floor(Math.random() * 50) },
      ];

      setAnalyticsData({
        labUsage: labUsageData,
        equipmentUtilization: equipmentData,
        loanStats,
        attendanceStats: attendanceByDay,
        departmentStats: labs.data.data.slice(0, 5).map(lab => ({
          name: lab.department?.name || 'Unknown',
          labs: 1,
        })),
      });
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('analytics-container');
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('analytics-report.pdf');
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  const exportToCSV = () => {
    try {
      let csv = 'Lab Analytics Report\n\n';
      
      csv += 'Lab Usage Statistics\n';
      csv += 'Lab Name,Usage %,Capacity\n';
      analyticsData.labUsage.forEach(lab => {
        csv += `${lab.name},${lab.usage},${lab.capacity}\n`;
      });
      
      csv += '\n\nEquipment Utilization\n';
      csv += 'Equipment Name,Available,Borrowed\n';
      analyticsData.equipmentUtilization.forEach(eq => {
        csv += `${eq.name},${eq.available},${eq.borrowed}\n`;
      });

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', 'analytics-report.csv');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Analytics & Reports" 
          subtitle="View detailed statistics and insights"
        />
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div id="analytics-container" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Labs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.labUsage.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Equipment</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.equipmentUtilization.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10M7 12l8 4m0 0l8-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Loans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.loanStats.reduce((a, b) => a + b.value, 0)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Utilization</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(analyticsData.labUsage.reduce((a, b) => a + b.usage, 0) / analyticsData.labUsage.length || 0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lab Usage Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Usage Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.labUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#3b82f6" name="Usage %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Loan Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.loanStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.loanStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.attendanceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="#10b981" name="Lab Visits" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Equipment Utilization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Utilization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.equipmentUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="available" fill="#10b981" name="Available" />
                <Bar dataKey="borrowed" fill="#f59e0b" name="Borrowed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lab Usage Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Usage Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Lab Name</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Usage</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.labUsage.map((lab, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900">{lab.name}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${lab.usage}%` }}></div>
                          </div>
                          <span className="text-gray-600">{lab.usage}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{lab.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Equipment</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Available</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Borrowed</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.equipmentUtilization.map((eq, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900">{eq.name}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {eq.available}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          {eq.borrowed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
