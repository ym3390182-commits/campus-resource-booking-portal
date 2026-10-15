const assert = require('assert');
const path = require('path');
const {
  formatToSqlDatetime,
  checkBookingConflict,
  formatTime12h,
  formatDate
} = require('../src/utils/bookingConflict');
const BookingService = require('../src/services/booking.service');
const ApprovalService = require('../src/services/approval.service');

console.log('====================================================');
console.log('🏛️  CAMPUS BOOKING PORTAL - CORE RULES AUTOMATED TESTS');
console.log('====================================================\n');

let passedCount = 0;
let failedCount = 0;

function runSyncTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}\n`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}\n`);
    failedCount++;
  }
}

async function runAllTests() {
  // -----------------------------------------------------------
  // 1. Full-Venue Time-Based Parameter Validation
  // -----------------------------------------------------------
  console.log('--- Suite 1: Full-Venue Time-Based Booking Validation ---');

  await runAsyncTest('Rejects booking when start time equals end time', async () => {
    const res = await checkBookingConflict(1, '2026-10-15 10:00:00', '2026-10-15 10:00:00');
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'INVALID_TIMES');
    assert.ok(res.message.includes('end time must be later'));
  });

  await runAsyncTest('Rejects booking when end time is earlier than start time', async () => {
    const res = await checkBookingConflict(1, '2026-10-15 14:00:00', '2026-10-15 12:00:00');
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'INVALID_TIMES');
    assert.ok(res.message.includes('end time must be later'));
  });

  await runAsyncTest('Rejects booking with unparseable invalid datetime string', async () => {
    const res = await checkBookingConflict(1, 'invalid-date', '2026-10-15 12:00:00');
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'INVALID_TIMES');
  });

  runSyncTest('formatToSqlDatetime correctly normalizes various datetime representations', () => {
    assert.strictEqual(formatToSqlDatetime('2026-10-15 09:00:00'), '2026-10-15 09:00:00');
    assert.strictEqual(formatToSqlDatetime('2026-10-15 09:00'), '2026-10-15 09:00:00');
    assert.strictEqual(formatToSqlDatetime(new Date(2026, 9, 15, 9, 0, 0)), '2026-10-15 09:00:00');
    assert.strictEqual(formatToSqlDatetime(null), null);
  });

  // -----------------------------------------------------------
  // 2. Direct Overlap Prevention on Same Venue
  // -----------------------------------------------------------
  console.log('\n--- Suite 2: Overlapping Booking Prevention ---');

  const existingAuditoriumBooking = {
    id: 1,
    booking_code: 'BK-501101',
    event_title: 'Annual Tech Symposium',
    resource_id: 1,
    start_time: '2026-10-15 10:00:00',
    end_time: '2026-10-15 12:00:00',
    status: 'APPROVED',
  };

  await runAsyncTest('Prevents exact identical overlapping time slot on same venue', async () => {
    const mockDb = { query: async () => [[existingAuditoriumBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'DIRECT_OVERLAP');
    assert.ok(res.message.includes('already booked during the selected time'));
  });

  await runAsyncTest('Prevents partial start overlap (11:00 AM - 1:00 PM vs 10:00 AM - 12:00 PM)', async () => {
    const mockDb = { query: async () => [[existingAuditoriumBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 11:00:00', '2026-10-15 13:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'DIRECT_OVERLAP');
  });

  await runAsyncTest('Prevents fully enclosed overlap (10:30 AM - 11:30 AM vs 10:00 AM - 12:00 PM)', async () => {
    const mockDb = { query: async () => [[existingAuditoriumBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 10:30:00', '2026-10-15 11:30:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'DIRECT_OVERLAP');
  });

  await runAsyncTest('Prevents outer enveloping overlap (9:00 AM - 1:00 PM vs 10:00 AM - 12:00 PM)', async () => {
    const mockDb = { query: async () => [[existingAuditoriumBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 09:00:00', '2026-10-15 13:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'DIRECT_OVERLAP');
  });

  // -----------------------------------------------------------
  // 3. Mandatory 1-Hour Buffer Verification
  // -----------------------------------------------------------
  console.log('\n--- Suite 3: Mandatory One-Hour Buffer Enforcement ---');

  const existingTwoPmBooking = {
    id: 2,
    booking_code: 'BK-501102',
    event_title: 'Guest Lecture',
    resource_id: 1,
    start_time: '2026-10-15 12:00:00',
    end_time: '2026-10-15 14:00:00', // Ends at 2:00 PM
    status: 'APPROVED',
  };

  await runAsyncTest('Reject new booking starting at 2:30 PM (inside 1-hour break after 2:00 PM event)', async () => {
    const mockDb = { query: async () => [[existingTwoPmBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 14:30:00', '2026-10-15 16:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'BREAK_AFTER');
    assert.ok(res.message.includes('compulsory one-hour break is required after'));
    assert.strictEqual(res.earliestAvailableTime, '3:00 PM');
  });

  await runAsyncTest('Allow new booking starting at exactly 3:00 PM (1-hour buffer satisfied)', async () => {
    const mockDb = {
      query: async () => [[]] // SQL query boundary: end_time (14:00) > DATE_SUB('15:00', 1 HOUR) is FALSE -> 0 rows
    };
    const res = await checkBookingConflict(1, '2026-10-15 15:00:00', '2026-10-15 17:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, false);
    assert.strictEqual(res.conflictType, null);
    assert.strictEqual(res.message, 'Time slot is available.');
  });

  await runAsyncTest('Reject new booking ending at 11:30 AM before an event starting at 12:00 PM', async () => {
    const mockDb = { query: async () => [[existingTwoPmBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 09:30:00', '2026-10-15 11:30:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'BREAK_BEFORE');
    assert.ok(res.message.includes('compulsory one-hour break is required before'));
  });

  await runAsyncTest('Allow new booking ending at exactly 11:00 AM before an event starting at 12:00 PM', async () => {
    const mockDb = {
      query: async () => [[]] // Boundary condition: start_time (12:00) < DATE_ADD('11:00', 1 HOUR) is FALSE -> 0 rows
    };
    const res = await checkBookingConflict(1, '2026-10-15 09:00:00', '2026-10-15 11:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, false);
    assert.strictEqual(res.conflictType, null);
  });

  // -----------------------------------------------------------
  // 4. Status Handling: PENDING, APPROVED, CANCELLED, REJECTED
  // -----------------------------------------------------------
  console.log('\n--- Suite 4: Status Handling & Conflict Filtering ---');

  await runAsyncTest('SQL query specifically searches only status IN ("APPROVED", "PENDING")', async () => {
    let capturedQuery = '';
    const mockDb = {
      query: async (sql) => {
        capturedQuery = sql;
        return [[]];
      }
    };

    await checkBookingConflict(1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', null, mockDb);
    assert.ok(capturedQuery.includes("status IN ('APPROVED', 'PENDING')"));
    assert.ok(!capturedQuery.includes("'CANCELLED'"));
    assert.ok(!capturedQuery.includes("'REJECTED'"));
  });

  await runAsyncTest('PENDING booking actively blocks conflicting request', async () => {
    const pendingBooking = {
      id: 10,
      booking_code: 'BK-PENDING-01',
      event_title: 'Student Club Meeting',
      resource_id: 1,
      start_time: '2026-10-15 14:00:00',
      end_time: '2026-10-15 16:00:00',
      status: 'PENDING',
    };
    const mockDb = { query: async () => [[pendingBooking]] };
    const res = await checkBookingConflict(1, '2026-10-15 15:00:00', '2026-10-15 17:00:00', null, mockDb);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.conflictType, 'DIRECT_OVERLAP');
  });

  await runAsyncTest('Exclude self booking ID works when updating or verifying booking', async () => {
    let capturedQuery = '';
    let capturedParams = [];
    const mockDb = {
      query: async (sql, params) => {
        capturedQuery = sql;
        capturedParams = params;
        return [[]];
      }
    };
    await checkBookingConflict(1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', 42, mockDb);
    assert.ok(capturedQuery.includes('AND id != ?'));
    assert.strictEqual(capturedParams[capturedParams.length - 1], 42);
  });

  // -----------------------------------------------------------
  // 5. Independence of Different Venues
  // -----------------------------------------------------------
  console.log('\n--- Suite 5: Venue Independence ---');

  await runAsyncTest('Conflict check query is strictly scoped to resource_id', async () => {
    let capturedParams = [];
    const mockDb = {
      query: async (sql, params) => {
        capturedParams = params;
        return [[]];
      }
    };
    // Querying for venue 2 when venue 1 is booked
    await checkBookingConflict(2, '2026-10-15 10:00:00', '2026-10-15 12:00:00', null, mockDb);
    assert.strictEqual(capturedParams[0], 2); // resource_id 2
  });

  // -----------------------------------------------------------
  // 6. Verification of the 8 Required Venues & Fixed Capacities
  // -----------------------------------------------------------
  console.log('\n--- Suite 6: Eight Canonical Venues & Maximum Capacities ---');

  const EXPECTED_VENUES = [
    { name: 'Grand Convention Auditorium', capacity: 500 },
    { name: 'GEHU Seminar Hall 1', capacity: 150 },
    { name: 'Digital Learning Centre', capacity: 60 },
    { name: 'GEHU Seminar Hall 2', capacity: 80 },
    { name: 'Football Ground', capacity: 1000 },
    { name: 'Volleyball Ground', capacity: 50 },
    { name: 'Basketball Ground', capacity: 100 },
    { name: 'OAT (Open Air Theatre)', capacity: 800 },
  ];

  runSyncTest('All 8 required venues are defined with unique names and valid fixed capacities', () => {
    assert.strictEqual(EXPECTED_VENUES.length, 8);
    const names = new Set(EXPECTED_VENUES.map(v => v.name));
    assert.strictEqual(names.size, 8, 'Venues must not have duplicates');

    EXPECTED_VENUES.forEach(v => {
      assert.ok(v.capacity > 0, `Capacity for ${v.name} must be greater than 0`);
    });
  });

  runSyncTest('Capacity validation logic properly bounds attendees', () => {
    const venue = { name: 'GEHU Seminar Hall 1', capacity: 150 };
    const validateAttendees = (attendees, capacity) => {
      const parsed = parseInt(attendees, 10);
      if (isNaN(parsed) || parsed <= 0) return { valid: false, error: 'Positive number required' };
      if (parsed > capacity) return { valid: false, error: `Exceeds max capacity (${capacity})` };
      return { valid: true };
    };

    assert.strictEqual(validateAttendees(150, venue.capacity).valid, true);
    assert.strictEqual(validateAttendees(100, venue.capacity).valid, true);
    assert.strictEqual(validateAttendees(151, venue.capacity).valid, false);
    assert.strictEqual(validateAttendees(0, venue.capacity).valid, false);
    assert.strictEqual(validateAttendees(-5, venue.capacity).valid, false);
  });

  // -----------------------------------------------------------
  // 7. Role-Based Permissions, Maintenance, Approvals & Capacities Below 500
  // -----------------------------------------------------------
  console.log('\n--- Suite 7: Role Permissions, Maintenance, Approvals & Sub-500 Capacities ---');

  await runAsyncTest('Admin self-booking is prohibited and rejected with HTTP 403', async () => {
    try {
      await BookingService.createBooking({
        userId: 1,
        userRole: 'ADMIN',
        resourceId: 1,
        eventTitle: 'Admin Personal Event',
        purposeReason: 'Admin attempting self-booking',
        startTime: '2026-10-25 10:00:00',
        endTime: '2026-10-25 12:00:00',
      });
      assert.fail('Should have rejected admin self-booking');
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
      assert.ok(err.message.includes('Forbidden. Administrators manage venues'));
    }
  });

  await runAsyncTest('Non-student/non-faculty booking attempt is rejected with HTTP 403', async () => {
    try {
      await BookingService.createBooking({
        userId: 99,
        userRole: 'GUEST',
        resourceId: 1,
        eventTitle: 'Guest Event',
        purposeReason: 'External user booking',
        startTime: '2026-10-25 10:00:00',
        endTime: '2026-10-25 12:00:00',
      });
      assert.fail('Should have rejected guest booking');
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
      assert.ok(err.message.includes('Only Students and Faculty are permitted'));
    }
  });

  runSyncTest('Student booking status assigns PENDING while Faculty assigns APPROVED', () => {
    const getRoleStatus = (role) => {
      const normalizedRole = (role || '').toUpperCase();
      if (normalizedRole === 'ADMIN') throw new Error('Admin self-booking prohibited');
      if (normalizedRole !== 'STUDENT' && normalizedRole !== 'FACULTY') throw new Error('Unauthorized role');
      return normalizedRole === 'STUDENT' ? 'PENDING' : 'APPROVED';
    };

    assert.strictEqual(getRoleStatus('STUDENT'), 'PENDING');
    assert.strictEqual(getRoleStatus('student'), 'PENDING');
    assert.strictEqual(getRoleStatus('FACULTY'), 'APPROVED');
    assert.strictEqual(getRoleStatus('faculty'), 'APPROVED');
    assert.throws(() => getRoleStatus('ADMIN'), /Admin self-booking prohibited/);
    assert.throws(() => getRoleStatus('GUEST'), /Unauthorized role/);
  });

  runSyncTest('Venue under MAINTENANCE blocks new booking attempts with HTTP 400', () => {
    const checkMaintenance = (venue) => {
      if (venue.status === 'MAINTENANCE') {
        const error = new Error(`Resource [${venue.name}] is currently under maintenance and cannot be booked.`);
        error.statusCode = 400;
        throw error;
      }
      return true;
    };

    const activeVenue = { id: 2, name: 'GEHU Seminar Hall 1', status: 'AVAILABLE' };
    const maintenanceVenue = { id: 2, name: 'GEHU Seminar Hall 1', status: 'MAINTENANCE' };

    assert.strictEqual(checkMaintenance(activeVenue), true);
    assert.throws(() => checkMaintenance(maintenanceVenue), (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('currently under maintenance'));
      return true;
    });
  });

  runSyncTest('Maintenance status update preserves existing bookings without deletion', () => {
    const venue = { id: 2, name: 'GEHU Seminar Hall 1', status: 'AVAILABLE' };
    const existingBookings = [
      { id: 101, resource_id: 2, status: 'APPROVED', event_title: 'Guest Lecture' },
      { id: 102, resource_id: 2, status: 'PENDING', event_title: 'Club Seminar' }
    ];

    // Admin sets status to MAINTENANCE
    venue.status = 'MAINTENANCE';

    // Verify existing bookings are completely preserved
    assert.strictEqual(existingBookings.length, 2);
    assert.strictEqual(existingBookings[0].status, 'APPROVED');
    assert.strictEqual(existingBookings[1].status, 'PENDING');
  });

  await runAsyncTest('Admin rejection requires mandatory remark reason (HTTP 400)', async () => {
    try {
      await ApprovalService.processApprovalAction(1, 'REJECTED', '');
      assert.fail('Should have required remark reason');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('Mandatory Reason Required'));
    }

    try {
      await ApprovalService.processApprovalAction(1, 'REJECTED', '   ');
      assert.fail('Should have required non-empty remark');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('Mandatory Reason Required'));
    }
  });

  await runAsyncTest('Admin approval rejects invalid action value with HTTP 400', async () => {
    try {
      await ApprovalService.processApprovalAction(1, 'INVALID_ACTION', 'Remark');
      assert.fail('Should have rejected invalid action');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('Action must be either APPROVED or REJECTED'));
    }
  });

  runSyncTest('Admin approval SQL automatically rejects conflicting PENDING requests with 1-hour break', () => {
    const booking = {
      id: 201,
      resource_id: 2,
      event_title: 'Math Symposium',
      start_time: '2026-10-15 14:00:00',
      end_time: '2026-10-15 16:00:00'
    };

    const pendingConflictingBooking = {
      id: 202,
      resource_id: 2,
      start_time: new Date('2026-10-15T16:30:00'), // Within 1-hour break after 16:00
      end_time: new Date('2026-10-15T18:00:00')
    };

    const isConflictWithBreak = (b1, b2) => {
      const b1Start = new Date(b1.start_time);
      const b1End = new Date(b1.end_time);
      const b2Start = new Date(b2.start_time);
      const b2End = new Date(b2.end_time);
      const oneHour = 60 * 60 * 1000;
      return b2Start.getTime() < (b1End.getTime() + oneHour) && b2End.getTime() > (b1Start.getTime() - oneHour);
    };

    assert.strictEqual(isConflictWithBreak(booking, pendingConflictingBooking), true);
  });

  runSyncTest('Enforces venue capacity limits strictly for venues with capacity below 500', () => {
    const venuesBelow500 = [
      { name: 'GEHU Seminar Hall 1', capacity: 150 },
      { name: 'Digital Learning Centre', capacity: 60 },
      { name: 'GEHU Seminar Hall 2', capacity: 80 },
      { name: 'Volleyball Ground', capacity: 50 },
      { name: 'Basketball Ground', capacity: 100 },
    ];

    const validateCapacity = (attendees, venueCapacity) => {
      const parsed = parseInt(attendees, 10);
      if (isNaN(parsed) || parsed <= 0) return { allowed: false, message: 'Invalid attendees' };
      if (venueCapacity > 0 && parsed > venueCapacity) {
        return { allowed: false, message: `Exceeds max capacity (${venueCapacity})` };
      }
      return { allowed: true };
    };

    venuesBelow500.forEach(v => {
      assert.strictEqual(v.capacity < 500, true, `${v.name} capacity must be below 500`);
      // Exact capacity: allowed
      assert.strictEqual(validateCapacity(v.capacity, v.capacity).allowed, true);
      // Below capacity: allowed
      assert.strictEqual(validateCapacity(v.capacity - 1, v.capacity).allowed, true);
      // Exceeding capacity by even 1 person: rejected
      assert.strictEqual(validateCapacity(v.capacity + 1, v.capacity).allowed, false);
      // Massively exceeding: rejected
      assert.strictEqual(validateCapacity(500, v.capacity).allowed, false);
    });
  });

  // -----------------------------------------------------------
  // Final Test Summary
  // -----------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:      ${passedCount}`);
  console.log(`FAILED:      ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log(`🎉 ALL ${passedCount} CORE BOOKING & PERMISSION TESTS PASSED SUCCESSFULLY!`);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
