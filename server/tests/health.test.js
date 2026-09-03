import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../src/app.js';

describe('GET /api/v1/health', () => {
  it('should return 200 and a success message', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('HMS API is running');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
  });
});
