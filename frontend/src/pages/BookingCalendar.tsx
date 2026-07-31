import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '../components/common/Card';
import { CalendarEvent } from '../types';
import api from '../services/api';
import { Sparkles, Calendar as CalendarIcon } from 'lucide-react';

export const BookingCalendar: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/bookings/calendar');
      const rawEvents: CalendarEvent[] = response.data.data;

      // Transform raw events for FullCalendar
      const formattedEvents = rawEvents.map((evt) => ({
        id: String(evt.id),
        title: `${evt.resource_name} (${evt.event_title})`,
        start: evt.start,
        end: evt.end,
        backgroundColor: evt.status === 'APPROVED' ? '#10b981' : '#f59e0b',
        borderColor: evt.status === 'APPROVED' ? '#059669' : '#d97706',
        textColor: '#ffffff',
        extendedProps: {
          bookedBy: evt.booked_by,
          building: evt.building,
          code: evt.title_code,
          status: evt.status,
        },
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Master Campus Calendar <Sparkles className="w-4 h-4 text-indigo-400" />
        </h1>
        <p className="text-xs text-slate-400">Interactive timeline of approved and pending venue reservations</p>
      </div>

      <Card variant="glass" className="p-6 border-slate-800">
        <div className="fullcalendar-dark-theme text-xs text-slate-200">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            height="auto"
            aspectRatio={1.8}
            eventClick={(info) => {
              const props = info.event.extendedProps;
              alert(
                `📅 Event: ${info.event.title}\n` +
                `🏷️ Booking Code: ${props.code}\n` +
                `👤 Booked By: ${props.bookedBy}\n` +
                `Status: ${props.status}`
              );
            }}
          />
        </div>
      </Card>
    </div>
  );
};
