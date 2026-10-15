import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  Users,
  CheckCircle2,
  Coffee,
  Info,
  Shield,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Resource, VenueScheduleResponse } from '../../types';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  resource,
  initialDate,
  initialStartTime,
  initialEndTime,
  onSuccess,
}) => {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
  const [eventTitle, setEventTitle] = useState('');
  const [purposeReason, setPurposeReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('11:00');
  const [expectedAttendees, setExpectedAttendees] = useState<string>('');
  const [scheduleData, setScheduleData] = useState<VenueScheduleResponse | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation feedback state
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (isOpen && resource) {
      const defaultDate = initialDate || (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      })();

      setStartDate(defaultDate);
      setStartTimeStr(initialStartTime || '09:00');
      setEndTimeStr(initialEndTime || '11:00');
      setExpectedAttendees('');
      setConflictMessage(null);
      setIsConflict(false);
    }
  }, [isOpen, resource, initialDate, initialStartTime, initialEndTime]);

  // Fetch venue schedule timeline when date or venue changes
  useEffect(() => {
    if (isOpen && resource && startDate) {
      fetchDaySchedule(resource.id, startDate);
    }
  }, [isOpen, resource, startDate]);

  // Validate times and compute conflicts against the fetched schedule in real-time
  useEffect(() => {
    if (!startDate || !startTimeStr || !endTimeStr) return;

    const s = new Date(`${startDate}T${startTimeStr}:00`);
    const e = new Date(`${startDate}T${endTimeStr}:00`);

    if (s >= e) {
      setIsConflict(true);
      setConflictMessage('The selected end time must be later than the start time.');
      return;
    }

    if (s < new Date()) {
      setIsConflict(true);
      setConflictMessage('Cannot book a time slot in the past.');
      return;
    }

    // Check attendee capacity limit
    if (expectedAttendees && resource && resource.capacity > 0) {
      const attendees = parseInt(expectedAttendees, 10);
      if (attendees > resource.capacity) {
        setIsConflict(true);
        setConflictMessage(
          `Expected attendees (${attendees}) exceeds maximum venue capacity (${resource.capacity} people).`
        );
        return;
      }
    }

    if (!scheduleData || scheduleData.events.length === 0) {
      setIsConflict(false);
      setConflictMessage(null);
      return;
    }

    // Check against day's events and 1-hour breaks
    let foundConflict = false;
    let message = '';

    for (const evt of scheduleData.events) {
      const existStart = new Date(evt.start_time);
      const existEnd = new Date(evt.end_time);
      const oneHour = 60 * 60 * 1000;
      const breakEnd = new Date(existEnd.getTime() + oneHour);
      const breakStart = new Date(existStart.getTime() - oneHour);

      // 1. Direct overlap
      if (s < existEnd && e > existStart) {
        foundConflict = true;
        message = `This venue is already booked during the selected time for '${evt.event_title}' (${evt.formatted_start} - ${evt.formatted_end}). Earliest next available time is ${formatTime(breakEnd)}.`;
        break;
      }

      // 2. Break violation AFTER existing event
      if (s >= existEnd && s < breakEnd) {
        foundConflict = true;
        message = `A compulsory one-hour break is required after '${evt.event_title}' (${evt.formatted_start} - ${evt.formatted_end}). The earliest next available time is ${formatTime(breakEnd)}.`;
        break;
      }

      // 3. Break violation BEFORE existing event
      if (e <= existStart && e > breakStart) {
        foundConflict = true;
        message = `A compulsory one-hour break is required before event '${evt.event_title}' starting at ${evt.formatted_start}. Your event must end by ${formatTime(breakStart)}.`;
        break;
      }
    }

    if (foundConflict) {
      setIsConflict(true);
      setConflictMessage(message);
    } else {
      setIsConflict(false);
      setConflictMessage(null);
    }
  }, [startDate, startTimeStr, endTimeStr, expectedAttendees, scheduleData, resource]);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const fetchDaySchedule = async (resourceId: number, dateStr: string) => {
    setIsLoadingSchedule(true);
    try {
      const response = await api.get(`/resources/${resourceId}/schedule`, {
        params: { date: dateStr },
      });
      setScheduleData(response.data.data);
    } catch (err) {
      console.error('Failed to load venue schedule timeline:', err);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      toast.error('Administrators manage venues and cannot create personal booking requests.');
      return;
    }

    if (!eventTitle || !purposeReason || !startDate || !startTimeStr || !endTimeStr) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    if (isConflict) {
      toast.error(conflictMessage || 'Please fix the scheduling conflict before submitting.');
      return;
    }

    const fullStartTime = `${startDate} ${startTimeStr}:00`;
    const fullEndTime = `${startDate} ${endTimeStr}:00`;

    setIsSubmitting(true);
    try {
      const response = await api.post('/bookings', {
        resourceId: resource.id,
        eventTitle,
        purposeReason,
        startTime: fullStartTime,
        endTime: fullEndTime,
        expectedAttendees: expectedAttendees ? parseInt(expectedAttendees, 10) : null,
      });

      const booking = response.data.data;
      if (booking.status === 'APPROVED') {
        toast.success(`Booking Instant Approved! Code: ${booking.booking_code} 🎉`);
      } else {
        toast.success(`Booking submitted for Admin approval! Code: ${booking.booking_code} ⏳`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit booking request.';
      toast.error(message);
      setIsConflict(true);
      setConflictMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-3xl rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-800 relative overflow-hidden my-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Full-Venue Booking: {resource.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{resource.building} {resource.room_number ? `(${resource.room_number})` : ''}</span>
                <span>•</span>
                <span className="text-indigo-300 font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Maximum Capacity: {resource.capacity} People
                </span>
              </p>
            </div>
          </div>

          {/* Day's Existing Schedule Timeline Box */}
          <div className="mb-6 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Existing Schedule on {startDate}
              </span>
              <span className="text-[11px] text-slate-500">Compulsory 1-Hour Break Enforced</span>
            </div>

            {isLoadingSchedule ? (
              <p className="text-xs text-slate-500 italic py-2">Loading venue schedule...</p>
            ) : scheduleData && scheduleData.events.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 py-1">
                <CheckCircle2 className="w-4 h-4" /> Venue is completely free all day on this date!
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {scheduleData?.events.map((evt) => (
                  <div key={evt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="font-medium text-slate-200">
                        🔴 <strong>{evt.formatted_start} - {evt.formatted_end}</strong>: {evt.event_title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Code: {evt.booking_code}</span>
                    </div>
                    {/* Display Break period */}
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pl-3">
                      <Coffee className="w-3 h-3" />
                      <span>
                        1-Hour Cleaning/Setup Break: <strong>{evt.formatted_end}</strong> to{' '}
                        <strong>
                          {formatTime(new Date(new Date(evt.end_time).getTime() + 60 * 60 * 1000))}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Event Title / Academic Session"
              placeholder="e.g. Annual CS Hackathon Inauguration"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Date of Event"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />

              <Input
                label="Start Time"
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                leftIcon={<Clock className="w-4 h-4" />}
                required
              />

              <Input
                label="End Time"
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                leftIcon={<Clock className="w-4 h-4" />}
                required
              />
            </div>

            {/* Expected Attendees Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label={`Expected Number of Attendees (Max: ${resource.capacity} People)`}
                type="number"
                min="1"
                max={resource.capacity > 0 ? resource.capacity : undefined}
                placeholder={`e.g. ${resource.capacity ? Math.min(100, resource.capacity) : 50}`}
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(e.target.value)}
                leftIcon={<Users className="w-4 h-4" />}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Venue Capacity Rule</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>One booking reserves the full venue. Attendee count must not exceed venue capacity.</span>
                </div>
              </div>
            </div>

            {/* Purpose / Mandatory Justification Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Mandatory Booking Purpose & Justification
              </label>
              <textarea
                rows={3}
                placeholder="Describe the objective of this booking (e.g. Inter-college tournament, Guest seminar)..."
                value={purposeReason}
                onChange={(e) => setPurposeReason(e.target.value)}
                className="w-full rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 text-sm p-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            {/* Admin Self-Booking Prohibition Banner */}
            {isAdmin && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong className="block font-bold">Admin Portal Management Notice:</strong>
                  Administrators manage campus venues and review reservation requests. Admin self-booking is disabled.
                </div>
              </div>
            )}

            {/* Real-time Conflict Alert Banner */}
            {isConflict && conflictMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-400 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{conflictMessage}</span>
              </div>
            )}

            {/* Available Green Confirmation Banner */}
            {!isAdmin && !isConflict && !conflictMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Selected time slot is available and satisfies the 1-hour break policy!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isConflict || isAdmin}
                isLoading={isSubmitting}
              >
                {isAdmin ? 'Admin Self-Booking Disabled' : 'Confirm & Submit Booking'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
