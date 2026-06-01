import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AdvancedAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [overviewStats, setOverviewStats] = useState(null);
  const [labUtilization, setLabUtilization] = useState([]);
  const [equipmentUsage, setEquipmentUsage] = useState([]);
  const [departmentComparison, setDepartmentComparison] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loanStatus, setLoanStatus] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      const [
        overviewRes,
        labUtilRes,
        equipUsageRes,
        trendsRes,
        peakHoursRes,
        loanStatusRes
      ] = await Promise.all([
        api.get('/analytics/overview', { params }),
        api.get('/analytics/lab-utilization', { params }),
        api.get('/analytics/equipment-usage', { params }),
        api.get('/analytics/attendance-trends', { params }),
        api.get('/analytics/peak-hours', { params }),
        api.get('/analytics/loan-status', { params })
      ]);

      setOverviewStats(overviewRes.data.data);
      setLabUtilization(labUtilRes.data.data);
      setEquipmentUsage(equipUsageRes.data.data);
      setAttendanceTrends(trendsRes.data.data);
      setPeakHours(peakHoursRes.data.data);
      setLoanStatus(loanStatusRes.data.data);

      // Fetch department comparison if super admin
      try {
        const deptRes = await api.get('/analytics/department-comparison', { params });
        setDepartmentComparison(deptRes.data.data);
      } catch {
        // Not super admin, skip
        console.log('Department comparison not available');
      }

    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    fetchAnalyticsData();
  }, [dateRange]);

  const handleExportExcel = async () => {
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const response = await api.get('/analytics/export/excel', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export Excel');
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const response = await api.get('/analytics/export/pdf', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics"
        description="Comprehensive analytics and insights"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        }
      />

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setDateRange({
                startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
              })}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange({
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
              })}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange({
                startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
              })}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{overviewStats.totalLabs}</div>
            <div className="text-sm opacity-90 mt-1">Total Labs</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{overviewStats.totalItems}</div>
            <div className="text-sm opacity-90 mt-1">Total Items</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{overviewStats.totalAttendance}</div>
            <div className="text-sm opacity-90 mt-1">Total Attendance</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{overviewStats.totalLoans}</div>
            <div className="text-sm opacity-90 mt-1">Total Loans</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{overviewStats.pendingLoans}</div>
            <div className="text-sm opacity-90 mt-1">Pending Loans</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{overviewStats.activeCheckIns}</div>
            <div className="text-sm opacity-90 mt-1">Active Check-ins</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {['overview', 'labs', 'equipment', 'trends', 'departments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Attendance Trends */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={attendanceTrends}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Loan Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={loanStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {loanStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Peak Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Analysis</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peakHours.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hourLabel" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Utilization Analysis</h3>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={labUtilization.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="labName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalVisits" fill="#8B5CF6" name="Total Visits" />
                    <Bar dataKey="utilizationRate" fill="#3B82F6" name="Utilization Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Lab Utilization Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Occupancy (hrs)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {labUtilization.map((lab, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lab.labName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.totalVisits}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.avgOccupancyHours}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lab.utilizationRate > 70 ? 'bg-green-100 text-green-800' :
                            lab.utilizationRate > 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lab.utilizationRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Usage Analysis</h3>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={equipmentUsage.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="itemName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalLoans" fill="#10B981" name="Total Loans" />
                    <Bar dataKey="returnRate" fill="#3B82F6" name="Return Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Equipment Usage Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Loans</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration (days)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipmentUsage.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lab}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalLoans}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.approvedLoans}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.avgLoanDuration}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.returnRate > 80 ? 'bg-green-100 text-green-800' :
                            item.returnRate > 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.returnRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={attendanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} name="Attendance Count" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hourLabel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && departmentComparison.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Comparison</h3>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalAttendance" fill="#8B5CF6" name="Total Attendance" />
                    <Bar dataKey="totalLoans" fill="#3B82F6" name="Total Loans" />
                    <Bar dataKey="totalLabs" fill="#10B981" name="Total Labs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Department Comparison Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Labs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Loans</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Lab Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departmentComparison.map((dept, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.departmentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalLabs}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalUsers}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalItems}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalLoans}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalAttendance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.avgLabUtilization}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'departments' && departmentComparison.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">Department comparison is only available for Super Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
