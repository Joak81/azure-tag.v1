import request from 'supertest';
import express from 'express';
import authController from '../authController';

// Mock fetch globally
global.fetch = jest.fn();

const app = express();
app.use(express.json());
app.use('/auth', authController);

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('GET /auth/user', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app).get('/auth/user');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access token required');
    });

    it('should return 401 when authorization header is invalid', async () => {
      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', 'InvalidToken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access token required');
    });

    it('should return user info when valid token is provided', async () => {
      const mockUserProfile = {
        id: '123',
        displayName: 'John Doe',
        mail: 'john@example.com',
        userPrincipalName: 'john@example.com',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserProfile),
      } as Response);

      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('123');
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('john@example.com');
    });

    it('should return 401 when Microsoft Graph API returns error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid token');
    });

    it('should return 500 when Microsoft Graph API call fails', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      );

      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Failed to validate token');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return success message', async () => {
      const response = await request(app).post('/auth/refresh');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refresh would be handled here');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success message', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});