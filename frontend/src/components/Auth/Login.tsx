import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Lock, User, ArrowRight } from 'lucide-react';
import { type UserRole, USER_ROLES } from 'shared/constants';
import { API_BASE_URL } from '../../config/api';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Invalid username or password.');
        return;
      }
      const userRole = result.data.user.role;
      if (
        userRole !== USER_ROLES.ADMIN &&
        userRole !== USER_ROLES.EMPLOYEE
      ) {
        setError('Invalid user role.');
        return;
      }

      onLogin(userRole);
    } catch (error) {
      console.error(error);
      setError('Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">

      {/* ── Left Side: Branding (Hidden on mobile) ── */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#2a3c24] flex-col justify-center items-center overflow-hidden">
        {/* Subtle background pattern/gradient */}
        <div className="absolute inset-0 bg-[url('/bens-login-bg.png')] bg-cover bg-center mix-blend-overlay opacity-20" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-96 h-96 flex items-center justify-center drop-shadow-2xl">
            <img src="/bens-logo-hd.svg" alt="Ben's Cafe Logo" className="w-full h-full object-contain brightness-0 invert opacity-90" />
          </div>
        </motion.div>
      </div>

      {/* ── Right Side: Login Form ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div className="w-12 h-12 rounded-xl bg-[#4a6741] flex items-center justify-center">
                <Coffee className="text-white" size={24} />
              </div>
              <h1 className="font-bold text-gray-900 text-xl font-poppins">Ben's Cafe</h1>
            </div>

            <h2 className="text-3xl font-bold font-poppins text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 mb-10 text-sm">Please enter your details to sign in to your shift.</p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin_user"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <button type="button" className="text-[13px] font-semibold text-[#4a6741] hover:text-[#3d5535]">Forgot password?</button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black placeholder:text-gray-400"
                  />
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-red-500 text-center">
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4a6741] hover:bg-[#3d5535] text-white font-semibold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
