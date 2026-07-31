import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BookmarkCheck,
  CheckSquare,
  User,
  Zap,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Resources', path: '/resources', icon: Building2 },
    { label: 'Master Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'My Bookings', path: '/my-bookings', icon: BookmarkCheck },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Approvals', path: '/admin', icon: CheckSquare });
  }

  return (
    <aside className="w-64 glass-card border-r border-slate-800/80 hidden lg:flex flex-col justify-between p-4 min-h-[calc(100vh-65px)] sticky top-[65px]">
      <div className="space-y-6">
        {/* Campus Brand Header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              CampusPortal <Sparkles className="w-3 h-3 text-indigo-400" />
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Resource Booking MVP</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Quick Card */}
      <div className="pt-4 border-t border-slate-800/80">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.department || user?.role}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
