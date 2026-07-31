import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/SkeletonLoader';
import { Booking } from '../types';
import api from '../services/api';
import { BookmarkCheck, Sparkles, Ban, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/bookings/my-bookings', { params });
      setBookings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [statusFilter]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully.');
      fetchMyBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          My Booking Requests <Sparkles className="w-4 h-4 text-indigo-400" />
        </h1>
        <p className="text-xs text-slate-400">View personal booking history, tracking codes, and status passes</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab === 'ALL' ? null : tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              (tab === 'ALL' && statusFilter === null) || statusFilter === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-4">Reference Code</th>
                <th className="p-4">Event Title</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Date & Time Slot</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4"><Skeleton className="h-6 w-full" /></td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">No bookings found for this filter.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono font-semibold text-indigo-400">{booking.booking_code}</td>
                    <td className="p-4 font-medium text-slate-200">
                      <div>{booking.event_title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{booking.purpose_reason}</div>
                    </td>
                    <td className="p-4 text-slate-300">{booking.resource_name} ({booking.building})</td>
                    <td className="p-4 text-slate-400">
                      <div>{new Date(booking.start_time).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={booking.status} /></td>
                    <td className="p-4 text-right">
                      {booking.status === 'PENDING' || booking.status === 'APPROVED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          leftIcon={<Ban className="w-3.5 h-3.5 text-rose-400" />}
                          className="text-rose-400 hover:bg-rose-500/10"
                        >
                          Cancel
                        </Button>
                      ) : booking.admin_remark ? (
                        <span className="text-[11px] text-amber-400 flex items-center justify-end gap-1" title={booking.admin_remark}>
                          <AlertCircle className="w-3.5 h-3.5" /> Remark Attached
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
