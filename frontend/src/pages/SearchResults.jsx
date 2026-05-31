import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../config/axios';
import PageHeader from '../components/ui/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const query = searchParams.get('q');
  const module = searchParams.get('module') || 'all';

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query, module]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/search', {
        params: {
          q: query,
          type: module !== 'all' ? module : undefined,
          limit: 50,
        },
      });
      setResults(response.data.results);
      setActiveTab('all');
    } catch (error) {
      toast.error('Failed to fetch search results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'labs':
        return '🧪';
      case 'items':
        return '📦';
      case 'schedules':
        return '📅';
      case 'attendance':
        return '👥';
      case 'loans':
        return '📋';
      case 'departments':
        return '🏫';
      default:
        return '📄';
    }
  };

  const renderResultItem = (item, type) => {
    switch (type) {
      case 'labs':
        return (
          <div key={item.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🧪</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Department: {item.department?.name} | Capacity: {item.capacity}
                </p>
              </div>
            </div>
          </div>
        );

      case 'items':
        return (
          <div key={item.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Lab: {item.lab?.name} | Qty: {item.quantity} | Category: {item.category}
                </p>
              </div>
            </div>
          </div>
        );

      case 'schedules':
        return (
          <div key={item.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Lab: {item.lab?.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(item.date).toLocaleDateString()} | {item.startTime} - {item.endTime}
                </p>
              </div>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div key={item.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👥</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.teacherName}</h4>
                <p className="text-sm text-gray-600 mt-1">Class: {item.classTeaching}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {item.date} | {item.startTime} - {item.endTime}
                </p>
              </div>
            </div>
          </div>
        );

      case 'loans':
        return (
          <div key={item.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.item?.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Requester: {item.user?.name} | Qty: {item.quantity}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'approved' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        );

      case 'departments':
        return (
          <div key={item.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏫</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: 'All', count: Object.values(results).reduce((sum, arr) => sum + arr.length, 0) },
    { key: 'labs', label: 'Labs', count: results.labs?.length || 0 },
    { key: 'items', label: 'Items', count: results.items?.length || 0 },
    { key: 'schedules', label: 'Schedules', count: results.schedules?.length || 0 },
    { key: 'attendance', label: 'Attendance', count: results.attendance?.length || 0 },
    { key: 'loans', label: 'Loans', count: results.loans?.length || 0 },
    { key: 'departments', label: 'Departments', count: results.departments?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Results"
        subtitle={`Found ${Object.values(results).reduce((sum, arr) => sum + arr.length, 0)} results for "${query}"`}
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="divide-y divide-gray-200">
          {activeTab === 'all' ? (
            Object.entries(results).map(([type, items]) =>
              items.length > 0 && (
                <div key={type}>
                  <div className="px-6 py-3 bg-gray-50 font-semibold text-gray-900 text-sm">
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({items.length})
                  </div>
                  {items.map(item => renderResultItem(item, type))}
                </div>
              )
            )
          ) : results[activeTab]?.length > 0 ? (
            results[activeTab].map(item => renderResultItem(item, activeTab))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No {activeTab} found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
