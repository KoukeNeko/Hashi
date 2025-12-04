
import React, { useState } from 'react';
import { Command, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
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

    // Simulate API call
    setTimeout(() => {
      // Mock validation (accept anything for demo)
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-zinc-800/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden relative z-10 animate-fade-in">
        {/* Header */}
        <div className="bg-zinc-900/50 p-8 text-center border-b border-border/50">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
            <Command size={32} strokeWidth={2.5} className="text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h1>
          <p className="text-zinc-500 text-sm">Sign in to Hashi Dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-1.5">
             <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Password</label>
                <a href="#" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Forgot password?</a>
             </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-1">
            <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <label htmlFor="remember" className="text-sm text-zinc-400 cursor-pointer select-none">Remember me</label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold py-2.5 rounded-lg shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="bg-zinc-900/50 p-4 border-t border-border/50 text-center">
            <p className="text-xs text-zinc-500">
                Don't have an account? <a href="#" className="text-zinc-300 hover:text-white transition-colors">Contact Administrator</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
