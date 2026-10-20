import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    const role = req.headers['x-test-role'] || 'unauthenticated';
    if (role === 'unauthenticated') {
      const { ApiError } = require('../src/utils/ApiError.js');
      return next(new ApiError(401, 'Unauthorized'));
    }
    req.user = {
      id: role === 'warden' ? 'warden-id' : 'student-id',
      role: role,
      email: role === 'warden' ? 'warden@campus.edu' : 'student@campus.edu'
    };
    next();
  },
  requireRole: (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      const { ApiError } = require('../src/utils/ApiError.js');
      return next(new ApiError(403, 'Forbidden'));
    }
    next();
  }
}));

vi.mock('../src/config/supabase.js', () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(function() {
      return Promise.resolve({ 
        data: { 
          id: 'mocked-id', 
          name: 'Student Name', 
          jntu_number: '21B71A0501', 
          status: 'pending',
          bed_id: 'b819fbc7-9a84-4fe2-b91c-d7ce9a7384db',
          bed: {
            id: 'bed-1',
            bed_number: 1,
            room: {
              id: 'room-1',
              room_number: '101',
              type: 'Deluxe',
              floor: {
                id: 'floor-1',
                floor_number: 1,
                hostel_id: 'hostel-1',
                hostel: { id: 'hostel-1', name: 'Ganga Hostel', code: 'GH-A' }
              }
            }
          }
        }, 
        error: null 
      });
    }),
    maybeSingle: vi.fn().mockImplementation(function() {
      return Promise.resolve({ 
        data: {
          id: 'alloc-1',
          status: 'active',
          allocated_at: new Date().toISOString(),
          bed: {
            id: 'bed-1',
            bed_number: 1,
            room: {
              id: 'room-1',
              room_number: '101',
              type: 'Deluxe',
              floor: {
                id: 'floor-1',
                floor_number: 1,
                hostel_id: 'hostel-1',
                hostel: { id: 'hostel-1', name: 'Ganga Hostel', code: 'GH-A' }
              }
            }
          }
        },
        error: null
      });
    }),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: [], count: 0, error: null }))
  };

  return {
    supabase: {
      from: vi.fn(() => chainable),
      rpc: vi.fn().mockImplementation((fnName, args) => {
        if (fnName === 'allocate_bed') {
          return Promise.resolve({ data: { success: true, message: 'Bed allocated successfully' }, error: null });
        }
        if (fnName === 'vacate_bed') {
          return Promise.resolve({ data: { success: true, message: 'Bed vacated successfully' }, error: null });
        }
        return Promise.resolve({ data: { success: true }, error: null });
      })
    }
  };
});

const app = express();
app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);

describe('Student Portal Complete Integration Tests', () => {

  describe('1. Authentication & RBAC', () => {
    it('Authentication missing -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/student/profile');
      expect(res.statusCode).toBe(401);
    });

    it('Student accessing warden routes -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/warden/dashboard-stats')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(403);
    });

    it('Warden accessing student routes -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('x-test-role', 'warden');
      expect(res.statusCode).toBe(403);
    });
  });

  describe('2. Student Profile', () => {
    it('Student can fetch own profile with email and allocation -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe('student@campus.edu');
    });

    it('Valid profile update (phone and parent_email) -> 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('x-test-role', 'student')
        .send({ phone: '9876543210', parent_email: 'parent@domain.com' });
      expect(res.statusCode).toBe(200);
    });

    it('Invalid phone number -> 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('x-test-role', 'student')
        .send({ phone: '123' }); // too short
      expect(res.statusCode).toBe(422);
    });

    it('Invalid parent_email -> 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('x-test-role', 'student')
        .send({ parent_email: 'not-an-email' });
      expect(res.statusCode).toBe(422);
    });

    it('Empty update payload -> 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('x-test-role', 'student')
        .send({});
      expect(res.statusCode).toBe(422);
    });
  });

  describe('3. Bed Allocation & Vacating', () => {
    it('Student can retrieve active allocation -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/student/allocation')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });

    it('Student can allocate a bed with valid UUID -> 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/student/allocation')
        .set('x-test-role', 'student')
        .send({ bed_id: 'e4a52026-6a58-4521-88fc-8f7ba7e07671' });
      expect(res.statusCode).toBe(200);
    });

    it('Allocation with invalid UUID is rejected -> 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .post('/api/v1/student/allocation')
        .set('x-test-role', 'student')
        .send({ bed_id: 'invalid-id' });
      expect(res.statusCode).toBe(422);
    });

    it('Student can vacate their bed -> 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/student/allocation/vacate')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Bed vacated successfully');
    });
  });

  describe('4. Out Pass & Leave Applications', () => {
    it('Submit valid Out Pass -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/student/outings')
        .set('x-test-role', 'student')
        .send({
          application_type: 'out_pass',
          out_datetime: new Date(Date.now() + 3600000).toISOString(),
          in_datetime: new Date(Date.now() + 18000000).toISOString(),
          reason: 'Doctor appointment in city hospital',
          destination: 'City Hospital',
          contact_info: '9876543210'
        });
      expect(res.statusCode).toBe(201);
    });

    it('Submit valid Extended Leave -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/student/outings')
        .set('x-test-role', 'student')
        .send({
          application_type: 'leave',
          leave_from_date: '2026-11-01',
          leave_to_date: '2026-11-05',
          leave_type: 'home_leave',
          reason: 'Attending family festival at hometown',
          destination: 'Hometown',
          contact_info: '9876543210'
        });
      expect(res.statusCode).toBe(201);
    });

    it('Reject Out Pass when return time is before departure -> 422', async () => {
      const res = await request(app)
        .post('/api/v1/student/outings')
        .set('x-test-role', 'student')
        .send({
          application_type: 'out_pass',
          out_datetime: new Date(Date.now() + 18000000).toISOString(),
          in_datetime: new Date(Date.now() + 3600000).toISOString(),
          reason: 'Invalid return time'
        });
      expect(res.statusCode).toBe(422);
    });

    it('Cancel pending outing request -> 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/student/outings/mocked-id/cancel')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('5. Notifications', () => {
    it('Fetch student notifications -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/student/notifications')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });

    it('Mark individual notification as read -> 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/student/notifications/mocked-id/read')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });

    it('Mark all notifications as read -> 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/student/notifications/read-all')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('6. Maintenance & Complaints', () => {
    it('Submit valid maintenance complaint -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/student/maintenance')
        .set('x-test-role', 'student')
        .send({
          issue_type: 'Electrical Issue',
          priority: 'high',
          description: 'Ceiling fan is making abnormal noise and overheating'
        });
      expect(res.statusCode).toBe(201);
    });

    it('Reject maintenance complaint with too short description -> 422', async () => {
      const res = await request(app)
        .post('/api/v1/student/maintenance')
        .set('x-test-role', 'student')
        .send({
          issue_type: 'Electrical Issue',
          description: 'Fan' // less than 5 chars
        });
      expect(res.statusCode).toBe(422);
    });

    it('Fetch student maintenance requests -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/student/maintenance')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });

    it('Cancel pending maintenance complaint -> 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/student/maintenance/mocked-id/cancel')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('7. Security & Student Isolation', () => {
    it('Student cannot modify protected fields (role, academic_year, jntu_number) -> 422', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('x-test-role', 'student')
        .send({
          role: 'warden',
          academic_year: 4,
          jntu_number: 'HACKED123'
        });
      // Rejected because no valid editable field (phone/parent_email) was provided
      expect(res.statusCode).toBe(422);
    });

    it('Student isolation: Outing cancellation requires student ownership', async () => {
      // Mocking fetch returning null when querying another student's outing
      const { supabase } = await import('../src/config/supabase.js');
      const originalSingle = supabase.from().single;
      
      supabase.from().single.mockImplementationOnce(() => 
        Promise.resolve({ data: null, error: { message: 'Not found' } })
      );

      const res = await request(app)
        .patch('/api/v1/student/outings/other-student-id/cancel')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(404);
    });

    it('Student isolation: Maintenance cancellation requires student ownership', async () => {
      const { supabase } = await import('../src/config/supabase.js');
      supabase.from().single.mockImplementationOnce(() => 
        Promise.resolve({ data: null, error: { message: 'Not found' } })
      );

      const res = await request(app)
        .patch('/api/v1/student/maintenance/other-student-complaint/cancel')
        .set('x-test-role', 'student');
      expect(res.statusCode).toBe(404);
    });
  });

});
