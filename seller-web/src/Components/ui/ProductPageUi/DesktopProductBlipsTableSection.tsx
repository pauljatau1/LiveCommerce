import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, ConfigProvider, Dropdown, MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchSellerBlips } from '@/Redux/Slices/ProductSlice';
import { Skeleton } from '@/Components/shared/Skeleton';
import { Icon } from '@iconify/react';
import ProductEmptyState from './ProductEmptyState';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon';
import GlassImage from '@/Components/ui/GlassImageV2';
import type { SellerBlip } from '@/types/products';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';
import ProductBlipsDetailsModal from './ProductBlipsDetailsModal';
import CreateBlipModal from './CreateBlipModal';

dayjs.extend(relativeTime);

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
  },
};

export default function DesktopProductBlipsTableSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // @ts-ignore - Assuming state structure based on other components
  const { blips, isLoadingBlips, blipsPagination } = useSelector((state: any) => state.product);

  // Create Blip Modal state
  const [isCreateBlipModalOpen, setIsCreateBlipModalOpen] = useState(false);

  // Filter states
  const [priceFilter, setPriceFilter] = useState<'all' | 'under-5k' | '5k-20k' | '20k-plus'>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Row selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  
  // Details Modal state
  const [selectedBlip, setSelectedBlip] = useState<SellerBlip | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    fetchBlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch blips when pagination changes
  useEffect(() => {
    fetchBlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const fetchBlips = () => {
    // @ts-ignore - Thunk argument typing
    dispatch(fetchSellerBlips({
      page: currentPage,
      limit: itemsPerPage
    }));
  };

  const handlePriceFilterChange = ({ key }: { key: string }) => {
    setPriceFilter(key as any);
  };

  const filteredBlips = useMemo(() => {
    if (!blips) return [];

    let filtered = [...blips];

    // Client-side Price filter
    if (priceFilter !== 'all') {
      if (priceFilter === 'under-5k') {
        filtered = filtered.filter((b: SellerBlip) => b.price < 5000);
      } else if (priceFilter === '5k-20k') {
        filtered = filtered.filter((b: SellerBlip) => b.price >= 5000 && b.price <= 20000);
      } else if (priceFilter === '20k-plus') {
        filtered = filtered.filter((b: SellerBlip) => b.price > 20000);
      }
    }

    return filtered;
  }, [blips, priceFilter]);

  const columns: ColumnsType<SellerBlip> = [
    {
      title: 'PRODUCT NAME',
      key: 'productName',
      width: '25%',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${record.status === 'active' ? 'bg-[#0BB248]' : 'bg-[#FCD116]'}`} />

          {/* Image */}
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
            <GlassImage
              src={record.images} // Assuming images is a string URL as per sample
              alt={record.productName}
              containerClassName="w-full h-full"
              imageClassName="w-full h-full object-cover"
            />
          </div>

          {/* Name and Category (Category not in sample, using hardcoded or generic if missing) */}
          <div className="flex flex-col">
            <span className="text-sm max-w-[200px] truncate font-medium text-[#17171B] hover:text-[#0BB248] cursor-pointer" onClick={() => navigate(record.productLink || '#')}>
              {record.productName}
            </span>
            <span className="text-xs text-[#64748B]">
              {/* Category not explicitly in sample blip object, maybe in product details but not here. Using generic or omitting if not available. */}
              {/* The Figma image shows "Men's Fashion". I'll omit if not available or check if I can infer it. */}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1 cursor-pointer">
          PRICE
          <ArrowDownIcon width={14} height={14} color="#94A3B8" />
        </div>
      ),
      dataIndex: 'price',
      key: 'price',
      width: '15%',
      render: (price) => (
        <span className="text-sm font-medium text-[#425466]">
          ₦ {new Intl.NumberFormat('en-NG').format(price)}
        </span>
      ),
    },
    {
      title: 'STOCK COUNT',
      dataIndex: 'stock',
      key: 'stock',
      width: '15%',
      render: (stock) => (
        <span className={`text-sm font-medium ${stock <= 10 ? 'text-[#EF4444]' : 'text-[#425466]'}`}>
          {stock}
        </span>
      ),
    },
    {
      title: 'ENGAGEMENT',
      key: 'engagement',
      width: '20%',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
            <Icon icon="solar:heart-bold" className="text-[#EF4444] w-3 h-3" />
            <span className="text-xs font-medium text-[#0F172A]">{record.blipEngagement?.likesCount || 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
            <Icon icon="solar:chat-round-dots-bold" className="text-[#F59E0B] w-3 h-3" />
            <span className="text-xs font-medium text-[#0F172A]">{record.blipEngagement?.commentsCount || 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
            <Icon icon="solar:eye-bold" className="text-[#64748B] w-3 h-3" />
            <span className="text-xs font-medium text-[#0F172A]">{record.blipEngagement?.viewCount || 0}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'CREATED AT',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '15%',
      render: (date) => (
        <span className="text-sm text-[#425466]">
          {dayjs(date).fromNow()}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <button
          onClick={() => {
            // @ts-ignore
            setSelectedBlip(record);
            setIsDetailsModalOpen(true);
          }}
          className="px-3 py-1.5 border border-[#0BB248] text-[#0BB248] text-xs font-medium rounded-lg whitespace-nowrap hover:bg-[#0BB248]/10 transition-colors"
        >
          View Details
        </button>
      )
    }
  ];

  const priceMenu: MenuProps = {
    items: [
      { key: 'all', label: 'All Prices' },
      { key: 'under-5k', label: 'Under ₦5,000' },
      { key: '5k-20k', label: '₦5,000 - ₦20,000' },
      { key: '20k-plus', label: 'Above ₦20,000' },
    ],
    onClick: handlePriceFilterChange,
  };

  const getPriceFilterLabel = () => {
    switch (priceFilter) {
      case 'under-5k': return 'Under ₦5,000';
      case '5k-20k': return '₦5,000 - ₦20,000';
      case '20k-plus': return 'Above ₦20,000';
      default: return 'All Prices';
    }
  };

  const onAddBlips = () => {
    setIsCreateBlipModalOpen(true);
  }

  return (
    <ConfigProvider theme={brandTheme}>
      <div className="w-full space-y-4">
        {/* Filter Section */}
        <div className="flex items-center justify-end">
          <Dropdown menu={priceMenu} trigger={['click']}>
            <button className="h-[38px] px-4 flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-lexend font-medium text-[#0BB248] hover:bg-gray-50 transition-colors">
              <Icon icon="solar:tag-price-bold" className="w-4 h-4" />
              {getPriceFilterLabel()}
              <ArrowDownIcon width={12} height={12} color="#0BB248" />
            </button>
          </Dropdown>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          {isLoadingBlips ? (
            <div className="p-4 space-y-4">
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
          ) : filteredBlips.length === 0 ? (
            <div className="p-12 text-center">
              <ProductEmptyState />
              <p className="mt-4 text-gray-500">No blips found</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredBlips}
              rowKey="_id" // Using _id from blip object
              pagination={{
                current: currentPage,
                pageSize: itemsPerPage,
                total: blipsPagination?.totalBlips || 0,
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
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }}
              scroll={{ x: 1000 }}
              className="products-table"
            />
          )}
        </div>

        {/* Blips Details Modal */}
        {selectedBlip && (
            <ProductBlipsDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedBlip(null);
                }}
                // @ts-ignore
                productId={selectedBlip.productId || selectedBlip.product?._id}
                // @ts-ignore
                blipId={selectedBlip.blipId || selectedBlip._id}
                onAddBlips={onAddBlips}
            />
        )}

        {/* Create Blip Modal */}
        <CreateBlipModal
          open={isCreateBlipModalOpen}
          onOpenChange={() => setIsCreateBlipModalOpen(false)}
        />
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
