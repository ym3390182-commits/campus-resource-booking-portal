import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Zap, Mail, Lock, User as UserIcon, Building, CreditCard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [department, setDepartment] = useState('Computer Science');
  const [rollOrEmpId, setRollOrEmpId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !rollOrEmpId) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        fullName,
        email,
        password,
        roleName,
        department,
        rollOrEmpId,
      });

      toast.success('Registration successful! Please login with your credentials.');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white py-12">
      <div className="w-full max-w-lg relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl mb-1">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center justify-center gap-2">
            Create Portal Account <Sparkles className="w-4 h-4 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400">Join Campus Resource Booking Portal</p>
        </div>

        <Card variant="glass" className="p-8 space-y-5 border border-slate-800">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Yash Mittal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />

            <Input
              label="University Email"
              type="email"
              placeholder="e.g. yash@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {/* Role Selection Tabs */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Account Type / Role</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleName('STUDENT')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    roleName === 'STUDENT'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setRoleName('FACULTY')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    roleName === 'FACULTY'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Faculty Account
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Department"
                type="text"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
              />

              <Input
                label={roleName === 'STUDENT' ? 'Roll Number' : 'Employee ID'}
                type="text"
                placeholder={roleName === 'STUDENT' ? 'e.g. 22BCE1004' : 'e.g. EMP-204'}
                value={rollOrEmpId}
                onChange={(e) => setRollOrEmpId(e.target.value)}
                leftIcon={<CreditCard className="w-4 h-4" />}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 mt-2" isLoading={isLoading}>
              Complete Registration
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
