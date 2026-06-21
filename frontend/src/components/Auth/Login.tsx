import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Lock, User, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (role: 'admin' | 'staff') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    // MOCK AUTHENTICATION LOGIC
    setTimeout(() => {
      setIsLoading(false);
      // If they type 'admin' anywhere in the username, log in as admin. Else staff.
      if (username.toLowerCase().includes('admin')) {
        onLogin('admin');
      } else if (username.toLowerCase().includes('staff') || password) {
        onLogin('staff');
      } else {
        setError('Invalid credentials');
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* ── Left Side: Branding (Hidden on mobile) ── */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#2a3c24] flex-col justify-center items-center overflow-hidden">
        {/* Subtle background pattern/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3d5535] to-[#1e2b19] opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-64 h-64 flex items-center justify-center drop-shadow-2xl">
            <img src="/bens-logo.png" alt="Ben's Cafe Logo" className="w-full h-full object-contain filter invert opacity-90" />
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
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm placeholder:text-gray-400"
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
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm placeholder:text-gray-400"
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

            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Developer Note:</p>
                <p className="text-[11px] text-blue-600/80 leading-relaxed">
                  Authentication is currently mocked. Type <strong>"admin"</strong> in the username to view the Admin Portal, or type anything else to view the Staff Portal.
                </p>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
