import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, User } from 'lucide-react';
import { type UserRole } from 'shared/constants';
import { authApi } from '../../api/authApi';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setIsLoading(true);

      const role = await authApi.login({
        username: username.trim(),
        password
      });

      onLogin(role);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to sign in. Please try again.');
      }
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
            <img src="/bens-logo-hd-traced.png" alt="Ben's Cafe Logo" className="w-full h-full object-contain brightness-0 invert opacity-90" />
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


            <h2 className="text-3xl font-bold font-poppins text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 mb-10 text-sm">Please enter your details to sign in to your shift.</p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Username */}
              <div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User size={18} className="text-gray-400" />
                  </div>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=" "
                    className="peer w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pb-3.5 pl-11 pt-4 text-sm text-black outline-none transition-all placeholder-transparent focus:border-[#4a6741] focus:bg-white focus:ring-2 focus:ring-[#4a6741]/20"
                  />

                  <label
                    htmlFor="username"
                    className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 bg-transparent text-sm text-gray-400 transition-all duration-200
                    peer-focus:left-4 peer-focus:top-0 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-[#4a6741]
                    peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-[#4a6741]"
                  >
                    Username
                  </label>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock size={18} className="text-gray-400" />
                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    className="peer w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pb-3.5 pl-11 pt-4 text-sm text-black outline-none transition-all placeholder-transparent focus:border-[#4a6741] focus:bg-white focus:ring-2 focus:ring-[#4a6741]/20"
                  />

                  <label
                    htmlFor="password"
                    className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 bg-transparent text-sm text-gray-400 transition-all duration-200 peer-focus:left-4 peer-focus:top-0 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-[#4a6741] peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-[#4a6741]"
                  >
                    Password
                  </label>
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
