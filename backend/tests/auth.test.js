const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Test user data
const testUser = {
  email: `test-${uuidv4()}@example.com`,
  password: 'Test@1234'
};

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    await db.getConnection();
  });

  afterAll(async () => {
    // Clean up test data
    const connection = await db.getConnection();
    await connection.query('DELETE FROM users WHERE email LIKE ?', ['test-%@example.com']);
    await connection.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Registration successful. Please check your email to verify your account.');
    });

    it('should not register with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: 'AnotherPassword123!'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should not login with unverified email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Please verify your email before logging in');
    });
  });
});
