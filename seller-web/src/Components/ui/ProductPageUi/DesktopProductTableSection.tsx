import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Switch, Dropdown, ConfigProvider, Tag, type MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search, RefreshCw, X } from 'lucide-react';
import { fetchSellerProducts, toggleVacationMode, searchSellerProducts } from '@/Redux/Slices/ProductSlice';
import { Skeleton } from '@/Components/shared/Skeleton';
import { Icon } from '@iconify/react';
import ProductEmptyState from './ProductEmptyState';
import OrdersDatePicker from '@/Components/ui/DashboardHomepageUi/OrdersDatePicker';
import FilterIcon from '@/assets/icons/FilterIcon';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon';
import GlassImage from '@/Components/ui/GlassImageV2';
import PlusIcon from '@/assets/icons/PlusIcon2';

// Brand color theme for Ant Design components
const brandTheme = {
  token: {
    colorPrimary: '#0BB248',
    colorLink: '#0BB248',
    colorLinkHover: '#0a9a3d',
    borderRadius: 8,
  },
  components: {
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#94A3B8',
    },
    Switch: {
      colorPrimary: '#0BB248',
      colorPrimaryHover: '#0a9a3d',
    },
  },
};

// Map UI sort type to API sortBy parameter
const mapSortTypeToAPI = (uiSortType: string) => {
  switch (uiSortType) {
    case 'newest-to-oldest':
      return 'newest';
    case 'oldest-to-newest':
      return 'oldest';
    case 'price-high-to-low':
      return 'price_desc';
    case 'price-low-to-high':
      return 'price_asc';
    default:
      return 'newest';
  }
};

export default function DesktopProductTableSection() {
  const dispatch = useDispatch();
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortType, setSortType] = useState('newest-to-oldest');
  
  // Table sorting state
  const [priceSortOrder, setPriceSortOrder] = useState<'ascend' | 'descend' | null>(null);

  // Row selection state - persisted across pages
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

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

  // Handle date range change
  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setDateRange({ startDate, endDate });
    setCurrentPage(1);
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

  // Price filter menu
  const priceFilterMenu: MenuProps = {
    items: [
      {
        key: 'all',
        label: (
          <div className={`px-3 py-2 rounded-lg ${priceFilter === 'all' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            All Prices
          </div>
        ),
        onClick: () => {
          setPriceFilter('all');
          setCurrentPage(1);
        },
      },
      {
        key: 'under-5k',
        label: (
          <div className={`px-3 py-2 rounded-lg ${priceFilter === 'under-5k' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            Under ₦ 5k
          </div>
        ),
        onClick: () => {
          setPriceFilter('under-5k');
          setCurrentPage(1);
        },
      },
      {
        key: '5k-20k',
        label: (
          <div className={`px-3 py-2 rounded-lg ${priceFilter === '5k-20k' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            ₦ 5k - ₦ 20k
          </div>
        ),
        onClick: () => {
          setPriceFilter('5k-20k');
          setCurrentPage(1);
        },
      },
      {
        key: '20k-plus',
        label: (
          <div className={`px-3 py-2 rounded-lg ${priceFilter === '20k-plus' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            ₦ 20k and above
          </div>
        ),
        onClick: () => {
          setPriceFilter('20k-plus');
          setCurrentPage(1);
        },
      },
    ],
  };

  // Filter products by stock and blips (client-side filtering)
  const filteredProducts = useMemo(() => {
    let filtered = [...(products || [])];

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter((p: any) => p.stock > 0);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter((p: any) => p.stock <= 0);
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

  // Table columns
  const columns: ColumnsType<any> = [
    {
      title: 'PRODUCT NAME',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-sm ${record.status === 'active' ? 'bg-[#0BB248]' : 'bg-[#FCD116]'} flex-shrink-0`} />
          <div className="flex items-center gap-2">
            <GlassImage
              src={record.images?.[0]?.url}
              alt={record.name}
              containerClassName="w-8 h-8 rounded-sm object-cover flex-shrink-0"
              imageClassName="w-8 h-8 rounded-sm object-cover"
            />
            <div>
              <div className="font-medium max-w-[200px] truncate text-[#17171B]">{text}</div>
              <div className="text-sm text-gray-500">{record.category}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PRICE',
      dataIndex: 'price',
      key: 'price',
      sorter: (a: any, b: any) => a.price - b.price,
      sortOrder: priceSortOrder,
      render: (price: number) => (
        <span className="text-[#425466]">
          ₦{new Intl.NumberFormat('en-NG').format(price)}
        </span>
      ),
    },
    {
      title: 'STOCK COUNT',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <span
          className={stock <= 10 ? 'text-red-600 border-b-2 border-red-600' : 'text-[#425466]'}
        >
          {stock}
        </span>
      ),
    },
    {
      title: 'BLIPS',
      dataIndex: 'blips',
      key: 'blips',
      render: (blips: any[]) => {
        const count = blips?.length || 0;
        if (count === 0) {
          return (
            <Tag
              color="#14AE5C"
              className="px-2 py-0.5 w-[65px] rounded-md font-['Lexend'] text-[10px] font-semibold flex items-center gap-1"
            >
              <PlusIcon width={12} height={12} color="#14AE5C" />
              <span>None</span>
            </Tag>
          );
        }
        return (
          <Tag
            color="#14AE5C"
            className="px-2 py-0.5 w-[65px] rounded-md font-['Lexend'] text-[10px] font-semibold flex items-center gap-1 bg-[#0BB248] text-white"
          >
            <Icon icon="icon-park-solid:play" width={12} height={12} color="#14AE5C" />
            <span>{count} Blip{count !== 1 ? 's' : ''}</span>
          </Tag>
        );
      },
    },
    {
      title: '',
      key: 'action',
      render: () => (
        <button className="px-2 py-1 border border-solid border-[#0BB248] text-[#0BB248] whitespace-nowrap rounded-lg text-xs font-semibold hover:bg-[#0BB24817] transition-colors">
          View Details
        </button>
      ),
    },
  ];

  // Row selection configuration - persists across pages
  const rowSelection = {
    selectedRowKeys: selectedRowKeys.filter(key => 
      filteredProducts.some((p: any) => p._id === key)
    ),
    onChange: (selectedKeys: React.Key[]) => {
      const newKeys = selectedKeys as string[];
      // Get all currently visible product IDs
      const currentPageIds = filteredProducts.map((p: any) => p._id);
      
      // Remove any keys that are from the current page (to handle deselection)
      const keysFromOtherPages = selectedRowKeys.filter(key => !currentPageIds.includes(key));
      
      // Merge: keep keys from other pages + new selection from current page
      setSelectedRowKeys([...keysFromOtherPages, ...newKeys]);
    },
    getCheckboxProps: (record: any) => ({
      name: record.name,
      // Check if this record is selected (even if from a different page)
      checked: selectedRowKeys.includes(record._id),
    }),
  };

  return (
    <ConfigProvider theme={brandTheme}>
      <div className="w-full bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {/* Vacation Mode Section */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#344054]">VACATION MODE</h3>
            <p className="text-xs font-lexend text-[#272D30] ">Temporary Close Your Store</p>
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

        {/* Filters Section */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] space-y-4">
          {/* Top Row: Search, Date, Price, Status, Refresh */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-[400px]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Products"
                  className="w-full h-[38px] pl-3 pr-3 py-2 text-sm border-[1.5px] border-[#16783A52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent placeholder:text-[#425466] placeholder:text-xs placeholder:font-lexend placeholder:font-normal"
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
                  {
                    isSearchMode ? (
                      <X className="w-4 h-4 text-white" />
                    ) : (
                      <Search className="w-4 h-4 text-white" />
                    )
                  }
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3">


              {/* Date Picker */}
              <div className="">
                <OrdersDatePicker onDateRangeChange={handleDateRangeChange} />
              </div>

              {/* Price Filter */}
              <Dropdown menu={priceFilterMenu} trigger={['hover']} placement="bottomLeft">
                <button className="px-4 py-2 border border-[#0BB248] rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-[#0BB248]">
                    {priceFilter === 'all' ? 'All Prices' :
                      priceFilter === 'under-5k' ? 'Under ₦ 5k' :
                        priceFilter === '5k-20k' ? '₦ 5k - ₦ 20k' : '₦ 20k+'}
                  </span>
                  <ArrowDownIcon width={16} height={16} color="#0BB248" />
                </button>
              </Dropdown>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 p-[4px] rounded-lg bg-[#E4ECF7] ">
                <button
                  onClick={() => {
                    setStatusFilter('active');
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'active'
                    ? 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#FFFFFF]/80 '
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
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'draft'
                    ? 'bg-[#FFFFFF] text-[#FCD116] hover:bg-[#FFFFFF]/80 '
                    : 'bg-transparent text-[#FCD116]'
                    }`}
                >
                  Drafts
                </button>
              </div>


            </div>
          </div>

          {/* Bottom Row: Stock and Blips Filters */}
          <div className="flex items-center justify-between gap-6 flex-wrap">
            {/* Stock Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#737375]">
                <FilterIcon width={16} height={16} color="#737375" />
                <p>Filter By Stock:</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStockFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'all'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  All Stock
                </button>
                <button
                  onClick={() => {
                    setStockFilter('in-stock');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'in-stock'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => {
                    setStockFilter('out-of-stock');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'out-of-stock'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Blips Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#737375]">
                <FilterIcon width={16} height={16} />
                <p>Filter By Blips:</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBlipsFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${blipsFilter === 'all'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  All Blips
                </button>
                <button
                  onClick={() => {
                    setBlipsFilter('0');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${blipsFilter === '0'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  No Blips
                </button>
                <button
                  onClick={() => {
                    setBlipsFilter('1');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${blipsFilter === '1'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  1 Blip
                </button>
                <button
                  onClick={() => {
                    setBlipsFilter('4+');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${blipsFilter === '4+'
                    ? 'bg-[#0BB24840] text-[#0BB248] hover:bg-[#0BB24860]'
                    : 'bg-transparent border border-solid border-gray-300 text-[#737375] hover:bg-gray-100'
                    }`}
                >
                  4+ Blips
                </button>
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-solid border-[#0BB248] text-[#0BB248] rounded-lg flex items-center gap-2 hover:bg-[#0BB24817] transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-[#0BB248]" />
                <span className="text-sm font-medium text-[#0BB248]">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="space-y-0 border border-[#E5E7EB] rounded-lg overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_120px] gap-4 px-6 py-4 border-b border-[#E5E7EB] last:border-b-0 items-center"
                >
                  {/* Product Name Column */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-3 h-3 rounded-sm" />
                    <Skeleton className="w-8 h-8 rounded-sm flex-shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Skeleton className="h-4 w-[180px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                  </div>
                  
                  {/* Price Column */}
                  <Skeleton className="h-4 w-[80px]" />
                  
                  {/* Stock Count Column */}
                  <Skeleton className="h-4 w-[60px]" />
                  
                  {/* Blips Column */}
                  <Skeleton className="h-6 w-[65px] rounded-md" />
                  
                  {/* Action Column */}
                  <Skeleton className="h-7 w-[90px] rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <ProductEmptyState />
          ) : (
            <>
              {/* Selection Header - shown when rows are selected */}
              {selectedRowKeys.length > 0 && (
                <div className="mb-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#8492A6]">
                      {selectedRowKeys.length} SELECTED
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Delete functionality placeholder
                          // selectedRowKeys contains all selected items across all pages
                          console.log('Delete selected (all pages):', selectedRowKeys);
                          // TODO: Implement actual delete API call with all selectedRowKeys
                        }}
                        className="px-4 py-2 bg-[#0BB248] text-white rounded-full text-xs font-semibold hover:bg-[#0BB248]/90 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          // Set as draft functionality placeholder
                          // selectedRowKeys contains all selected items across all pages
                          console.log('Set as draft (all pages):', selectedRowKeys);
                          // TODO: Implement actual set as draft API call with all selectedRowKeys
                        }}
                        className="px-4 py-2 border border-[#0BB248] text-[#0BB248] rounded-full text-xs font-semibold hover:bg-[#0BB24817] transition-colors"
                      >
                        Set as Draft
                      </button>
                      <button
                        onClick={() => {
                          // Unselect all functionality - clears selection across all pages
                          setSelectedRowKeys([]);
                        }}
                        className="px-4 py-2 border border-[#0BB248] text-[#0BB248] rounded-full text-xs font-semibold hover:bg-[#0BB24817] transition-colors"
                      >
                        Unselect all
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <Table
                columns={selectedRowKeys.length > 0 ? columns.map(col => ({ ...col, title: '' })) : columns}
                dataSource={filteredProducts}
                rowKey="_id"
                rowSelection={rowSelection}
                showHeader={selectedRowKeys.length === 0}
                onChange={(_pagination, _filters, sorter: any) => {
                  // Only handle sorting changes - pagination is handled by pagination prop
                  if (sorter && sorter.field === 'price') {
                    const newSortOrder = sorter.order;
                    setPriceSortOrder(newSortOrder);
                    
                    // Update sortType based on sort order - this triggers fetchProducts via useEffect
                    if (newSortOrder === 'ascend') {
                      setSortType('price-low-to-high');
                    } else if (newSortOrder === 'descend') {
                      setSortType('price-high-to-low');
                    } else {
                      // If sort is cleared, reset to default
                      setSortType('newest-to-oldest');
                      setPriceSortOrder(null);
                    }
                    
                    // Reset to first page when sorting changes
                    //setCurrentPage(1);
                  } else if (!sorter || !sorter.order) {
                    // If sorting is cleared, reset to default
                    setPriceSortOrder(null);
                    if (sortType === 'price-low-to-high' || sortType === 'price-high-to-low') {
                      setSortType('newest-to-oldest');
                      setCurrentPage(1);
                    }
                  }
                }}
                pagination={{
                  current: currentPage,
                  pageSize: itemsPerPage,
                  total: pagination?.totalProducts || 0,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onChange: (page, pageSize) => {
                    setCurrentPage(page);
                    setItemsPerPage(pageSize);
                  },
                  onShowSizeChange: (_current, size) => {
                    setCurrentPage(1);
                    setItemsPerPage(size);
                  },
                }}
                className="products-table"
              />
            </>
          )}
        </div>
      </div>

      <style>{`
        .products-table .ant-table-thead > tr > th {
          background-color: #FAFAFA;
          color: #94A3B8;
          font-size: 10px;
          font-weight: 600;
          font-family: 'Lexend', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #EDF2F7;
          padding: 18px 24px;
        }
        .products-table .ant-table-tbody > tr > td {
          background-color: white;
          border-bottom: 1px solid #EDF2F7;
          padding: 16px 24px;
        }
        .products-table .ant-table-tbody > tr:hover > td {
          background-color: #F9FAFB;
        }
        .products-table .ant-pagination {
          margin-top: 24px;
        }
        .products-table .ant-pagination .ant-pagination-item-active {
          background-color: #0BB248;
          border-color: #0BB248;
        }
        .products-table .ant-pagination .ant-pagination-item-active a {
          color: #fff;
        }
        .products-table .ant-pagination .ant-pagination-item:hover {
          border-color: #0BB248;
        }
        .products-table .ant-pagination .ant-pagination-item:hover a {
          color: #0BB248;
        }
        .products-table .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #0BB248;
          border-color: #0BB248;
        }
        .products-table .ant-checkbox-wrapper:hover .ant-checkbox-inner {
          border-color: #0BB248;
        }
      `}</style>
    </ConfigProvider>
  );
}
