import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/SkeletonLoader';
import { Booking, Resource } from '../types';
import api from '../services/api';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  AlertCircle,
  Users,
  Edit2,
  X,
  Calendar,
  Clock,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'ALL_BOOKINGS' | 'RESOURCES'>('APPROVALS');
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rejection remark modal state
  const [rejectingBookingId, setRejectingBookingId] = useState<number | null>(null);
  const [adminRemark, setAdminRemark] = useState('');

  // Edit venue modal state
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(0);
  const [editBuilding, setEditBuilding] = useState<string>('');
  const [editAmenities, setEditAmenities] = useState<string>('');
  const [isSavingVenue, setIsSavingVenue] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'APPROVALS') {
        const response = await api.get('/approvals/pending');
        setPendingRequests(response.data.data);
      } else if (activeTab === 'ALL_BOOKINGS') {
        const params: any = {};
        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }
        const response = await api.get('/approvals/all', { params });
        setAllBookings(response.data.data);
      } else {
        const response = await api.get('/resources');
        setResources(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, statusFilter]);

  const handleApprove = async (bookingId: number) => {
    try {
      await api.patch(`/approvals/${bookingId}/action`, {
        action: 'APPROVED',
      });
      toast.success('Booking request APPROVED successfully! 🎉');
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Approval action failed.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBookingId || !adminRemark.trim()) {
      toast.error('Mandatory Reason Required: Please enter a rejection remark.');
      return;
    }

    try {
      await api.patch(`/approvals/${rejectingBookingId}/action`, {
        action: 'REJECTED',
        adminRemark,
      });
      toast.success('Booking request REJECTED with logged remark.');
      setRejectingBookingId(null);
      setAdminRemark('');
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rejection action failed.');
    }
  };

  const handleToggleStatus = async (resource: Resource) => {
    const nextStatus = resource.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      await api.put(`/resources/${resource.id}`, { status: nextStatus });
      toast.success(`Resource "${resource.name}" status updated to ${nextStatus}.`);
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update resource status.');
    }
  };

  const handleOpenEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setEditCapacity(resource.capacity);
    setEditBuilding(resource.building);
    setEditAmenities(resource.amenities || '');
  };

  const handleSaveVenueEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    setIsSavingVenue(true);
    try {
      await api.put(`/resources/${editingResource.id}`, {
        capacity: editCapacity,
        building: editBuilding,
        amenities: editAmenities,
      });
      toast.success(`Venue "${editingResource.name}" updated successfully!`);
      setEditingResource(null);
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update venue.');
    } finally {
      setIsSavingVenue(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Admin Management Portal <Sparkles className="w-4 h-4 text-indigo-400" />
        </h1>
        <p className="text-xs text-slate-400">
          Approve student reservation requests and configure campus venue capacities
        </p>
      </div>

      {/* Admin Sub-Header Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'APPROVALS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Pending Approvals Queue ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('ALL_BOOKINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'ALL_BOOKINGS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> All Booking Requests
        </button>
        <button
          onClick={() => setActiveTab('RESOURCES')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'RESOURCES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Campus Venues Management ({resources.length})
        </button>
      </div>

      {/* Tab 1: Pending Approvals Queue */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-32 w-full" count={3} />
          ) : pendingRequests.length === 0 ? (
            <Card variant="glass" className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-slate-200">Pending Approvals Queue is Clear!</h3>
              <p className="text-xs text-slate-500 mt-1">All student requests have been reviewed.</p>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} variant="glass" className="p-6 border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-indigo-400">{request.booking_code}</span>
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-slate-400 font-medium">
                        Student: <strong className="text-slate-200">{request.student_name}</strong> ({request.department} - {request.roll_or_emp_id})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{request.event_title}</h3>
                    <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <strong>Purpose:</strong> {request.purpose_reason}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span>Venue: <strong className="text-slate-200">{request.resource_name} ({request.building})</strong></span>
                      <span>•</span>
                      <span>Slot: <strong className="text-slate-200">{new Date(request.start_time).toLocaleString()}</strong></span>
                      {request.expected_attendees && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-300 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Attendees: <strong>{request.expected_attendees}</strong> (Max: {request.capacity})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectingBookingId(request.id)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 2: All Booking Requests (Audit & Status Filter) */}
      {activeTab === 'ALL_BOOKINGS' && (
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-4">Ref Code</th>
                    <th className="p-4">Event & Purpose</th>
                    <th className="p-4">Requested By</th>
                    <th className="p-4">Venue</th>
                    <th className="p-4">Date & Time Slot</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-4"><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ) : allBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        No booking requests found for status "{statusFilter}".
                      </td>
                    </tr>
                  ) : (
                    allBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-mono font-semibold text-indigo-400">{b.booking_code}</td>
                        <td className="p-4 text-slate-200">
                          <div className="font-bold">{b.event_title}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{b.purpose_reason}</div>
                        </td>
                        <td className="p-4 text-slate-300">
                          <div className="font-semibold text-slate-200">{b.student_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {b.user_role && <span className="text-indigo-400 font-medium">[{b.user_role}] </span>}
                            {b.department}
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">
                          <div>{b.resource_name}</div>
                          <div className="text-[11px] text-slate-500">{b.building}</div>
                        </td>
                        <td className="p-4 text-slate-300">
                          <div>{new Date(b.start_time).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4"><StatusBadge status={b.status} /></td>
                        <td className="p-4 text-right">
                          {b.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setRejectingBookingId(b.id)}
                                className="py-1 px-2.5 text-[11px]"
                              >
                                Reject
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(b.id)}
                                className="py-1 px-2.5 text-[11px]"
                              >
                                Approve
                              </Button>
                            </div>
                          ) : b.admin_remark ? (
                            <span className="text-[11px] text-amber-400 flex items-center justify-end gap-1" title={b.admin_remark}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[140px]">{b.admin_remark}</span>
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
      )}

      {/* Tab 3: Manage Resources */}
      {activeTab === 'RESOURCES' && (
        <div className="space-y-4">
          <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-4">Venue Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Building</th>
                    <th className="p-4">Max Capacity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-200">{resource.name}</td>
                      <td className="p-4 text-indigo-400 font-medium">{resource.resource_type_name}</td>
                      <td className="p-4 text-slate-300">{resource.building}</td>
                      <td className="p-4 text-slate-100 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" /> {resource.capacity} People
                        </span>
                      </td>
                      <td className="p-4"><StatusBadge status={resource.status} /></td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditModal(resource)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Configure
                        </Button>
                        <Button
                          variant={resource.status === 'AVAILABLE' ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(resource)}
                        >
                          {resource.status === 'AVAILABLE' ? 'Set Maintenance' : 'Set Available'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Rejection Remark Modal */}
      {rejectingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <Card variant="glass" className="w-full max-w-md p-6 space-y-4 border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" /> Mandatory Rejection Remark
            </h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason for the student explaining why this venue booking was rejected.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                placeholder="State reason for rejecting this booking (e.g. Scheduled department maintenance, Priority university exam)..."
                value={adminRemark}
                onChange={(e) => setAdminRemark(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setRejectingBookingId(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger">
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Venue Configuration / Capacity Editor Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <Card variant="glass" className="w-full max-w-md p-6 space-y-4 border-slate-800 relative">
            <button
              onClick={() => setEditingResource(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Configure Venue: {editingResource.name}
            </h3>
            <form onSubmit={handleSaveVenueEdit} className="space-y-4">
              <Input
                label="Maximum People Capacity"
                type="number"
                min="1"
                value={editCapacity}
                onChange={(e) => setEditCapacity(parseInt(e.target.value, 10) || 0)}
                leftIcon={<Users className="w-4 h-4" />}
                required
              />
              <Input
                label="Building / Location"
                value={editBuilding}
                onChange={(e) => setEditBuilding(e.target.value)}
                required
              />
              <Input
                label="Amenities (Comma Separated)"
                value={editAmenities}
                onChange={(e) => setEditAmenities(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setEditingResource(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSavingVenue}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
