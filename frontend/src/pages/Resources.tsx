import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/SkeletonLoader';
import { Resource, ResourceType } from '../types';
import api from '../services/api';
import { Search, MapPin, Users, Sparkles, Filter } from 'lucide-react';
import { BookingModal } from '../components/booking/BookingModal';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedTypeId) params.resourceTypeId = selectedTypeId;
      if (search) params.search = search;

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
  }, [selectedTypeId, search]);

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
          <p className="text-xs text-slate-400">Explore auditoriums, labs, classrooms, and grounds</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card variant="glass" className="p-4 border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedTypeId(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTypeId === null
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Venues
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
          <div className="w-full md:w-72">
            <Input
              placeholder="Search by name or building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
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
          resources.map((resource) => (
            <Card key={resource.id} hoverEffect variant="glass" className="p-6 border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {resource.resource_type_name}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-0.5">{resource.name}</h3>
                  </div>
                  <StatusBadge status={resource.status} />
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{resource.building} {resource.room_number ? `(${resource.room_number})` : ''}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Capacity: <strong className="text-slate-200">{resource.capacity} Seats</strong></span>
                  </p>
                </div>

                {/* Amenities Badges */}
                {resource.amenities && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {resource.amenities.split(',').map((amenity, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                        {amenity.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-6">
                <Button
                  onClick={() => handleOpenBookingModal(resource)}
                  disabled={resource.status === 'MAINTENANCE'}
                  variant={resource.status === 'MAINTENANCE' ? 'secondary' : 'primary'}
                  className="w-full text-xs"
                >
                  {resource.status === 'MAINTENANCE' ? 'Under Maintenance' : 'Check Availability & Book'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resource={selectedResource}
        onSuccess={fetchResources}
      />
    </div>
  );
};
