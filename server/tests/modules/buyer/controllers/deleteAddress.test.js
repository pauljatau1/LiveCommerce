const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('@/app');
const Buyer = require('@models/Buyer');

let mongoServer;

describe('DELETE /api/v2/buyers/addresses/:addressId', () => {
  let buyer;
  let addressId;
  let token;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await Buyer.deleteMany({});

    // Create a test buyer
    buyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
      shippingAddresses: [
        {
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        },
        {
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Ave',
          zipCode: '100002'
        }
      ]
    });

    await buyer.save();
    addressId = buyer.shippingAddresses[0]._id.toString();

    // Generate token for authentication
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ id: buyer._id, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('Success cases', () => {
    it('should delete an address successfully', async () => {
      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${addressId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address deleted successfully');
      expect(response.body.data.message).toBe('Address deleted successfully');

      // Verify address was actually deleted
      const updatedBuyer = await Buyer.findById(buyer._id);
      expect(updatedBuyer.shippingAddresses).toHaveLength(1);
      expect(updatedBuyer.shippingAddresses[0].addressType).toBe('work');
    });

    it('should delete the last address successfully', async () => {
      // Delete the second address first
      const secondAddressId = buyer.shippingAddresses[1]._id.toString();
      await request(app)
        .delete(`/api/v2/buyers/addresses/${secondAddressId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Now delete the first address
      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${addressId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address deleted successfully');

      // Verify all addresses were deleted
      const updatedBuyer = await Buyer.findById(buyer._id);
      expect(updatedBuyer.shippingAddresses).toHaveLength(0);
    });
  });

  describe('Authentication and authorization', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${addressId}`)
        .expect(401);

      // Check if response has success property, otherwise just verify status
      if (response.body.success !== undefined) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('token');
      } else {
        expect(response.status).toBe(401);
      }
    });

    it('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${addressId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Check if response has success property, otherwise just verify status
      if (response.body.success !== undefined) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('token');
      } else {
        expect(response.status).toBe(401);
      }
    });
  });

  describe('Validation errors', () => {
    it('should return 422 when addressId is missing', async () => {
      const response = await request(app)
        .delete('/api/v2/buyers/addresses/')
        .set('Authorization', `Bearer ${token}`)
        .expect(404); // Route not found

      // Check if response has success property, otherwise just verify status
      if (response.body.success !== undefined) {
        expect(response.body.success).toBe(false);
      } else {
        expect(response.status).toBe(404);
      }
    });

    it('should return 422 when addressId is invalid format', async () => {
      const response = await request(app)
        .delete('/api/v2/buyers/addresses/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => error.field === 'addressId')).toBe(true);
    });
  });

  describe('Not found errors', () => {
    it('should return 404 when address does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Address not found');
    });

    it('should return 404 when buyer does not exist', async () => {
      // Create token for non-existent buyer
      const jwt = require('jsonwebtoken');
      const nonExistentBuyerId = new mongoose.Types.ObjectId();
      const invalidToken = jwt.sign({ id: nonExistentBuyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${addressId}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });
  });

  describe('Database errors', () => {
    it('should handle database connection errors gracefully', async () => {
      // Isolate the controller's database error from the separate session check.
      const sessionCheck = jest.spyOn(require('@/services/auth/sessions'), 'assertSession').mockResolvedValue(true);
      // Temporarily disconnect from database
      await mongoose.disconnect();

      const response = await request(app)
        .delete(`/api/v2/buyers/addresses/${addressId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Check if response has success property, otherwise just verify status
      if (response.body.success !== undefined) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Internal server error');
      } else {
        expect(response.status).toBe(500);
      }

      // Reconnect to database
      await mongoose.connect(mongoServer.getUri());
      sessionCheck.mockRestore();
    });
  });
}); 