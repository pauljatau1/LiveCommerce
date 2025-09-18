/**
 * Get Orders Controller Tests
 *
 * This test suite covers all functionality of the getOrders controller including:
 * - Successful order retrieval with pagination
 * - Order filtering by status and date range
 * - Error handling for various scenarios
 * - Response formatting and structure
 */

const sellerController = require('@modules/seller/controllers/seller.controller');
const getOrdersService = require('@modules/seller/services/getOrders.service');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the service
jest.mock('@modules/seller/services/getOrders.service');

describe('Get Orders Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock request object
    req = {
      user: {
        id: '507f1f77bcf86cd799439011'
      },
      query: {}
    };

    // Mock response object
    res = {
      success: jest.fn()
    };

    // Mock next function
    next = jest.fn();
  });

  describe('getOrders', () => {
    it('should retrieve orders successfully with pagination', async () => {
      // Arrange: Mock service response
      const mockResponse = {
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            buyer: {
              _id: '507f1f77bcf86cd799439013',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com'
            },
            items: [
              {
                product: {
                  _id: '507f1f77bcf86cd799439014',
                  name: 'Test Product',
                  images: ['https://example.com/image.jpg'],
                  price: 100
                },
                quantity: 2,
                price: 100,
                status: 'confirmed'
              }
            ],
            totalAmount: 200,
            status: 'confirmed',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalOrders: 1,
          hasMore: false,
          hasPrevious: false
        }
      };

      getOrdersService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10,
        skip: 0
      });

      getOrdersService.getFilters.mockReturnValue({
        status: null,
        startDate: null,
        endDate: null
      });

      getOrdersService.getPaginatedOrders.mockResolvedValue(mockResponse);

      // Act: Call the controller
      await sellerController.getOrders(req, res, next);

      // Assert: Verify service methods were called correctly
      expect(getOrdersService.getPaginationOptions).toHaveBeenCalledWith(req);
      expect(getOrdersService.getFilters).toHaveBeenCalledWith(req);
      expect(getOrdersService.getPaginatedOrders).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          enabled: true,
          page: 1,
          limit: 10,
          skip: 0,
          filters: {
            status: null,
            startDate: null,
            endDate: null
          }
        }
      );

      // Assert: Verify success response was sent
      expect(res.success).toHaveBeenCalledWith(
        mockResponse,
        'Orders retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should retrieve orders without pagination when disabled', async () => {
      // Arrange: Mock service response for non-paginated
      const mockResponse = {
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            buyer: {
              _id: '507f1f77bcf86cd799439013',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com'
            },
            items: [
              {
                product: {
                  _id: '507f1f77bcf86cd799439014',
                  name: 'Test Product',
                  images: ['https://example.com/image.jpg'],
                  price: 100
                },
                quantity: 2,
                price: 100,
                status: 'confirmed'
              }
            ],
            totalAmount: 200,
            status: 'confirmed',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
          }
        ],
        pagination: {}
      };

      getOrdersService.getPaginationOptions.mockReturnValue({
        enabled: false,
        page: 1,
        limit: 10,
        skip: 0
      });

      getOrdersService.getFilters.mockReturnValue({
        status: null,
        startDate: null,
        endDate: null
      });

      getOrdersService.getOrders.mockResolvedValue(mockResponse);

      // Act: Call the controller
      await sellerController.getOrders(req, res, next);

      // Assert: Verify non-paginated service method was called
      expect(getOrdersService.getOrders).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          status: null,
          startDate: null,
          endDate: null
        }
      );

      // Assert: Verify success response was sent
      expect(res.success).toHaveBeenCalledWith(
        mockResponse,
        'Orders retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle ValidationError from service', async () => {
      // Arrange: Mock ValidationError from service
      const validationError = new ValidationError([
        { field: 'sellerId', message: 'Valid seller ID is required' }
      ]);

      getOrdersService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10,
        skip: 0
      });

      getOrdersService.getFilters.mockReturnValue({
        status: null,
        startDate: null,
        endDate: null
      });

      getOrdersService.getPaginatedOrders.mockRejectedValue(validationError);

      // Act: Call the controller
      await sellerController.getOrders(req, res, next);

      // Assert: Verify error was forwarded to next middleware
      expect(next).toHaveBeenCalledWith(validationError);
      expect(res.success).not.toHaveBeenCalled();
    });

    it('should handle NotFoundException from service', async () => {
      // Arrange: Mock NotFoundException from service
      const notFoundError = new NotFoundException('Seller not found');

      getOrdersService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10,
        skip: 0
      });

      getOrdersService.getFilters.mockReturnValue({
        status: null,
        startDate: null,
        endDate: null
      });

      getOrdersService.getPaginatedOrders.mockRejectedValue(notFoundError);

      // Act: Call the controller
      await sellerController.getOrders(req, res, next);

      // Assert: Verify error was forwarded to next middleware
      expect(next).toHaveBeenCalledWith(notFoundError);
      expect(res.success).not.toHaveBeenCalled();
    });

    it('should handle generic error from service', async () => {
      // Arrange: Mock generic error from service
      const genericError = new Error('Database connection failed');

      getOrdersService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10,
        skip: 0
      });

      getOrdersService.getFilters.mockReturnValue({
        status: null,
        startDate: null,
        endDate: null
      });

      getOrdersService.getPaginatedOrders.mockRejectedValue(genericError);

      // Act: Call the controller
      await sellerController.getOrders(req, res, next);

      // Assert: Verify error was forwarded to next middleware
      expect(next).toHaveBeenCalledWith(genericError);
      expect(res.success).not.toHaveBeenCalled();
    });

    it('should handle orders with filters', async () => {
      // Arrange: Mock request with filters
      req.query = {
        status: 'confirmed',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: '2',
        limit: '5'
      };

      const mockResponse = {
        data: [],
        pagination: {
          currentPage: 2,
          totalPages: 0,
          totalOrders: 0,
          hasMore: false,
          hasPrevious: true
        }
      };

      getOrdersService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 2,
        limit: 5,
        skip: 5
      });

      getOrdersService.getFilters.mockReturnValue({
        status: 'confirmed',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });

      getOrdersService.getPaginatedOrders.mockResolvedValue(mockResponse);

      // Act: Call the controller
      await sellerController.getOrders(req, res, next);

      // Assert: Verify service methods were called with correct parameters
      expect(getOrdersService.getPaginationOptions).toHaveBeenCalledWith(req);
      expect(getOrdersService.getFilters).toHaveBeenCalledWith(req);
      expect(getOrdersService.getPaginatedOrders).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          enabled: true,
          page: 2,
          limit: 5,
          skip: 5,
          filters: {
            status: 'confirmed',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          }
        }
      );

      // Assert: Verify success response was sent
      expect(res.success).toHaveBeenCalledWith(
        mockResponse,
        'Orders retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
