import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import toast from 'react-hot-toast';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.get('/search/autocomplete/suggestions', {
          params: { q: query, module: selectedModule },
        });
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query, selectedModule]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      navigate(`/search?q=${encodeURIComponent(query)}&module=${selectedModule || 'all'}`);
      setShowSuggestions(false);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'lab':
        return '🧪';
      case 'item':
        return '📦';
      case 'teacher':
        return '👨‍🏫';
      default:
        return '🔍';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length > 0 && setShowSuggestions(true)}
              placeholder="Search labs, items, schedules..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <select
            value={selectedModule || ''}
            onChange={(e) => setSelectedModule(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="labs">Labs</option>
            <option value="items">Items</option>
            <option value="schedules">Schedules</option>
            <option value="attendance">Attendance</option>
            <option value="loans">Loans</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {suggestion.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No suggestions message */}
        {showSuggestions && query.length > 0 && suggestions.length === 0 && !loading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
            No suggestions found
          </div>
        )}
      </form>
    </div>
  );
}
