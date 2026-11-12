const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const postRepository = require('@modules/buyer/repositories/post.repository');
const Post = require('@models/Post');
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');

describe('Post Repository', () => {
  let mongoServer;

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
    await Post.deleteMany({});
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('getPostsCount', () => {
    let testBuyer;
    let testSeller;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await testBuyer.save();

      testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await testSeller.save();
    });

    it('should return 0 when no posts exist for buyer', async () => {
      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(0);
    });

    it('should return total count of all posts for buyer', async () => {
      // Create another buyer for testing
      const otherBuyer = new Buyer({
        firstName: 'Other',
        lastName: 'Buyer',
        email: 'other.buyer@example.com',
        username: 'otherbuyer',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await otherBuyer.save();

      await Post.create([
        { 
          title: 'Post 1', 
          body: 'Content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Post 2', 
          body: 'Content 2', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private'
        },
        { 
          title: 'Post 3', 
          body: 'Content 3', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'draft'
        },
        { 
          title: 'Post 4', 
          body: 'Content 4', 
          author: { 
            userId: otherBuyer._id, 
            userModel: 'Buyer',
            firstName: 'Other',
            lastName: 'Buyer'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(3);
    });

    it('should not count posts from other buyers', async () => {
      // Create another buyer for testing
      const otherBuyer = new Buyer({
        firstName: 'Other',
        lastName: 'Buyer',
        email: 'other.buyer@example.com',
        username: 'otherbuyer',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await otherBuyer.save();
      
      await Post.create([
        { 
          title: 'Post 1', 
          body: 'Content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Post 2', 
          body: 'Content 2', 
          author: { 
            userId: otherBuyer._id, 
            userModel: 'Buyer',
            firstName: 'Other',
            lastName: 'Buyer'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should not count posts from sellers', async () => {
      await Post.create([
        { 
          title: 'Post 1', 
          body: 'Content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Post 2', 
          body: 'Content 2', 
          author: { 
            userId: testSeller._id, 
            userModel: 'Seller',
            firstName: 'Jane',
            lastName: 'Smith',
            storeName: 'Test Store'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with different visibility levels', async () => {
      await Post.create([
        { 
          title: 'Public Post', 
          body: 'Public content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Private Post', 
          body: 'Private content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private'
        },
        { 
          title: 'Draft Post', 
          body: 'Draft content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'draft'
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(3);
    });

    it('should handle non-existent buyer ID', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId();
      const count = await postRepository.getPostsCount(nonExistentBuyerId);
      expect(count).toBe(0);
    });

    it('should handle invalid ObjectId format', async () => {
      await expect(postRepository.getPostsCount('invalid-id')).rejects.toThrow();
    });

    it('should handle null buyer ID', async () => {
      const result = await postRepository.getPostsCount(null);
      expect(result).toBe(0);
    });

    it('should handle undefined buyer ID', async () => {
      const result = await postRepository.getPostsCount(undefined);
      expect(result).toBe(0);
    });

    it('should handle empty string buyer ID', async () => {
      await expect(postRepository.getPostsCount('')).rejects.toThrow();
    });

    it('should handle posts with complex data structures', async () => {
      await Post.create([
        { 
          title: 'Post with Images', 
          body: 'Content with images', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          images: [
            { url: 'https://example.com/image1.jpg', public_id: 'img1' },
            { url: 'https://example.com/image2.jpg', public_id: 'img2' }
          ]
        },
        { 
          title: 'Post with Videos', 
          body: 'Content with videos', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          videos: [
            { url: 'https://example.com/video1.mp4', public_id: 'vid1' }
          ]
        },
        { 
          title: 'Post with Tags', 
          body: 'Content with tags', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          tags: ['technology', 'review', 'recommendation']
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(3);
    });

    it('should handle posts with reactions and comments', async () => {
      await Post.create([
        { 
          title: 'Post with Reactions', 
          body: 'Content with reactions', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reactions: [
            {
              type: 'like',
              emoji: '👍',
              user: {
                userId: testSeller._id,
                userModel: 'Seller',
                firstName: 'Jane',
                lastName: 'Smith',
                storeName: 'Test Store'
              }
            }
          ]
        },
        { 
          title: 'Post with Comments', 
          body: 'Content with comments', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          comments: [
            {
              content: 'Great post!',
              author: {
                userId: testSeller._id,
                userModel: 'Seller',
                firstName: 'Jane',
                lastName: 'Smith',
                storeName: 'Test Store'
              }
            }
          ]
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(2);
    });

    it('should handle posts with stats data', async () => {
      await Post.create([
        { 
          title: 'Post with Stats', 
          body: 'Content with stats', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          stats: {
            reactions: {
              like: 5,
              love: 3,
              haha: 1,
              wow: 2,
              sad: 0,
              angry: 0
            },
            viewCount: 100,
            shareCount: 10
          }
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with reports', async () => {
      await Post.create([
        { 
          title: 'Post with Reports', 
          body: 'Content with reports', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reports: [
            {
              reporter: {
                userId: testSeller._id,
                userModel: 'Seller',
                firstName: 'Jane',
                lastName: 'Smith'
              },
              reason: 'inappropriate_content',
              description: 'This post contains inappropriate content',
              status: 'pending'
            }
          ]
        }
      ]);

      const count = await postRepository.getPostsCount(testBuyer._id);
      expect(count).toBe(1);
    });
  });

  describe('countPublicPosts', () => {
    let testBuyer;
    let testSeller;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await testBuyer.save();

      testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await testSeller.save();
    });

    it('should return 0 when no public posts exist for buyer', async () => {
      await Post.create([
        { 
          title: 'Private Post 1', 
          body: 'Private content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private'
        },
        { 
          title: 'Draft Post 1', 
          body: 'Draft content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'draft'
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(0);
    });

    it('should return count of only public posts for buyer', async () => {
      // Create another buyer for testing
      const otherBuyer = new Buyer({
        firstName: 'Other',
        lastName: 'Buyer',
        email: 'other.buyer@example.com',
        username: 'otherbuyer',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await otherBuyer.save();

      await Post.create([
        { 
          title: 'Public Post 1', 
          body: 'Public content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Private Post 1', 
          body: 'Private content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private'
        },
        { 
          title: 'Public Post 2', 
          body: 'Public content 2', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Draft Post 1', 
          body: 'Draft content 1', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'draft'
        },
        { 
          title: 'Public Post from Other Buyer', 
          body: 'Public content from other buyer', 
          author: { 
            userId: otherBuyer._id, 
            userModel: 'Buyer',
            firstName: 'Other',
            lastName: 'Buyer'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(2);
    });

    it('should not count public posts from other buyers', async () => {
      // Create another buyer for testing
      const otherBuyer = new Buyer({
        firstName: 'Other',
        lastName: 'Buyer',
        email: 'other.buyer@example.com',
        username: 'otherbuyer',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await otherBuyer.save();
      
      await Post.create([
        { 
          title: 'Public Post from Test Buyer', 
          body: 'Public content from test buyer', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Public Post from Other Buyer', 
          body: 'Public content from other buyer', 
          author: { 
            userId: otherBuyer._id, 
            userModel: 'Buyer',
            firstName: 'Other',
            lastName: 'Buyer'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should not count public posts from sellers', async () => {
      await Post.create([
        { 
          title: 'Public Post from Buyer', 
          body: 'Public content from buyer', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Public Post from Seller', 
          body: 'Public content from seller', 
          author: { 
            userId: testSeller._id, 
            userModel: 'Seller',
            firstName: 'Jane',
            lastName: 'Smith',
            storeName: 'Test Store'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with missing visibility field (defaults to public)', async () => {
      await Post.create([
        { 
          title: 'Post without visibility', 
          body: 'Content without visibility', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle non-existent buyer ID', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId();
      const count = await postRepository.countPublicPosts(nonExistentBuyerId);
      expect(count).toBe(0);
    });

    it('should handle invalid ObjectId format', async () => {
      await expect(postRepository.countPublicPosts('invalid-id')).rejects.toThrow();
    });

    it('should handle null buyer ID', async () => {
      const result = await postRepository.countPublicPosts(null);
      expect(result).toBe(0);
    });

    it('should handle undefined buyer ID', async () => {
      const result = await postRepository.countPublicPosts(undefined);
      expect(result).toBe(0);
    });

    it('should handle empty string buyer ID', async () => {
      await expect(postRepository.countPublicPosts('')).rejects.toThrow();
    });

    it('should handle posts with complex data structures', async () => {
      await Post.create([
        { 
          title: 'Public Post with Images', 
          body: 'Public content with images', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          images: [
            { url: 'https://example.com/image1.jpg', public_id: 'img1' }
          ]
        },
        { 
          title: 'Private Post with Videos', 
          body: 'Private content with videos', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private',
          videos: [
            { url: 'https://example.com/video1.mp4', public_id: 'vid1' }
          ]
        },
        { 
          title: 'Public Post with Tags', 
          body: 'Public content with tags', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          tags: ['technology', 'review']
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(2);
    });

    it('should handle posts with reactions and comments', async () => {
      await Post.create([
        { 
          title: 'Public Post with Reactions', 
          body: 'Public content with reactions', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reactions: [
            {
              type: 'like',
              emoji: '👍',
              user: {
                userId: testSeller._id,
                userModel: 'Seller',
                firstName: 'Jane',
                lastName: 'Smith',
                storeName: 'Test Store'
              }
            }
          ]
        },
        { 
          title: 'Private Post with Comments', 
          body: 'Private content with comments', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private',
          comments: [
            {
              content: 'Great post!',
              author: {
                userId: testSeller._id,
                userModel: 'Seller',
                firstName: 'Jane',
                lastName: 'Smith',
                storeName: 'Test Store'
              }
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with stats data', async () => {
      await Post.create([
        { 
          title: 'Public Post with Stats', 
          body: 'Public content with stats', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          stats: {
            reactions: {
              like: 5,
              love: 3,
              haha: 1,
              wow: 2,
              sad: 0,
              angry: 0
            },
            viewCount: 100,
            shareCount: 10
          }
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with reports', async () => {
      await Post.create([
        { 
          title: 'Public Post with Reports', 
          body: 'Public content with reports', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reports: [
            {
              reporter: {
                userId: testSeller._id,
                userModel: 'Seller',
                firstName: 'Jane',
                lastName: 'Smith'
              },
              reason: 'inappropriate_content',
              description: 'This post contains inappropriate content',
              status: 'pending'
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with tagged sellers', async () => {
      await Post.create([
        { 
          title: 'Public Post with Tags', 
          body: 'Public content with tags', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          taggedSellers: [
            {
              sellerId: testSeller._id,
              taggedAt: new Date()
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with different creation dates', async () => {
      const oldDate = new Date('2023-01-01');
      const recentDate = new Date();
      
      await Post.create([
        { 
          title: 'Old Public Post', 
          body: 'Old public content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          createdAt: oldDate
        },
        { 
          title: 'Recent Public Post', 
          body: 'Recent public content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          createdAt: recentDate
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(2);
    });

    it('should handle posts with updated timestamps', async () => {
      await Post.create([
        { 
          title: 'Public Post with Updates', 
          body: 'Public content with updates', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          updatedAt: new Date()
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let testBuyer;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await testBuyer.save();
    });

    it('should handle very large number of posts', async () => {
      const posts = [];
      for (let i = 0; i < 100; i++) {
        posts.push({
          title: `Post ${i}`,
          body: `Content ${i}`,
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: i % 3 === 0 ? 'public' : i % 3 === 1 ? 'private' : 'draft'
        });
      }
      
      await Post.create(posts);

      const totalCount = await postRepository.getPostsCount(testBuyer._id);
      const publicCount = await postRepository.countPublicPosts(testBuyer._id);
      
      expect(totalCount).toBe(100);
      expect(publicCount).toBe(34); // Every 3rd post is public (0, 3, 6, ..., 99)
    });

    it('should handle posts with all reaction types', async () => {
      await Post.create([
        { 
          title: 'Post with All Reactions', 
          body: 'Content with all reaction types', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reactions: [
            { type: 'like', emoji: '👍', user: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' } },
            { type: 'love', emoji: '❤️', user: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' } },
            { type: 'haha', emoji: '😂', user: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' } },
            { type: 'wow', emoji: '😮', user: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' } },
            { type: 'sad', emoji: '😢', user: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' } },
            { type: 'angry', emoji: '😠', user: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' } }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with all report reasons', async () => {
      const reportReasons = [
        'inappropriate_content',
        'spam',
        'harassment',
        'hate_speech',
        'misinformation',
        'copyright_violation',
        'other'
      ];

      await Post.create([
        { 
          title: 'Post with All Report Reasons', 
          body: 'Content with all report reasons', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reports: reportReasons.map(reason => ({
            reporter: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
            reason,
            description: `Report for ${reason}`,
            status: 'pending'
          }))
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with nested comments and replies', async () => {
      await Post.create([
        { 
          title: 'Post with Nested Comments', 
          body: 'Content with nested comments', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          comments: [
            {
              content: 'Main comment',
              author: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
              replies: [
                {
                  content: 'Reply to main comment',
                  author: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' }
                }
              ]
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with tagged products and sellers in comments', async () => {
      await Post.create([
        { 
          title: 'Post with Tagged Items in Comments', 
          body: 'Content with tagged items in comments', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          comments: [
            {
              content: 'Comment with tagged items',
              author: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
              taggedSellers: [
                { sellerId: new mongoose.Types.ObjectId(), storeName: 'Test Store', taggedAt: new Date() }
              ],
              taggedProducts: [
                { productId: new mongoose.Types.ObjectId(), name: 'Test Product', taggedAt: new Date() }
              ]
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with different author user models', async () => {
      const seller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await seller.save();

      await Post.create([
        { 
          title: 'Post from Buyer', 
          body: 'Content from buyer', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Post from Seller', 
          body: 'Content from seller', 
          author: { 
            userId: seller._id, 
            userModel: 'Seller',
            firstName: 'Jane',
            lastName: 'Smith',
            storeName: 'Test Store'
          },
          visibility: 'public'
        }
      ]);

      const buyerCount = await postRepository.countPublicPosts(testBuyer._id);
      const sellerCount = await postRepository.countPublicPosts(seller._id);
      
      expect(buyerCount).toBe(1);
      expect(sellerCount).toBe(0); // Seller posts should not be counted for buyer
    });

    it('should handle posts with different report statuses', async () => {
      await Post.create([
        { 
          title: 'Post with Different Report Statuses', 
          body: 'Content with different report statuses', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          reports: [
            {
              reporter: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
              reason: 'inappropriate_content',
              description: 'Pending report',
              status: 'pending'
            },
            {
              reporter: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
              reason: 'spam',
              description: 'Reviewed report',
              status: 'reviewed'
            },
            {
              reporter: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
              reason: 'harassment',
              description: 'Resolved report',
              status: 'resolved'
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with different comment like structures', async () => {
      await Post.create([
        { 
          title: 'Post with Comment Likes', 
          body: 'Content with comment likes', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public',
          comments: [
            {
              content: 'Comment with likes',
              author: { userId: testBuyer._id, userModel: 'Buyer', firstName: 'John', lastName: 'Doe' },
              likes: [
                { userId: testBuyer._id, userModel: 'Buyer', createdAt: new Date() }
              ]
            }
          ]
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1);
    });

    it('should handle posts with different visibility enum values', async () => {
      await Post.create([
        { 
          title: 'Public Post', 
          body: 'Public content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Private Post', 
          body: 'Private content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'private'
        },
        { 
          title: 'Draft Post', 
          body: 'Draft content', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'draft'
        }
      ]);

      const totalCount = await postRepository.getPostsCount(testBuyer._id);
      const publicCount = await postRepository.countPublicPosts(testBuyer._id);
      
      expect(totalCount).toBe(3);
      expect(publicCount).toBe(1);
    });

    it('should handle posts with different author user model enum values', async () => {
      // Create a seller for testing
      const seller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await seller.save();

      await Post.create([
        { 
          title: 'Post with Buyer Author', 
          body: 'Content with buyer author', 
          author: { 
            userId: testBuyer._id, 
            userModel: 'Buyer',
            firstName: 'John',
            lastName: 'Doe'
          },
          visibility: 'public'
        },
        { 
          title: 'Post with Seller Author', 
          body: 'Content with seller author', 
          author: { 
            userId: seller._id, 
            userModel: 'Seller',
            firstName: 'Jane',
            lastName: 'Smith',
            storeName: 'Test Store'
          },
          visibility: 'public'
        }
      ]);

      const count = await postRepository.countPublicPosts(testBuyer._id);
      expect(count).toBe(1); // Only the one with userModel: 'Buyer' should be counted
    });
  });
});
