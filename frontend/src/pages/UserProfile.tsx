import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { User, Shield, Building, CreditCard, Mail, Sparkles, Moon, Sun } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          User Profile & Preferences <Sparkles className="w-4 h-4 text-indigo-400" />
        </h1>
        <p className="text-xs text-slate-400">Account credentials, role status, and portal theme preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Role Badge Card */}
        <Card variant="glass" className="p-6 text-center space-y-4 border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{user?.full_name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> Role: {user?.role}
          </div>
        </Card>

        {/* Right Column: Profile Specs & Theme Settings */}
        <Card variant="glass" className="md:col-span-2 p-6 space-y-6 border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
            Account Identity & Department Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-400" /> Full Name</span>
              <p className="font-semibold text-slate-200">{user?.full_name}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> University Email</span>
              <p className="font-semibold text-slate-200">{user?.email}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-indigo-400" /> Department</span>
              <p className="font-semibold text-slate-200">{user?.department || 'General'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Registration ID</span>
              <p className="font-semibold text-slate-200">{user?.roll_or_emp_id || 'N/A'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Appearance & Theme Settings</h4>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <div>
                  <p className="text-xs font-semibold text-slate-200">Current Theme: {theme.toUpperCase()}</p>
                  <p className="text-[11px] text-slate-400">Switch between dark mode and soft light mode</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={toggleTheme}>
                Toggle Theme
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
