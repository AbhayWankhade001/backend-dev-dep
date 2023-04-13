import router from "./router/route.js";
import request from "supertest";
import { Admin } from "./model/User.model.js";

// Mock Admin model with a fake findOne method that returns a predefined admin object
jest.mock('./model/User.model.js', () => ({
  findOne: jest.fn().mockReturnValue({ email: 'admin@example.com', password: '$2b$10$MYFAKEPASSWORDHASH', _id: 'adminId' }),
}));

describe('POST /admin/login', () => {
  it('should return a 401 status code and error message if email is invalid', async () => {
    const response = await request(router)
      .post('/admin/login')
      .send({ email: 'invalidemail@example.com', password: 'password' });
    expect(response.status).toBe(401);
    expect(response.text).toBe('Invalid email or password.');
  },50000);

  it('should return a 401 status code and error message if password is invalid', async () => {
    const response = await request(router)
      .post('/admin/login')
      .send({ email: 'admin@example.com', password: 'invalidpassword' });
    expect(response.status).toBe(401);
    expect(response.text).toBe('Invalid email or password.');
  },50000);

  it('should return a JWT token and set it as a cookie if admin credentials are valid', async () => {
    const response = await request(router)
      .post('/admin/login')
      .send({ email: 'admin@example.com', password: 'mypassword' });
    expect(response.status).toBe(200);
    expect(response.header['set-cookie']).toBeDefined();
    expect(response.body).toBeDefined();
  },50000);

  it('should return a JWT token containing the email and admin ID if admin credentials are valid', async () => {
    const response = await request(router)
      .post('/admin/login')
      .send({ email: 'admin@example.com', password: 'mypassword' });
    const token = response.body;
    const decodedToken = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    expect(decodedToken.email).toBe('admin@example.com');
    expect(decodedToken.adminId).toBe('adminId');
  },50000);

  it('should set the cookie to be HTTP-only, secure, and same-site strict', async () => {
    const response = await request(router)
      .post('/admin/login')
      .send({ email: 'admin@example.com', password: 'mypassword' });
    const cookie = response.header['set-cookie'][0];
    expect(cookie.includes('HttpOnly')).toBe(true);
    expect(cookie.includes('Secure')).toBe(true);
    expect(cookie.includes('SameSite=Strict')).toBe(true);
  },50000);
});

  

      module.exports = {
        transform: {
          "^.+\\.js$": "babel-jest",
        },
        testTimeout: 50000, // 10 seconds
      };
      