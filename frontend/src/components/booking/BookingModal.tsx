import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, FileText, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Resource } from '../../types';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  resource,
  onSuccess,
}) => {
  const [eventTitle, setEventTitle] = useState('');
  const [purposeReason, setPurposeReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('11:00');
  const [isLoading, setIsLoading] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Default to tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split('T')[0]);
      setHasConflict(false);
    }
  }, [isOpen]);

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !purposeReason || !startDate || !startTimeStr || !endTimeStr) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    const fullStartTime = `${startDate} ${startTimeStr}:00`;
    const fullEndTime = `${startDate} ${endTimeStr}:00`;

    setIsLoading(true);
    try {
      const response = await api.post('/bookings', {
        resourceId: resource.id,
        eventTitle,
        purposeReason,
        startTime: fullStartTime,
        endTime: fullEndTime,
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
      if (error.response?.status === 409) {
        setHasConflict(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-2xl rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-800 relative overflow-hidden"
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
              <h3 className="text-lg font-bold text-slate-100">Reserve Venue: {resource.name}</h3>
              <p className="text-xs text-slate-400">
                {resource.building} {resource.room_number ? `(${resource.room_number})` : ''} • Capacity: {resource.capacity} Seats
              </p>
            </div>
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

            {/* Purpose / Mandatory Justification Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Mandatory Booking Purpose & Justification
              </label>
              <textarea
                rows={3}
                placeholder="Describe the objective of this booking (e.g. Mandatory lab examination, Guest lecture series)..."
                value={purposeReason}
                onChange={(e) => setPurposeReason(e.target.value)}
                className="w-full rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 text-sm p-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            {/* Conflict Warning Indicator */}
            {hasConflict && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Slot Conflict: This venue is already booked for the selected time slot. Please choose another time.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Confirm & Submit Booking
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
