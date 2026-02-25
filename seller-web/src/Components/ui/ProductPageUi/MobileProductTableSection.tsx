import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, DatePicker, ConfigProvider, Checkbox } from 'antd';
import type { Dayjs } from 'dayjs';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSellerProducts, toggleVacationMode, searchSellerProducts, bulkDeleteProducts, bulkSetProductsDraft } from '@/Redux/Slices/ProductSlice';
import { Skeleton } from '@/Components/shared/Skeleton';
import { Icon } from '@iconify/react';
import eyeBoldIcon from '@iconify-icons/solar/eye-bold';
import penBoldIcon from '@iconify-icons/solar/pen-bold';
import trashBinTrashBoldIcon from '@iconify-icons/solar/trash-bin-trash-bold';
import ProductEmptyState from './ProductEmptyState';
import FilterIcon from '@/assets/icons/FilterIcon';
import GlassImage from '@/Components/ui/GlassImageV2';
import PlusIcon from '@/assets/icons/PlusIcon2';
import {
  Drawer,
  DrawerContent,
} from '@/Components/ui/drawer';
import { mapSortTypeToAPI, getWeekRange, getMonthRange, getYearRange, formatLastUpdatedDate } from '@/util/helpers';
import type { ProductApiModel } from '@/types/products';
import StockIcon from '@/assets/icons/StockIcon';
import BlipIcon from '@/assets/icons/BlipIcon';
import NairaIcon from '@/assets/icons/NairaIcon';
import DeleteProductsConfirmDialog from '@/Components/ProductPage/DeleteProductsConfirmDialog';
import ProductDetailsModal from '@/Components/ProductPage/ProductDetailsModal';



// Brand color theme for Ant Design components
const brandTheme = {
  token: {
    colorPrimary: '#0BB248',
    colorLink: '#0BB248',
    colorLinkHover: '#0a9a3d',
    borderRadius: 8,
  },
  components: {
    Switch: {
      colorPrimary: '#0BB248',
      colorPrimaryHover: '#0a9a3d',
    },
    DatePicker: {
      colorPrimary: '#0BB248',
      activeBorderColor: '#0BB248',
      hoverBorderColor: '#0BB248',
    },
  },
};


export default function MobileProductTableSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, isLoading, vacationMode, vacationRequestPending, pagination } = useSelector((state: any) => state.product);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('active');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [blipsFilter, setBlipsFilter] = useState<'all' | '0' | '1' | '4+'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under-5k' | '5k-20k' | '20k-plus'>('all');
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [quickDateFilter, setQuickDateFilter] = useState<'week' | 'month' | 'year' | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortType] = useState('newest-to-oldest');

  // Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogProducts, setDeleteDialogProducts] = useState<ProductApiModel[]>([]);
  const [productDetailsModalOpen, setProductDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductApiModel | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, stockFilter, blipsFilter, priceFilter, dateRange, sortType]);

  // Fetch products when filters or pagination changes
  useEffect(() => {
    if (!isSearchMode) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, statusFilter, priceFilter, dateRange, sortType, stockFilter, blipsFilter, isSearchMode]);

  // Update dateRange when fromDate or toDate changes
  useEffect(() => {
    if (fromDate && toDate) {
      setDateRange({
        startDate: fromDate.toISOString(),
        endDate: toDate.toISOString(),
      });
      setQuickDateFilter(null);
    } else if (!fromDate && !toDate) {
      setDateRange({ startDate: null, endDate: null });
    }
  }, [fromDate, toDate]);

  const fetchProducts = () => {
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
      sortBy: mapSortTypeToAPI(sortType),
    };

    // Add status filter
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    // Add stock filter (server-side)
    if (stockFilter === 'out-of-stock') {
      params.status = 'out_of_stock';
    }

    // Add price filters
    if (priceFilter === 'under-5k') {
      params.maxPrice = 5000;
    } else if (priceFilter === '5k-20k') {
      params.minPrice = 5000;
      params.maxPrice = 20000;
    } else if (priceFilter === '20k-plus') {
      params.minPrice = 20000;
    }

    // Add date range filters
    if (dateRange.startDate && dateRange.endDate) {
      params.startDate = dateRange.startDate;
      params.endDate = dateRange.endDate;
    }

    dispatch(fetchSellerProducts(params) as any);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchMode(true);
      setCurrentPage(1);

      const params: any = {
        page: 1,
        limit: itemsPerPage,
        sortBy: mapSortTypeToAPI(sortType),
        search: searchQuery.trim(),
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (stockFilter === 'out-of-stock') {
        params.status = 'out_of_stock';
      }

      dispatch(searchSellerProducts(params) as any);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setCurrentPage(1);
    fetchProducts();
  };

  // Handle vacation mode toggle
  const handleVacationModeToggle = async (checked: boolean) => {
    try {
      // @ts-ignore - Redux thunk typing issue
      await dispatch(toggleVacationMode(checked));
      handleRefresh();
    } catch (error) {
      console.error('Error toggling vacation mode:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (isSearchMode) {
      handleSearch(new Event('submit') as any);
    } else {
      fetchProducts();
    }
  };

  // Handle quick date filter
  const handleQuickDateFilter = (filter: 'week' | 'month' | 'year') => {
    setQuickDateFilter(filter);
    let range;
    if (filter === 'week') {
      range = getWeekRange();
    } else if (filter === 'month') {
      range = getMonthRange();
    } else {
      range = getYearRange();
    }
    setFromDate(range.start);
    setToDate(range.end);
    setDateRange({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    });
    setCurrentPage(1);
  };

  // Reset date filter
  const handleResetDate = () => {
    setFromDate(null);
    setToDate(null);
    setQuickDateFilter(null);
    setDateRange({ startDate: null, endDate: null });
    setCurrentPage(1);
  };

  // Filter products by stock (in-stock only) and blips (client-side filtering)
  const filteredProducts = useMemo(() => {
    let filtered = [...(products || [])];

    // Stock filter (in-stock filtered client-side, out-of-stock filtered server-side)
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter((p: any) => p.stock > 0);
    }

    // Blips filter
    if (blipsFilter === '0') {
      filtered = filtered.filter((p: any) => !p.blips || p.blips.length === 0);
    } else if (blipsFilter === '1') {
      filtered = filtered.filter((p: any) => p.blips && p.blips.length === 1);
    } else if (blipsFilter === '4+') {
      filtered = filtered.filter((p: any) => p.blips && p.blips.length >= 4);
    }

    return filtered;
  }, [products, stockFilter, blipsFilter]);

  // Toggle card expansion
  const toggleCard = (productId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRowKeys([]);
    }
  };

  // Handle product selection
  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys([...selectedRowKeys, productId]);
    } else {
      setSelectedRowKeys(selectedRowKeys.filter(id => id !== productId));
    }
  };


  return (
    <ConfigProvider theme={brandTheme}>
      <div className="w-full space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Products"
              className="w-full h-[38px] pl-3 pr-10 py-2 text-sm border-[1.5px] border-[#16783A52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent placeholder:text-[#425466] placeholder:text-xs placeholder:font-lexend placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => {
                if (isSearchMode) {
                  handleClearSearch();
                } else {
                  handleSearch(new Event('submit') as any);
                }
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-[26px] h-[26px] flex items-center justify-center bg-[#0BB248] text-white rounded-lg p-2 hover:bg-[#0BB248]/90 transition-colors"
            >
              {isSearchMode ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Search className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </form>

        {/* Filter Products Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full h-[38px] px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-200 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">Filter Products</span>
          <FilterIcon width={16} height={16} color="#737375" />
        </button>

        {/* Vacation Mode Section */}
        <div className="px-4 py-3 bg-white rounded-lg border border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#344054]">VACATION MODE</h3>
            <p className="text-xs font-lexend text-[#272D30]">Temporary Close Your Store</p>
          </div>
          {vacationRequestPending ? (
            <div className="w-11 h-6 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-[#0BB248] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Switch
              checked={vacationMode}
              onChange={handleVacationModeToggle}
              className="data-[state=checked]:bg-[#0BB248]"
            />
          )}
        </div>

        {/* Product List Section */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          {/* Status Tabs */}
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2 p-[4px] rounded-lg bg-[#E4ECF7]">
              <button
                onClick={() => {
                  setStatusFilter('active');
                  setCurrentPage(1);
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#FFFFFF]/80'
                    : 'bg-transparent text-[#0BB248]'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setStatusFilter('draft');
                  setCurrentPage(1);
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-[#FFFFFF] text-[#FCD116] hover:bg-[#FFFFFF]/80'
                    : 'bg-transparent text-[#FCD116]'
                }`}
              >
                Drafts
              </button>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] space-y-3">
            <div className="flex items-center gap-2">
              <DatePicker
                placeholder="From"
                value={fromDate}
                onChange={(date) => setFromDate(date)}
                format="DD-MM-YYYY"
                className="flex-1"
                size="small"
              />
              <DatePicker
                placeholder="To"
                value={toDate}
                onChange={(date) => setToDate(date)}
                format="DD-MM-YYYY"
                className="flex-1"
                size="small"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickDateFilter('week')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  quickDateFilter === 'week'
                    ? 'bg-[#0BB248] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleQuickDateFilter('month')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  quickDateFilter === 'month'
                    ? 'bg-[#0BB248] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handleQuickDateFilter('year')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  quickDateFilter === 'year'
                    ? 'bg-[#0BB248] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Year
              </button>
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={handleResetDate}
                className="text-xs text-[#0BB248] font-medium hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Selection Mode Header */}
          {isSelectionMode && (
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectionMode}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedRowKeys.length === 0) return;
                    const selectedProducts = (products as ProductApiModel[]).filter((p) =>
                      selectedRowKeys.includes(p._id)
                    );
                    if (!selectedProducts.length) return;
                    setDeleteDialogProducts(selectedProducts);
                    setDeleteDialogOpen(true);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    selectedRowKeys.length > 0
                      ? 'bg-[#0BB248] text-white hover:bg-[#0BB248]/90'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  Delete {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
                </button>
                <button
                  onClick={() => {
                    if (selectedRowKeys.length === 0) return;
                    if (statusFilter === 'active') {
                      dispatch(bulkSetProductsDraft(selectedRowKeys as any) as any);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${
                    selectedRowKeys.length > 0
                      ? 'border-[#0BB248] text-[#0BB248] bg-white hover:bg-[#0BB24817]'
                      : 'border-gray-300 text-gray-500 bg-gray-50'
                  }`}
                >
                  {statusFilter === 'active' ? 'Set as Draft' : 'Activate'} {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
                </button>
              </div>
            </div>
          )}

          {/* Select All Checkbox (when not in selection mode) */}
          {!isSelectionMode && (
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <button
                onClick={toggleSelectionMode}
                className="flex items-center text-xs font-lexend font-medium text-gray-700"
              >
                <Icon icon="bx:checkbox" width={18} height={18} color="#374151" />
                <span>SELECT ITEMS</span>
              </button>
            </div>
          )}

          {/* Products List */}
          <div className="px-4 py-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border border-[#E5E7EB] rounded-lg space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <ProductEmptyState />
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product: ProductApiModel) => {
                  const isExpanded = expandedCards.has(product._id);
                  const isSelected = selectedRowKeys.includes(product._id);
                  const blipsCount = product.blips?.length || 0;
                  const unitsSold = product.stats?.soldCount || 0;
                  const lastUpdated = product.stats?.lastRestocked || product.stats?.lastViewed || product.updatedAt || product.createdAt;

                  return (
                    <div
                      key={product._id}
                      className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
                    >
                      {/* Product Card Header */}
                      <div
                        className={`p-4 ${!isSelectionMode ? 'cursor-pointer' : ''}`}
                        onClick={() => !isSelectionMode && toggleCard(product._id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox (only visible in selection mode) */}
                          {isSelectionMode && (
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleProductSelect(product._id, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1"
                            />
                          )}

                          {/* Product Image */}
                          <GlassImage
                            src={product.images?.[0]?.url}
                            alt={product.name}
                            containerClassName="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            imageClassName="w-12 h-12 rounded-full object-cover"
                          />

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-2 h-2 flex-shrink-0 rounded-full ${product.status === 'active' ? 'bg-[#0BB248]' : 'bg-[#FCD116]'}`} />
                                  <h3 className="text-sm font-semibold text-[#17171B] truncate">{product.name}</h3>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                                <p className="text-sm font-medium text-[#425466]">
                                  ₦{new Intl.NumberFormat('en-NG').format(product.price)}
                                </p>
                              </div>
                              {!isSelectionMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCard(product._id);
                                  }}
                                  className="flex-shrink-0"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Blips Tag */}
                            <div className="mt-2">
                              {blipsCount === 0 ? (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0BB24817] rounded-md">
                                  <PlusIcon width={12} height={12} color="#14AE5C" />
                                  <span className="text-[10px] font-semibold text-[#14AE5C]">None</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0BB248] rounded-md">
                                  <Icon icon="icon-park-solid:play" width={12} height={12} color="#FFFFFF" />
                                  <span className="text-[10px] font-semibold text-white">
                                    {blipsCount} Blip{blipsCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && !isSelectionMode && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Stock</div>
                              <div className={`text-sm font-medium flex items-center gap-2 ${product.stock <= 10 ? 'text-red-600' : 'text-[#425466]'}`}>
                                <span>{product.stock}</span>
                                {product.stock <= 10 && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded">
                                    LOW STOCK
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Unit sold</div>
                              <div className="text-sm font-medium text-[#425466]">
                                {unitsSold}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Last Updated</div>
                              <div className="text-sm font-medium text-[#425466]">
                                {formatLastUpdatedDate(lastUpdated)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Status</div>
                              <div className={`inline-block px-2 py-1 rounded-md text-[10px] font-semibold ${
                                product.status === 'active'
                                  ? 'bg-[#0BB24817] text-[#0BB248]'
                                  : 'bg-[#FCD11617] text-[#FCD116]'
                              }`}>
                                {product.status?.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setProductDetailsModalOpen(true);
                              }}
                              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Icon icon={eyeBoldIcon} className="w-4 h-4 text-gray-400 " />
                            </button>
                            <button
                              onClick={() => {
                                navigate(`/dashboard/edit-product/${product._id}`);
                              }}
                              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                              title="Edit Product"
                            >
                              <Icon icon={penBoldIcon} className="w-4 h-4 text-gray-400 " />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteDialogProducts([product as ProductApiModel]);
                                setDeleteDialogOpen(true);
                              }}
                              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete Product"
                            >
                              <Icon icon={trashBinTrashBoldIcon} className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalProducts > itemsPerPage && (
            <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination.totalProducts)} of {pagination.totalProducts}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-700">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * itemsPerPage >= pagination.totalProducts}
                  className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteProductsConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        productIds={deleteDialogProducts.map((p) => p._id)}
        products={deleteDialogProducts}
        onDeleted={handleRefresh}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={productDetailsModalOpen}
        onOpenChange={setProductDetailsModalOpen}
        product={selectedProduct}
      />

      {/* Filter Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        {/* @ts-ignore - DrawerContent type definition issue */}
        <DrawerContent className="">
          <div className="p-4 border-b border-gray-200">
            <div className="relative flex items-center justify-center">
              <h2 className="text-base font-semibold text-[#111827]">Filter Products</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute right-0 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-4 pb-6 space-y-6">
            {/* Price Filter */}
            <div className="flex mt-3 items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#F6F6F6] flex items-center justify-center">
                <NairaIcon width={16} height={16} color="#737375" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Price</h3>
                <div className="flex items-center gap-2 p-[4px] rounded-xl bg-[#E4ECF7]">
                  {['all', 'under-5k', '20k-plus'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setPriceFilter(filter as any);
                        setIsDrawerOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        priceFilter === filter
                          ? 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#FFFFFF]/80'
                          : 'bg-transparent text-[#888787]'
                      }`}
                    >
                      {filter === 'all' ? 'All Prices' : filter === 'under-5k' ? 'Under ₦5K' : 'Above ₦5K'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Level Filter */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F6F6F6] flex items-center justify-center">
                <StockIcon width={16} height={16} color="#737375" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Stock Level</h3>
                <div className="flex items-center gap-2 p-[4px] rounded-xl bg-[#E4ECF7]">
                  {['all', 'in-stock', 'out-of-stock'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setStockFilter(filter as any);
                        setIsDrawerOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        stockFilter === filter
                          ? filter === 'out-of-stock'
                            ? 'bg-[#FFFFFF] text-[#FCD116] hover:bg-[#FFFFFF]/80'
                            : 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#FFFFFF]/80'
                          : filter === 'out-of-stock'
                            ? 'bg-transparent text-[#FCD116]'
                            : 'bg-transparent text-[#0BB248]'
                      }`}
                    >
                      {filter === 'all' ? 'All Stocks' : filter === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Blips Filter */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F6F6F6] flex items-center justify-center">
                <BlipIcon width={16} height={16} color="#737375" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Blips</h3>
                <div className="flex items-center gap-2 p-[4px] rounded-xl bg-[#E4ECF7]">
                  {['all', '0', '1', '4+'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setBlipsFilter(filter as any);
                        setIsDrawerOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        blipsFilter === filter
                          ? 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#FFFFFF]/80'
                          : 'bg-transparent text-[#888787]'
                      }`}
                    >
                      {filter === 'all' ? 'All Blips' : filter === '0' ? '0 Blip' : filter === '1' ? '1 Blip' : '4+ Blips'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  fetchProducts();
                }}
                className="flex-1 px-4 py-2 bg-[#0BB248] text-white rounded-lg text-sm font-semibold hover:bg-[#0BB248]/90 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 px-4 py-2 border border-[#0BB248] rounded-lg text-sm font-semibold text-[#0BB248] bg-white hover:bg-[#0BB248]/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </ConfigProvider>
  );
}
