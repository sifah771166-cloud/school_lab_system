import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../config/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCard from '../components/ui/StatCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const isUser = user?.role === 'USER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_JURUSAN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          // Fetch real stats from API
          const [labsRes, loansRes, attendanceRes] = await Promise.all([
            api.get('/labs'),
            api.get('/loans'),
            api.get('/attendance'),
          ]);

          const labs = labsRes.data.data || [];
          const loans = loansRes.data.data || [];
          const attendance = attendanceRes.data.data || [];

          const today = new Date().toISOString().split('T')[0];
          const todayAttendance = attendance.filter(a => 
            a.date && a.date.split('T')[0] === today
          );
          const pendingLoans = loans.filter(l => l.status === 'pending');

          setStats({
            labs: labs.length,
            pendingLoans: pendingLoans.length,
            todayAttendance: todayAttendance.length,
            totalLoans: loans.length,
          });
        }
        
        // Fetch today's schedules
        const { data } = await api.get('/schedules');
        const today = new Date().toISOString().split('T')[0];
        const todaySchedules = (data.data || []).filter(s => 
          s.date && s.date.split('T')[0] === today
        );
        setSchedules(todaySchedules);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (loading) return <LoadingSpinner />;

  // Dashboard untuk USER
  if (isUser) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-2xl shadow-2xl p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              Selamat Datang, {user?.name} 
              <span className="ml-3 animate-bounce-slow">👋</span>
            </h1>
            <p className="text-purple-100 text-lg">Sistem Manajemen Laboratorium Sekolah</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/kunjungan" className="group">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
                  👥
                </div>
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Kunjungan Lab</h3>
              <p className="text-blue-100 text-sm">Catat kunjungan mengajar di lab</p>
            </div>
          </Link>

          <Link to="/loans" className="group">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
                  📋
                </div>
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Peminjaman</h3>
              <p className="text-purple-100 text-sm">Ajukan peminjaman barang lab</p>
            </div>
          </Link>

          <Link to="/schedules" className="group">
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
                  📅
                </div>
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Jadwal Lab</h3>
              <p className="text-green-100 text-sm">Lihat jadwal penggunaan lab</p>
            </div>
          </Link>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pengumuman */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 card-hover">
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                📢
              </div>
              <h3 className="text-xl font-bold text-gray-800 ml-4 gradient-text">Pengumuman</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-blue-500 mr-3 text-lg">•</span>
                <p>Pastikan mengisi absensi kunjungan lab sebelum masuk</p>
              </div>
              <div className="flex items-start p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-blue-500 mr-3 text-lg">•</span>
                <p>Peminjaman barang maksimal 7 hari</p>
              </div>
              <div className="flex items-start p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-blue-500 mr-3 text-lg">•</span>
                <p>Jaga kebersihan dan ketertiban laboratorium</p>
              </div>
            </div>
          </div>

          {/* Informasi Penting */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 card-hover">
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                ℹ️
              </div>
              <h3 className="text-xl font-bold text-gray-800 ml-4 gradient-text">Informasi Penting</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-green-500 mr-3 text-lg">✓</span>
                <p>Wajib mengisi form kunjungan setiap kali mengajar di lab</p>
              </div>
              <div className="flex items-start p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-green-500 mr-3 text-lg">✓</span>
                <p>Peralatan yang dipinjam harus dikembalikan tepat waktu</p>
              </div>
              <div className="flex items-start p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-green-500 mr-3 text-lg">✓</span>
                <p>Hubungi admin jika ada kendala atau pertanyaan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jadwal Lab Hari Ini */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">📅</span>
            <span className="gradient-text">Jadwal Lab Hari Ini</span>
          </h2>
          {schedules.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg text-gray-500 font-medium">Tidak ada jadwal lab hari ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="group border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 rounded-r-xl p-4 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 transform hover:translate-x-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">{schedule.lab?.name || 'Lab'}</p>
                      <p className="text-sm text-gray-700 mt-1 font-medium">{schedule.title || 'Praktikum'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        👨‍🏫 {schedule.creator?.name || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
                        <p className="text-sm font-bold">{schedule.startTime}</p>
                        <p className="text-xs opacity-90">-</p>
                        <p className="text-sm font-bold">{schedule.endTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard untuk ADMIN
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Dashboard Admin 
            <span className="ml-3">📊</span>
          </h1>
          <p className="text-purple-100 text-lg">Selamat datang, {user?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl backdrop-blur-sm">
                🧪
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.labs}</p>
              </div>
            </div>
            <p className="text-blue-100 font-medium">Total Labs</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl backdrop-blur-sm">
                ⏳
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.pendingLoans}</p>
              </div>
            </div>
            <p className="text-purple-100 font-medium">Pending Loans</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl backdrop-blur-sm">
                👥
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.todayAttendance}</p>
              </div>
            </div>
            <p className="text-green-100 font-medium">Today's Visits</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl backdrop-blur-sm">
                📋
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.totalLoans}</p>
              </div>
            </div>
            <p className="text-orange-100 font-medium">Total Loans</p>
          </div>
        </div>
      )}

      {/* Jadwal Lab Hari Ini */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">📅</span>
          <span className="gradient-text">Jadwal Lab Hari Ini</span>
        </h2>
        {schedules.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg text-gray-500 font-medium">Tidak ada jadwal lab hari ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="group border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-r-xl p-4 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 transform hover:translate-x-1">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{schedule.lab?.name || 'Lab'}</p>
                    <p className="text-sm text-gray-700 mt-1 font-medium">{schedule.title || 'Praktikum'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      👨‍🏫 {schedule.creator?.name || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-lg">
                      <p className="text-sm font-bold">{schedule.startTime}</p>
                      <p className="text-xs opacity-90">-</p>
                      <p className="text-sm font-bold">{schedule.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✓</span>
                <p className="text-sm text-gray-700">Kembalikan alat dan bahan ke tempat semula setelah digunakan</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">✗</span>
