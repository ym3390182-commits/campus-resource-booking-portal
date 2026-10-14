import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Zap, Mail, Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.full_name}! 👋`);
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 text-white shadow-xl shadow-indigo-500/30 mb-2">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center justify-center gap-2">
            CampusPortal <Sparkles className="w-4 h-4 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Digitized Campus Resource Reservations & Smart Scheduling Engine
          </p>
        </div>

        {/* Secure Login Form Card */}
        <Card variant="glass" className="p-8 space-y-5 border border-slate-800">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="University Email"
              type="email"
              placeholder="e.g. yourname@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" variant="primary" className="w-full py-3" isLoading={isLoading}>
              Sign In to Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              Create student account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
