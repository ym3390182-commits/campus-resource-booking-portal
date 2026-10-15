import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/SkeletonLoader';
import { Resource, ResourceType } from '../types';
import api from '../services/api';
import { Search, MapPin, Users, Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react';
import { BookingModal } from '../components/booking/BookingModal';

export const Resources: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  const [resources, setResources] = useState<Resource[]>([]);
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [filterStartTime, setFilterStartTime] = useState('10:00');
  const [filterEndTime, setFilterEndTime] = useState('12:00');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedTypeId) params.resourceTypeId = selectedTypeId;
      if (search) params.search = search;
      if (filterDate && filterStartTime && filterEndTime) {
        params.date = filterDate;
        params.startTime = `${filterDate} ${filterStartTime}:00`;
        params.endTime = `${filterDate} ${filterEndTime}:00`;
      }

      const [resResponse, typesResponse] = await Promise.all([
        api.get('/resources', { params }),
        api.get('/resources/types'),
      ]);

      setResources(resResponse.data.data);
      setTypes(typesResponse.data.data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedTypeId, search, filterDate, filterStartTime, filterEndTime]);

  const handleOpenBookingModal = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Campus Venues & Resources <Sparkles className="w-4 h-4 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400">
            Check real-time availability with mandatory 1-hour breaks and reserve university venues
          </p>
        </div>
      </div>

      {/* Date & Time Slot Availability Filter Bar */}
      <Card variant="glass" className="p-4 border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            <button
              onClick={() => setSelectedTypeId(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTypeId === null
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              All 8 Venues
            </button>
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedTypeId === type.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-64">
            <Input
              placeholder="Search by venue name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Live Slot Time Selector */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Check Availability For Slot:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="time"
              value={filterStartTime}
              onChange={(e) => setFilterStartTime(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="time"
              value={filterEndTime}
              onChange={(e) => setFilterEndTime(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" count={6} />
        ) : resources.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No resources found matching your search.
          </div>
        ) : (
          resources.map((resource) => {
            const displayStatus = resource.computed_status || resource.status;
            const isUnavailable = displayStatus === 'MAINTENANCE';

            return (
              <Card
                key={resource.id}
                hoverEffect
                variant="glass"
                className="p-6 border-slate-800 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        {resource.resource_type_name}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-0.5">{resource.name}</h3>
                    </div>
                    <StatusBadge status={displayStatus as any} />
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{resource.building} {resource.room_number ? `(${resource.room_number})` : ''}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Maximum Capacity: <strong className="text-slate-100 font-semibold">{resource.capacity} People</strong></span>
                    </p>
                  </div>

                  {/* Availability Message / Break Details */}
                  {resource.availability_message && (
                    <div
                      className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                        displayStatus === 'AVAILABLE'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : displayStatus === 'BREAK_PERIOD'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          : displayStatus === 'BOOKED'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span>{resource.availability_message}</span>
                        {resource.earliest_available_time && (
                          <span className="block font-semibold mt-0.5 text-indigo-300">
                            Earliest available: {resource.earliest_available_time}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amenities Badges */}
                  {resource.amenities && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {resource.amenities.split(',').map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {amenity.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-6">
                  {isAdmin ? (
                    <Link to="/admin" className="w-full block">
                      <Button variant="secondary" className="w-full text-xs">
                        Manage in Admin Panel
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleOpenBookingModal(resource)}
                      disabled={isUnavailable}
                      variant={isUnavailable ? 'secondary' : 'primary'}
                      className="w-full text-xs"
                    >
                      {isUnavailable ? 'Under Maintenance' : 'Book Now'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resource={selectedResource}
        initialDate={filterDate}
        initialStartTime={filterStartTime}
        initialEndTime={filterEndTime}
        onSuccess={fetchResources}
      />
    </div>
  );
};
