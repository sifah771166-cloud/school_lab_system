import { useState, useEffect } from 'react';
import api from '../config/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import PageHeader from '../components/ui/PageHeader';
import SearchFilter from '../components/ui/SearchFilter';
import StatusBadge from '../components/ui/StatusBadge';
import { exportToCSV, printReport } from '../utils/export';

export default function Attendance() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('checkin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check-in state
  const [labs, setLabs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({
    labId: '',
    scheduleId: '',
  });

  // History state
  const [records, setRecords] = useState([]);
  const [activeAttendance, setActiveAttendance] = useState(null);

  // Lab attendance for admin
  const [labsWithAttendance, setLabsWithAttendance] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  
  // Department and labs data
  const [departments, setDepartments] = useState([]);
  const [departmentLabsData, setDepartmentLabsData] = useState([]);
  const [allDepartmentsData, setAllDepartmentsData] = useState([]);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_JURUSAN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdminJurusan = user?.role === 'ADMIN_JURUSAN';
  const isUser = user?.role === 'USER';

  useEffect(() => {
    fetchLabs();
    fetchSchedules();
    fetchHistory();
    if (isAdmin) {
      fetchDepartments();
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

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get('/schedules');
      const today = new Date().toISOString().split('T')[0];
      const todaySchedules = (data.data || []).filter(s => 
        s.date && s.date.split('T')[0] === today
      );
      setSchedules(todaySchedules);
    } catch (err) {
      console.error('Failed to fetch schedules');
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/history');
      const history = data.data || [];
      setRecords(history);
      
      // Find active attendance (not checked out yet)
      const active = history.find(r => !r.checkOutTime);
      setActiveAttendance(active);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
      if (isAdminJurusan && user.departmentId) {
        setSelectedDepartmentId(user.departmentId);
      }
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchLabsWithAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/labs/summary');
      setLabsWithAttendance(data.data || []);
    } catch (err) {
      setError('Failed to load labs attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentLabsAttendance = async (deptId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/department/${deptId}`);
      setDepartmentLabsData(data.data || []);
    } catch (err) {
      setError('Failed to load department labs attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDepartmentsAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/admin/all-departments');
      setAllDepartmentsData(data.data || []);
    } catch (err) {
      setError('Failed to load all departments attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/attendance/check-in', {
        labId: formData.labId,
        scheduleId: formData.scheduleId || undefined,
      });
      setMessage('✅ Check-in berhasil! Selamat belajar di lab.');
      setFormData({ labId: '', scheduleId: '' });
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in gagal. Pastikan Anda belum check-in sebelumnya.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeAttendance) {
      setError('Tidak ada kunjungan aktif untuk di-checkout');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin check-out?')) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/attendance/check-out', { attendanceId: activeAttendance.id });
      setMessage('✅ Check-out berhasil! Terima kasih telah menggunakan lab.');
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setMessage('');
    
    if (tab === 'labs' && isAdmin) {
      fetchLabsWithAttendance();
    } else if (tab === 'department' && isAdminJurusan && selectedDepartmentId) {
      fetchDepartmentLabsAttendance(selectedDepartmentId);
    } else if (tab === 'all-departments' && isSuperAdmin) {
      fetchAllDepartmentsAttendance();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && activeTab !== 'checkin') return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Lab"
        description="Kelola check-in/check-out dan riwayat kunjungan lab"
      />

      {error && <ErrorMessage message={error} />}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-wrap border-b border-gray-200">
          {isUser && (
            <button
              onClick={() => handleTabChange('checkin')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'checkin'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Check-in/Check-out
            </button>
          )}
          
          {isAdmin && (
            <>
              <button
                onClick={() => handleTabChange('labs')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'labs'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Lab Attendance
              </button>

              {isAdminJurusan && (
                <button
                  onClick={() => handleTabChange('department')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'department'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏢 Department Labs
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => handleTabChange('all-departments')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'all-departments'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏛️ All Departments
                </button>
              )}
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Check-in/Check-out Tab */}
          {activeTab === 'checkin' && isUser && (
            <div className="space-y-6">
              {/* Check-in Form */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-in Lab</h3>
                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Lab *
                      </label>
                      <select
                        value={formData.labId}
                        onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">-- Pilih Lab --</option>
                        {labs.map(lab => (
                          <option key={lab.id} value={lab.id}>
                            {lab.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jadwal (Opsional)
                      </label>
                      <select
                        value={formData.scheduleId}
                        onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">-- Pilih Jadwal --</option>
                        {schedules.map(schedule => (
                          <option key={schedule.id} value={schedule.id}>
                            {schedule.title} ({schedule.startTime} - {schedule.endTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Processing...' : '✅ Check-in'}
                  </button>
                </form>
              </div>

              {/* Check-out Section */}
              {activeAttendance && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Check-in</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Lab</p>
                      <p className="font-semibold text-gray-900">{activeAttendance.lab?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-in Time</p>
                      <p className="font-semibold text-gray-900">{formatTime(activeAttendance.checkInTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">
                        {activeAttendance.checkInTime ? 
                          Math.floor((new Date() - new Date(activeAttendance.checkInTime)) / 60000) + ' min'
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={handleCheckOut}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Processing...' : '❌ Check-out'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Kunjungan</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Lab</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Check-in</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Check-out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            Belum ada riwayat kunjungan
                          </td>
                        </tr>
                      ) : (
                        records.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{record.lab?.name || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(record.checkInTime)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{record.checkOutTime ? formatDate(record.checkOutTime) : '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                record.checkOutTime 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.checkOutTime ? 'Completed' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Labs Attendance Tab (Admin Jurusan & Super Admin) */}
          {activeTab === 'labs' && isAdmin && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labsWithAttendance.map(lab => (
                  <div key={lab.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                    <h4 className="font-semibold text-gray-900 mb-2">{lab.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{lab.department?.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">{lab._count?.attendances || 0}</span>
                      <span className="text-xs text-gray-500">visitors today</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLabId(lab.id);
                        setActiveTab('lab-detail');
                      }}
                      className="mt-4 w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Labs Tab (Admin Jurusan) */}
          {activeTab === 'department' && isAdminJurusan && (
            <div className="space-y-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Departemen
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    if (e.target.value) {
                      fetchDepartmentLabsAttendance(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {departmentLabsData.map(lab => (
                <div key={lab.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{lab.name}</h4>
                      <p className="text-sm text-gray-600">Capacity: {lab.capacity || 'N/A'}</p>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{lab._count?.attendances || 0}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">User</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Check-in</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Check-out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lab.attendances?.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-center text-gray-500">
                              Belum ada kunjungan
                            </td>
                          </tr>
                        ) : (
                          lab.attendances?.map(att => (
                            <tr key={att.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-900">{att.user?.name}</td>
                              <td className="px-4 py-2 text-gray-600">{formatTime(att.checkInTime)}</td>
                              <td className="px-4 py-2 text-gray-600">{att.checkOutTime ? formatTime(att.checkOutTime) : '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Departments Tab (Super Admin) */}
          {activeTab === 'all-departments' && isSuperAdmin && (
            <div className="space-y-6">
              {allDepartmentsData.map(dept => (
                <div key={dept.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{dept.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dept.labs?.map(lab => (
                      <div key={lab.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{lab.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">Capacity: {lab.capacity || 'N/A'}</p>
                        <p className="text-sm font-bold text-purple-600 mb-3">{lab._count?.attendances || 0} visitors</p>
                        
                        <div className="max-h-40 overflow-y-auto">
                          <div className="space-y-1 text-xs">
                            {lab.attendances?.length === 0 ? (
                              <p className="text-gray-500">No visitors</p>
                            ) : (
                              lab.attendances?.map(att => (
                                <div key={att.id} className="flex justify-between text-gray-700">
                                  <span>{att.user?.name}</span>
                                  <span className="text-gray-500">{formatTime(att.checkInTime)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
