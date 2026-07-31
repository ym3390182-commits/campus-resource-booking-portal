import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/SkeletonLoader';
import { DashboardData, Resource } from '../types';
import api from '../services/api';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Building2,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  MapPin,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookingModal } from '../components/booking/BookingModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenBookingModal = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* 1. Personalized Welcome Banner */}
      <Card variant="glass" className="p-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to Version 1.0 MVP
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
              Good Afternoon, {user?.full_name}! 👋
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 max-w-2xl">
              You are logged in as <span className="text-indigo-400 font-semibold">{user?.role}</span> ({user?.department || 'University'}). Explore active venues and request zero-conflict resource reservations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/resources">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Book Resource Slot
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="secondary" leftIcon={<CalendarDays className="w-4 h-4" />}>
                View Calendar
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 2. Statistics Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bookings */}
        <Card hoverEffect variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Requests</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-extrabold text-slate-100">{data?.metrics.totalBookingsCount || 0}</h3>
            )}
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Lifetime submitted requests
            </p>
          </div>
        </Card>

        {/* Card 2: Pending Approvals */}
        <Card hoverEffect variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Review</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-extrabold text-slate-100">{data?.metrics.pendingApprovalsCount || 0}</h3>
            )}
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" /> Awaiting Admin decision
            </p>
          </div>
        </Card>

        {/* Card 3: Approved Events */}
        <Card hoverEffect variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Confirmed Events</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-extrabold text-slate-100">{data?.metrics.approvedEventsCount || 0}</h3>
            )}
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active reservation passes
            </p>
          </div>
        </Card>

        {/* Card 4: Active Campus Venues */}
        <Card hoverEffect variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Venues</span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-extrabold text-slate-100">{data?.metrics.activeResourcesCount || 0}</h3>
            )}
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-violet-400" /> Auditoriums, Labs & Grounds
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Main Content Split Grid (Today's Timeline + Venue Quick Book) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Today's Scheduled Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Today's Campus Schedule</h3>
              <p className="text-xs text-slate-400">Live timeline of scheduled events today</p>
            </div>
            <Link to="/calendar" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Full Calendar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card variant="glass" className="p-4 border-slate-800 min-h-[240px]">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" count={3} />
              </div>
            ) : data?.todaysEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-300">No events scheduled for today</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click "Book Resource Slot" to reserve a venue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.todaysEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{event.event_title}</span>
                        <StatusBadge status={event.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-slate-300"><Building2 className="w-3 h-3 text-indigo-400" /> {event.resource_name} ({event.building})</span>
                        <span>•</span>
                        <span className="text-slate-400">Booked by {event.booked_by}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-indigo-400 block">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Code: {event.booking_code}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Top Featured Venues Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Featured Venues</h3>
            <Link to="/resources" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              Browse All
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-20 w-full" count={3} />
            ) : (
              data?.resourceOverview.map((resource) => (
                <Card key={resource.id} hoverEffect variant="glass" className="p-4 border-slate-800">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{resource.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-400" /> {resource.building}
                      </p>
                    </div>
                    <StatusBadge status={resource.status} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {resource.capacity} Seats</span>
                    <button
                      onClick={() => handleOpenBookingModal(resource)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Book Slot $\rightarrow$
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Booking Activity Table */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-slate-100">Recent Booking Requests</h3>
        <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4">Ref Code</th>
                  <th className="p-4">Event Title</th>
                  <th className="p-4">Resource</th>
                  <th className="p-4">Booked By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Request Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-4"><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ) : data?.recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No booking activity found.</td>
                  </tr>
                ) : (
                  data?.recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-mono font-semibold text-indigo-400">{item.booking_code}</td>
                      <td className="p-4 font-medium text-slate-200">{item.event_title}</td>
                      <td className="p-4 text-slate-300">{item.resource_name}</td>
                      <td className="p-4 text-slate-400">{item.user_name} ({item.department})</td>
                      <td className="p-4"><StatusBadge status={item.status} /></td>
                      <td className="p-4 text-right text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resource={selectedResource}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
