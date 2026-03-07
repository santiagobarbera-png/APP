'use strict';

const request = require('supertest');

// Mock the database pool before requiring the app
jest.mock('../backend/config/database', () => {
    const mockQuery = jest.fn();
    return { query: mockQuery, on: jest.fn() };
});

const pool = require('../backend/config/database');
const app = require('../backend/app');

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/api/auth/register').send({});
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when password is too short', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: 'short' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/8 characters/i);
    });

    test('returns 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'not-an-email', password: 'password123' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    test('returns 409 when email is already registered', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // existing user found
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already registered/i);
    });

    test('returns 201 with token and user on success', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] }) // no existing user
            .mockResolvedValueOnce({
                rows: [{ id: 1, name: 'Alice', email: 'alice@example.com', created_at: new Date() }],
            }); // insert returning

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    });

    test('returns 500 on unexpected database error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB connection error'));
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 400 when fields are missing', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(400);
    });

    test('returns 401 when user not found', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noone@example.com', password: 'password123' });
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });

    test('returns 401 when password is wrong', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('correctpassword', 12);
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1, name: 'Bob', email: 'bob@example.com', password_hash: hash, is_active: true }],
        });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'bob@example.com', password: 'wrongpassword' });
        expect(res.status).toBe(401);
    });

    test('returns 200 with token on valid credentials', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('password123', 12);
        pool.query
            .mockResolvedValueOnce({
                rows: [{ id: 1, name: 'Bob', email: 'bob@example.com', password_hash: hash, is_active: true }],
            })
            .mockResolvedValueOnce({ rows: [] }); // update last active

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'bob@example.com', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toMatchObject({ name: 'Bob' });
    });
});

describe('GET /health', () => {
    test('returns 200 with status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('GET /', () => {
    test('returns API info', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Dating App API');
    });
});

describe('404 handler', () => {
    test('returns 404 for unknown routes', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Route not found');
    });
});
