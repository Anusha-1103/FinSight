import request from 'supertest';
import app from '../src/server';

describe('Auth Endpoints Integration Tests', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('POST /api/v1/auth/login with invalid credentials should fail', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@finsight.ai', password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
