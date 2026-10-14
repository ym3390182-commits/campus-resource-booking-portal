export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  department?: string;
  roll_or_emp_id?: string;
  created_at?: string;
}

export interface ResourceType {
  id: number;
  name: string;
  icon_name: string;
}

export interface Resource {
  id: number;
  name: string;
  resource_type_id: number;
  resource_type_name?: string;
  icon_name?: string;
  building: string;
  room_number?: string;
  capacity: number;
  amenities: string;
  status: 'AVAILABLE' | 'MAINTENANCE';
  computed_status?: 'AVAILABLE' | 'BOOKED' | 'BREAK_PERIOD' | 'MAINTENANCE';
  availability_message?: string;
  earliest_available_time?: string | null;
  created_at?: string;
  upcoming_bookings?: Booking[];
}

export interface Booking {
  id: number;
  booking_code: string;
  resource_id: number;
  resource_name?: string;
  building?: string;
  room_number?: string;
  user_id: number;
  user_name?: string;
  booked_by?: string;
  student_name?: string;
  user_email?: string;
  department?: string;
  roll_or_emp_id?: string;
  event_title: string;
  purpose_reason: string;
  start_time: string;
  end_time: string;
  expected_attendees?: number | null;
  venue_capacity?: number;
  capacity?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  admin_remark?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  title_code: string;
  event_title: string;
  start: string;
  end: string;
  status: string;
  resource_name: string;
  building: string;
  booked_by: string;
  expected_attendees?: number | null;
}

export interface DashboardMetrics {
  totalBookingsCount: number;
  pendingApprovalsCount: number;
  approvedEventsCount: number;
  activeResourcesCount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  todaysEvents: Booking[];
  recentActivity: Booking[];
  resourceOverview: Resource[];
}

export interface VenueScheduleEvent {
  id: number;
  booking_code: string;
  event_title: string;
  start_time: string;
  end_time: string;
  formatted_start: string;
  formatted_end: string;
  status: string;
  expected_attendees?: number | null;
}

export interface VenueScheduleBreak {
  after_booking_id: number;
  after_event_title: string;
  break_start: string;
  break_end: string;
  formatted_break_start: string;
  formatted_break_end: string;
}

export interface VenueScheduleResponse {
  resource: {
    id: number;
    name: string;
    capacity: number;
    building: string;
    status: string;
  };
  date: string;
  events: VenueScheduleEvent[];
  breaks: VenueScheduleBreak[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
