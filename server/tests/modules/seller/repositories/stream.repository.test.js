/**
 * Stream Repository Tests
 *
 * This test suite covers all functionality of the stream repository
 * for seller-specific operations.
 *
 * @module streamRepositoryTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const streamRepository = require('@modules/seller/repositories/stream.repository');
const Stream = require('@models/Stream');
const Seller = require('@models/Seller');

let mongoServer;

describe('Stream Repository', () => {
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
    await Stream.deleteMany({});
  });

  const mockStreamData = {
    title: 'Test Stream',
    description: 'A test stream for testing purposes',
    seller: '507f1f77bcf86cd799439011',
    category: 'Electronics',
    status: 'scheduled',
    scheduledAt: new Date(),
    duration: 60,
    maxViewers: 100
  };

  describe('countStreamsBySeller', () => {
    it('should return correct count of streams for a seller', async () => {
      const stream = new Stream(mockStreamData);
      await stream.save();

      const result = await streamRepository.countStreamsBySeller(mockStreamData.seller);
      expect(result).toBe(1);
    });

    it('should return 0 when seller has no streams', async () => {
      const sellerWithNoStreams = '507f1f77bcf86cd799439012';
      const result = await streamRepository.countStreamsBySeller(sellerWithNoStreams);
      expect(result).toBe(0);
    });

    it('should count multiple streams for the same seller', async () => {
      const stream1 = new Stream(mockStreamData);
      const stream2 = new Stream({
        ...mockStreamData,
        title: 'Second Test Stream',
        description: 'Another test stream for testing purposes',
        status: 'live',
        duration: 45,
        maxViewers: 50
      });
      
      await stream1.save();
      await stream2.save();

      const result = await streamRepository.countStreamsBySeller(mockStreamData.seller);
      expect(result).toBe(2);
    });

    it('should not count streams from other sellers', async () => {
      const stream1 = new Stream(mockStreamData);
      const otherSellerStream = new Stream({
        ...mockStreamData,
        title: 'Other Seller Stream',
        description: 'A stream from another seller',
        seller: '507f1f77bcf86cd799439013',
        duration: 30,
        maxViewers: 25
      });
      
      await stream1.save();
      await otherSellerStream.save();

      const result = await streamRepository.countStreamsBySeller(mockStreamData.seller);
      expect(result).toBe(1); // Should still be 1 for the original seller
    });

    it('should count streams with different statuses', async () => {
      const stream1 = new Stream(mockStreamData);
      const endedStream = new Stream({
        ...mockStreamData,
        title: 'Ended Stream',
        description: 'An ended stream',
        status: 'ended',
        scheduledAt: new Date(Date.now() - 86400000), // Yesterday
        maxViewers: 75
      });
      const expiredStream = new Stream({
        ...mockStreamData,
        title: 'Expired Stream',
        description: 'An expired stream',
        status: 'expired',
        duration: 90,
        maxViewers: 200
      });
      
      await stream1.save();
      await endedStream.save();
      await expiredStream.save();

      const result = await streamRepository.countStreamsBySeller(mockStreamData.seller);
      expect(result).toBe(3); // Should count all streams regardless of status
    });
  });
});
