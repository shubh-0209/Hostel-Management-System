import request from 'supertest';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Mock the auth middleware so we can simulate warden and student roles without real JWTs.
vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    const role = req.headers['x-test-role'] || 'unauthenticated';
    if (role === 'unauthenticated') {
      const { ApiError } = require('../src/utils/ApiError.js');
      return next(new ApiError(401, 'Unauthorized'));
    }
    req.user = {
      id: role === 'warden' ? 'ffef0d42-c572-4c6e-a8df-c94e726775fc' : 'a285a66a-1863-4dbf-9c84-4f6c6f00e37e',
      role: role
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

// Mock the Supabase client to prevent actual DB calls during API tests
vi.mock('../src/config/supabase.js', () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(function() {
      // Simulate success responses based on context (roughly)
      return Promise.resolve({ data: { id: 'mocked-id', status: 'available' }, error: null });
    }),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: [], count: 0, error: null }))
  };
  
  return {
    supabase: {
      from: vi.fn(() => chainable)
    }
  };
});

const app = express();
app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);

let testHostelId = '123e4567-e89b-12d3-a456-426614174000';
let testFloorId = '123e4567-e89b-12d3-a456-426614174001';
let testRoomId = '123e4567-e89b-12d3-a456-426614174002';
let testBedId = '123e4567-e89b-12d3-a456-426614174003';

describe('Infrastructure API Tests (Mocked DB)', () => {
  
  describe('HOSTELS', () => {
    it('7. Unauthenticated request -> 401', async () => {
      const res = await request(app).get('/api/v1/hostels');
      expect(res.statusCode).toBe(401);
    });

    it('6. Student cannot create hostel -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/hostels')
        .set('x-test-role', 'student')
        .send({ name: 'Student Hostel', code: 'STU-1', academic_years: [1] });
      expect(res.statusCode).toBe(403);
    });

// Cleanup omitted for mocked DB
  });
});
