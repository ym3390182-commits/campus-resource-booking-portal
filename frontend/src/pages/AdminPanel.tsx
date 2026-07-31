import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/SkeletonLoader';
import { Booking, Resource } from '../types';
import api from '../services/api';
import { CheckSquare, CheckCircle2, XCircle, Sparkles, Building2, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'RESOURCES'>('APPROVALS');
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rejection remark modal state
  const [rejectingBookingId, setRejectingBookingId] = useState<number | null>(null);
  const [adminRemark, setAdminRemark] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'APPROVALS') {
        const response = await api.get('/approvals/pending');
        setPendingRequests(response.data.data);
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
  }, [activeTab]);

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
      toast.success(`Resource status updated to ${nextStatus}.`);
      fetchAdminData();
    } catch (error: any) {
      toast.error('Failed to update resource status.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Admin Management Portal <Sparkles className="w-4 h-4 text-indigo-400" />
        </h1>
        <p className="text-xs text-slate-400">Approve student reservation requests and manage university venues</p>
      </div>

      {/* Admin Sub-Header Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'APPROVALS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Pending Approvals Queue ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('RESOURCES')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'RESOURCES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Campus Venues Management
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
                    <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Venue: <strong className="text-slate-200">{request.resource_name} ({request.building})</strong></span>
                      <span>•</span>
                      <span>Slot: <strong className="text-slate-200">{new Date(request.start_time).toLocaleString()}</strong></span>
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

      {/* Tab 2: Manage Resources */}
      {activeTab === 'RESOURCES' && (
        <div className="space-y-4">
          <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4">Resource Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Building</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Toggle Maintenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-slate-900/40">
                    <td className="p-4 font-bold text-slate-200">{resource.name}</td>
                    <td className="p-4 text-indigo-400 font-medium">{resource.resource_type_name}</td>
                    <td className="p-4 text-slate-300">{resource.building}</td>
                    <td className="p-4 text-slate-300">{resource.capacity} Seats</td>
                    <td className="p-4"><StatusBadge status={resource.status} /></td>
                    <td className="p-4 text-right">
                      <Button
                        variant={resource.status === 'AVAILABLE' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleStatus(resource)}
                      >
                        Set to {resource.status === 'AVAILABLE' ? 'Maintenance' : 'Available'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};
