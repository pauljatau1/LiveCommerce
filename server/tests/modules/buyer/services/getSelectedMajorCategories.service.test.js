const { getSelectedMajorCategories } = require('@modules/buyer/services/getSelectedMajorCategories.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const majorCategoryRepository = require('@modules/buyer/repositories/majorCategory.repository');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

// Mock the major category repository
jest.mock('@modules/buyer/repositories/majorCategory.repository');

describe('getSelectedMajorCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return selected major categories when buyer has selected categories', async () => {
    // Mock buyer data
    const mockBuyer = {
      _id: 'buyer123',
      selectedCategories: [
        { _id: 'cat1', name: 'Electronics' },
        { _id: 'cat2', name: 'Computers' },
        { _id: 'cat3', name: 'Clothing' },
        { _id: 'cat4', name: 'Shoes' }
      ]
    };

    // Mock major categories data
    const mockMajorCategories = [
      {
        _id: 'major1',
        name: 'Electronics',
        image: 'electronics.jpg',
        categories: [
          { _id: 'cat1', name: 'Electronics' },
          { _id: 'cat2', name: 'Computers' }
        ]
      },
      {
        _id: 'major2',
        name: 'Fashion',
        image: 'fashion.jpg',
        categories: [
          { _id: 'cat3', name: 'Clothing' },
          { _id: 'cat4', name: 'Shoes' }
        ]
      },
      {
        _id: 'major3',
        name: 'Sports',
        image: 'sports.jpg',
        categories: [
          { _id: 'cat5', name: 'Football' },
          { _id: 'cat6', name: 'Basketball' }
        ]
      }
    ];

    // Mock repository methods
    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(mockBuyer);
    buyerRepository.extractSelectedCategoryNames.mockReturnValue(['Electronics', 'Computers', 'Clothing', 'Shoes']);
    majorCategoryRepository.findAllActiveMajorCategories.mockResolvedValue(mockMajorCategories);

    const result = await getSelectedMajorCategories('buyer123');

    expect(buyerRepository.findByIdWithSelectedCategories).toHaveBeenCalledWith('buyer123');
    expect(buyerRepository.extractSelectedCategoryNames).toHaveBeenCalledWith(mockBuyer);
    expect(majorCategoryRepository.findAllActiveMajorCategories).toHaveBeenCalled();

    expect(result).toEqual({
      selectedMajorCategories: [
        {
          _id: 'major1',
          name: 'Electronics',
          image: 'electronics.jpg',
          categoryCount: 2,
          categories: [
            { _id: 'cat1', name: 'Electronics' },
            { _id: 'cat2', name: 'Computers' }
          ]
        },
        {
          _id: 'major2',
          name: 'Fashion',
          image: 'fashion.jpg',
          categoryCount: 2,
          categories: [
            { _id: 'cat3', name: 'Clothing' },
            { _id: 'cat4', name: 'Shoes' }
          ]
        }
      ]
    });
  });

  it('should return empty array when buyer has no selected categories', async () => {
    const mockBuyer = {
      _id: 'buyer123',
      selectedCategories: []
    };

    const mockMajorCategories = [
      {
        _id: 'major1',
        name: 'Electronics',
        image: 'electronics.jpg',
        categories: [
          { _id: 'cat1', name: 'Electronics' },
          { _id: 'cat2', name: 'Computers' }
        ]
      }
    ];

    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(mockBuyer);
    buyerRepository.extractSelectedCategoryNames.mockReturnValue([]);
    majorCategoryRepository.findAllActiveMajorCategories.mockResolvedValue(mockMajorCategories);

    const result = await getSelectedMajorCategories('buyer123');

    expect(result).toEqual({
      selectedMajorCategories: []
    });
  });

  it('should return empty array when buyer has partial category selections', async () => {
    const mockBuyer = {
      _id: 'buyer123',
      selectedCategories: [
        { _id: 'cat1', name: 'Electronics' }
      ]
    };

    const mockMajorCategories = [
      {
        _id: 'major1',
        name: 'Electronics',
        image: 'electronics.jpg',
        categories: [
          { _id: 'cat1', name: 'Electronics' },
          { _id: 'cat2', name: 'Computers' }
        ]
      }
    ];

    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(mockBuyer);
    buyerRepository.extractSelectedCategoryNames.mockReturnValue(['Electronics']);
    majorCategoryRepository.findAllActiveMajorCategories.mockResolvedValue(mockMajorCategories);

    const result = await getSelectedMajorCategories('buyer123');

    expect(result).toEqual({
      selectedMajorCategories: []
    });
  });

  it('should handle multiple major categories correctly', async () => {
    const mockBuyer = {
      _id: 'buyer123',
      selectedCategories: [
        { _id: 'cat1', name: 'Electronics' },
        { _id: 'cat2', name: 'Computers' },
        { _id: 'cat3', name: 'Clothing' },
        { _id: 'cat4', name: 'Shoes' },
        { _id: 'cat5', name: 'Football' },
        { _id: 'cat6', name: 'Basketball' }
      ]
    };

    const mockMajorCategories = [
      {
        _id: 'major1',
        name: 'Electronics',
        image: 'electronics.jpg',
        categories: [
          { _id: 'cat1', name: 'Electronics' },
          { _id: 'cat2', name: 'Computers' }
        ]
      },
      {
        _id: 'major2',
        name: 'Fashion',
        image: 'fashion.jpg',
        categories: [
          { _id: 'cat3', name: 'Clothing' },
          { _id: 'cat4', name: 'Shoes' }
        ]
      },
      {
        _id: 'major3',
        name: 'Sports',
        image: 'sports.jpg',
        categories: [
          { _id: 'cat5', name: 'Football' },
          { _id: 'cat6', name: 'Basketball' }
        ]
      }
    ];

    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(mockBuyer);
    buyerRepository.extractSelectedCategoryNames.mockReturnValue(['Electronics', 'Computers', 'Clothing', 'Shoes', 'Football', 'Basketball']);
    majorCategoryRepository.findAllActiveMajorCategories.mockResolvedValue(mockMajorCategories);

    const result = await getSelectedMajorCategories('buyer123');

    expect(result.selectedMajorCategories).toHaveLength(3);
    const majorCategoryNames = result.selectedMajorCategories.map(mc => mc.name);
    expect(majorCategoryNames).toContain('Electronics');
    expect(majorCategoryNames).toContain('Fashion');
    expect(majorCategoryNames).toContain('Sports');
  });

  it('should filter out inactive major categories', async () => {
    const mockBuyer = {
      _id: 'buyer123',
      selectedCategories: [
        { _id: 'cat1', name: 'Electronics' },
        { _id: 'cat2', name: 'Computers' }
      ]
    };

    const mockMajorCategories = [
      {
        _id: 'major1',
        name: 'Electronics',
        image: 'electronics.jpg',
        categories: [
          { _id: 'cat1', name: 'Electronics' },
          { _id: 'cat2', name: 'Computers' }
        ]
      }
    ];

    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(mockBuyer);
    buyerRepository.extractSelectedCategoryNames.mockReturnValue(['Electronics', 'Computers']);
    majorCategoryRepository.findAllActiveMajorCategories.mockResolvedValue(mockMajorCategories);

    const result = await getSelectedMajorCategories('buyer123');

    expect(result.selectedMajorCategories).toHaveLength(1);
    expect(result.selectedMajorCategories[0].name).toBe('Electronics');
  });

  it('should throw NotFoundException when buyer is not found', async () => {
    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(null);

    await expect(getSelectedMajorCategories('nonexistent')).rejects.toThrow(NotFoundException);
    await expect(getSelectedMajorCategories('nonexistent')).rejects.toThrow('Buyer not found');
  });

  it('should handle major categories with no associated categories', async () => {
    const mockBuyer = {
      _id: 'buyer123',
      selectedCategories: []
    };

    const mockMajorCategories = [
      {
        _id: 'major1',
        name: 'Empty Category',
        image: 'empty.jpg',
        categories: []
      }
    ];

    buyerRepository.findByIdWithSelectedCategories.mockResolvedValue(mockBuyer);
    buyerRepository.extractSelectedCategoryNames.mockReturnValue([]);
    majorCategoryRepository.findAllActiveMajorCategories.mockResolvedValue(mockMajorCategories);

    const result = await getSelectedMajorCategories('buyer123');

    expect(result.selectedMajorCategories).toHaveLength(1);
    expect(result.selectedMajorCategories[0].categoryCount).toBe(0);
  });
});
