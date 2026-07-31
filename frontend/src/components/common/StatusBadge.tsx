import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | 'AVAILABLE' | 'MAINTENANCE';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const configs = {
    APPROVED: {
      label: 'Approved',
      icon: CheckCircle2,
      styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
      dot: 'bg-emerald-400',
    },
    AVAILABLE: {
      label: 'Available',
      icon: CheckCircle2,
      styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
      dot: 'bg-emerald-400',
    },
    PENDING: {
      label: 'Pending Review',
      icon: Clock,
      styles: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10',
      dot: 'bg-amber-400 animate-pulse',
    },
    REJECTED: {
      label: 'Rejected',
      icon: XCircle,
      styles: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10',
      dot: 'bg-rose-400',
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: Ban,
      styles: 'bg-slate-500/10 text-slate-400 border-slate-500/20 shadow-slate-500/10',
      dot: 'bg-slate-400',
    },
    MAINTENANCE: {
      label: 'Under Maintenance',
      icon: Ban,
      styles: 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/10',
      dot: 'bg-orange-400',
    },
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-md',
        config.styles,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
