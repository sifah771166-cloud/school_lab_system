import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: form.email,
        password: form.password
      });

      // Check if 2FA is required
      if (response.data.requiresTwoFA) {
        navigate('/2fa-verify', { state: { userId: response.data.userId } });
      } else {
        // Standard login
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Sign In</h2>
            <p className="text-gray-300 mt-2">School Laboratory Management System</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm font-semibold mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-purple-300 hover:text-purple-200 font-semibold transition"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}