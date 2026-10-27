import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Mock auth middleware for role simulation
vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    const role = req.headers['x-test-role'] || 'unauthenticated';
    if (role === 'unauthenticated') {
      const { ApiError } = require('../src/utils/ApiError.js');
      return next(new ApiError(401, 'Unauthorized'));
    }
    req.user = {
      id: role === 'warden' ? 'ffef0d42-c572-4c6e-a8df-c94e726775fc' : 'a285a66a-1863-4dbf-9c84-4f6c6f00e37e',
      role: role,
      email: role === 'warden' ? 'warden@hms.edu' : 'student@hms.edu',
    };
    next();
  },
  requireRole: (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      const { ApiError } = require('../src/utils/ApiError.js');
      return next(new ApiError(403, 'Forbidden'));
    }
    next();
  },
}));

// Mock Supabase
const validHostelId = '8910823d-5809-48d6-9220-bde3fc7d584f';
const validMenuId = 'a1234567-89ab-4cde-8f01-23456789abcd';
const nonexistentHostelId = 'e1234567-89ab-4cde-8f01-23456789abcd';
const nonexistentMenuId = 'f1234567-89ab-4cde-8f01-23456789abcd';

let mockHostels = [
  { id: validHostelId, name: 'Hostel Alpha', code: 'HST-A', status: 'active' },
];

let mockMessMenu = [
  {
    id: validMenuId,
    hostel_id: validHostelId,
    day_of_week: 1,
    meal_type: 'breakfast',
    menu_items: 'Poha, Banana, Tea',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockAllocation = {
  id: 'alloc-1',
  status: 'active',
  bed: {
    id: 'bed-1',
    room: {
      id: 'room-1',
      floor: {
        id: 'floor-1',
        hostel: {
          id: validHostelId,
          name: 'Hostel Alpha',
          code: 'HST-A',
          status: 'active',
        },
      },
    },
  },
};

let simulateHostelNotFound = false;
let simulateDuplicateKey = false;
let simulateEntryNotFound = false;

vi.mock('../src/config/supabase.js', () => {
  return {
    supabase: {
      from: vi.fn((table) => {
        const queryState = {
          table,
          filters: {},
          isInsert: false,
          isUpdate: false,
          isDelete: false,
          insertData: null,
          updateData: null,
        };

        const chain = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn((data) => {
            queryState.isInsert = true;
            queryState.insertData = data;
            return chain;
          }),
          update: vi.fn((data) => {
            queryState.isUpdate = true;
            queryState.updateData = data;
            return chain;
          }),
          delete: vi.fn(() => {
            queryState.isDelete = true;
            return chain;
          }),
          eq: vi.fn((col, val) => {
            queryState.filters[col] = val;
            return chain;
          }),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === 'hostels') {
              if (simulateHostelNotFound) return Promise.resolve({ data: null, error: null });
              return Promise.resolve({ data: mockHostels[0], error: null });
            }
            if (table === 'bed_allocations') {
              return Promise.resolve({ data: mockAllocation, error: null });
            }
            if (table === 'mess_menus') {
              if (simulateEntryNotFound) return Promise.resolve({ data: null, error: null });
              return Promise.resolve({ data: mockMessMenu[0], error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          single: vi.fn().mockImplementation(() => {
            if (simulateDuplicateKey) {
              return Promise.resolve({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "unique_hostel_day_meal"',
                },
              });
            }
            if (queryState.isInsert) {
              const row = {
                id: 'b1234567-89ab-4cde-8f01-23456789abcd',
                ...queryState.insertData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                hostel: mockHostels[0],
              };
              return Promise.resolve({ data: row, error: null });
            }
            if (queryState.isUpdate) {
              const row = {
                ...mockMessMenu[0],
                ...queryState.updateData,
                updated_at: new Date().toISOString(),
                hostel: mockHostels[0],
              };
              return Promise.resolve({ data: row, error: null });
            }
            if (table === 'mess_menus') {
              if (simulateEntryNotFound) return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
              return Promise.resolve({ data: mockMessMenu[0], error: null });
            }
            return Promise.resolve({ data: mockHostels[0], error: null });
          }),
          then: vi.fn().mockImplementation((resolve) => {
            if (table === 'mess_menus') {
              return resolve({ data: mockMessMenu, error: null });
            }
            return resolve({ data: [], error: null });
          }),
        };

        return chain;
      }),
    },
  };
});

const app = express();
app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);

describe('Mess Menu API', () => {
  beforeEach(() => {
    simulateHostelNotFound = false;
    simulateDuplicateKey = false;
    simulateEntryNotFound = false;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/mess-menu');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows authenticated student to GET mess menu', async () => {
    const res = await request(app)
      .get(`/api/v1/mess-menu?hostel_id=${validHostelId}`)
      .set('x-test-role', 'student');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hostel).toBeDefined();
    expect(Array.isArray(res.body.data.menu)).toBe(true);
  });

  it('allows authenticated warden to GET mess menu', async () => {
    const res = await request(app)
      .get(`/api/v1/mess-menu?hostel_id=${validHostelId}`)
      .set('x-test-role', 'warden');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hostel).toBeDefined();
  });

  it('forbids student from POSTing a menu entry (403)', async () => {
    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'student')
      .send({
        hostel_id: validHostelId,
        day_of_week: 1,
        meal_type: 'lunch',
        menu_items: 'Rice, Dal, Paneer',
      });

    expect(res.status).toBe(403);
  });

  it('forbids student from PUTting a menu entry (403)', async () => {
    const res = await request(app)
      .put(`/api/v1/mess-menu/${validMenuId}`)
      .set('x-test-role', 'student')
      .send({
        menu_items: 'Updated items',
      });

    expect(res.status).toBe(403);
  });

  it('forbids student from DELETEing a menu entry (403)', async () => {
    const res = await request(app)
      .delete(`/api/v1/mess-menu/${validMenuId}`)
      .set('x-test-role', 'student');

    expect(res.status).toBe(403);
  });

  it('allows authorized warden to POST a valid menu entry (201)', async () => {
    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'warden')
      .send({
        hostel_id: validHostelId,
        day_of_week: 2,
        meal_type: 'lunch',
        menu_items: 'Rajma, Rice, Roti, Salad',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.menu_items).toBe('Rajma, Rice, Roti, Salad');
  });

  it('allows authorized warden to PUT an existing menu entry (200)', async () => {
    const res = await request(app)
      .put(`/api/v1/mess-menu/${validMenuId}`)
      .set('x-test-role', 'warden')
      .send({
        menu_items: 'Chole, Bhature, Pickle, Lassi',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows authorized warden to DELETE an existing menu entry (200)', async () => {
    const res = await request(app)
      .delete(`/api/v1/mess-menu/${validMenuId}`)
      .set('x-test-role', 'warden');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(validMenuId);
  });

  it('rejects invalid day_of_week (> 7 or < 1)', async () => {
    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'warden')
      .send({
        hostel_id: validHostelId,
        day_of_week: 8,
        meal_type: 'lunch',
        menu_items: 'Rice, Dal',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid meal_type (e.g. brunch or midnight_snack)', async () => {
    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'warden')
      .send({
        hostel_id: validHostelId,
        day_of_week: 3,
        meal_type: 'brunch',
        menu_items: 'Rice, Dal',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects empty or whitespace-only menu_items', async () => {
    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'warden')
      .send({
        hostel_id: validHostelId,
        day_of_week: 3,
        meal_type: 'lunch',
        menu_items: '    ',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 Conflict on duplicate hostel + day + meal', async () => {
    simulateDuplicateKey = true;

    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'warden')
      .send({
        hostel_id: validHostelId,
        day_of_week: 1,
        meal_type: 'breakfast',
        menu_items: 'Poha, Banana, Tea',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('returns 404 when hostel does not exist', async () => {
    simulateHostelNotFound = true;

    const res = await request(app)
      .post('/api/v1/mess-menu')
      .set('x-test-role', 'warden')
      .send({
        hostel_id: nonexistentHostelId,
        day_of_week: 1,
        meal_type: 'breakfast',
        menu_items: 'Idli, Sambar',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Hostel not found');
  });

  it('returns 404 when updating non-existent menu entry', async () => {
    simulateEntryNotFound = true;

    const res = await request(app)
      .put(`/api/v1/mess-menu/${nonexistentMenuId}`)
      .set('x-test-role', 'warden')
      .send({
        menu_items: 'Upma, Chutney',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Mess menu entry not found');
  });
});
