import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConfigProvider, Checkbox } from 'antd';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSellerBlips } from '@/Redux/Slices/ProductSlice';
import { Skeleton } from '@/Components/shared/Skeleton';
import { Icon } from '@iconify/react';
import ProductEmptyState from './ProductEmptyState';
import GlassImage from '@/Components/ui/GlassImageV2';
import type { SellerBlip } from '@/types/products';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ProductBlipsDetailsModal from './ProductBlipsDetailsModal';
import CreateBlipModal from './CreateBlipModal';
import DeleteBlipConfirmationModal from './DeleteBlipConfirmationModal';

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
  },
};

export default function MobileProductBlipsTableSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // @ts-ignore
  const { blips, isLoadingBlips, blipsPagination } = useSelector((state: any) => state.product);
  const [isCreateBlipModalOpen, setIsCreateBlipModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [blipToDelete, setBlipToDelete] = useState('');
  const [blipProductIdToDelete, setBlipProductIdToDelete] = useState('');

  // Filter states
  const [priceFilter, setPriceFilter] = useState<'all' | 'under-5k' | '5k-20k' | '20k-plus'>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Details Modal state
  const [selectedBlip, setSelectedBlip] = useState<SellerBlip | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch blips when pagination changes
  useEffect(() => {
    // @ts-ignore
    dispatch(fetchSellerBlips({ page: currentPage, limit: itemsPerPage }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

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

  // Toggle card expansion
  const toggleCard = (blipId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blipId)) {
        newSet.delete(blipId);
      } else {
        newSet.add(blipId);
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
  const handleBlipSelect = (blipId: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys([...selectedRowKeys, blipId]);
    } else {
      setSelectedRowKeys(selectedRowKeys.filter(id => id !== blipId));
    }
  };

  // Handle Add Blip
  const onBlipAdd = () => {
    setIsCreateBlipModalOpen(true);
  };

  const refetchBlips = async () => {
    try {
      // @ts-ignore
      await dispatch(fetchSellerBlips({ page: currentPage, limit: itemsPerPage }));
    } catch (error) {
      console.error('Failed to refetch blips:', error);
    }
  };

  return (
    <ConfigProvider theme={brandTheme}>
      <div className="w-full space-y-4">
        {/* Filter Section (Simplified for Mobile) */}
        {/* Keeping it minimal as per instructions to remove search/month/active filters */}

        {/* Select All / Selection Mode Header */}
        {!isSelectionMode ? (
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-white rounded-t-lg">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center text-xs font-lexend font-medium text-gray-700 gap-2"
            >
              <Icon icon="bx:checkbox" width={18} height={18} color="#374151" />
              <span>SELECT ITEMS</span>
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-gray-50 rounded-t-lg">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <div className="flex items-center gap-2">
              {/* Actions for selected items could go here */}
              <span className="text-xs font-semibold text-[#0BB248]">{selectedRowKeys.length} Selected</span>
            </div>
          </div>
        )}

        {/* Blips List */}
        <div className="space-y-3">
          {isLoadingBlips ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border border-[#E5E7EB] rounded-lg space-y-3 bg-white">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filteredBlips.length === 0 ? (
            <ProductEmptyState />
          ) : (
            filteredBlips.map((blip: SellerBlip) => {
              const isExpanded = expandedCards.has(blip._id);
              const isSelected = selectedRowKeys.includes(blip._id);

              return (
                <div
                  key={blip._id}
                  className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className={`p-4 ${!isSelectionMode ? 'cursor-pointer' : ''}`}
                    onClick={() => !isSelectionMode && toggleCard(blip._id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      {isSelectionMode && (
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleBlipSelect(blip._id, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      )}

                      {/* Image */}
                      <GlassImage
                        src={blip.images}
                        alt={blip.productName}
                        containerClassName="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100"
                        imageClassName="w-12 h-12 rounded-full object-cover"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-[#17171B] truncate mb-1">{blip.productName}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                              <div className="flex items-center gap-1">
                                <Icon icon="solar:eye-bold" className="text-[#64748B] w-3 h-3" />
                                <span>{new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(blip.blipEngagement?.viewCount || 0)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${blip.status === 'active' ? 'bg-[#E8FAF0] text-[#0BB248]' : 'bg-gray-100 text-gray-500'}`}>
                                {blip.status}
                              </span>
                              <span className="text-sm font-medium text-[#425466]">
                                ₦{new Intl.NumberFormat('en-NG').format(blip.price)}
                              </span>
                            </div>
                          </div>
                          {!isSelectionMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCard(blip._id);
                              }}
                              className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && !isSelectionMode && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Stock</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#425466]">{blip.stock}</span>
                            {blip.stock <= 10 && (
                              <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#EF4444] text-[10px] font-bold rounded">
                                LOW STOCK
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Created</div>
                          <div className="text-sm font-medium text-[#425466]">
                            {dayjs(blip.createdAt).format('MMM. D, YYYY')}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Engagement</div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Icon icon="solar:heart-bold" className="text-[#EF4444] w-4 h-4" />
                              <span className="text-sm font-medium text-[#425466]">{blip.blipEngagement?.likesCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon="solar:chat-round-dots-bold" className="text-[#425466] w-4 h-4" />
                              <span className="text-sm font-medium text-[#425466]">{blip.blipEngagement?.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Blips Uploaded</div>
                          <button className="flex items-center gap-1 px-3 py-1 bg-[#E8FAF0] rounded-lg">
                            <Icon icon="solar:play-circle-bold" className="text-[#0BB248] w-4 h-4" />
                            <span className="text-xs font-bold text-[#0BB248]">1 Blip</span>
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <div className="text-sm font-medium text-gray-500">Action</div>
                        <div className="flex items-center gap-4">
                          <button
                            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                            onClick={() => {
                              // @ts-ignore
                              setSelectedBlip(blip);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <Icon icon="solar:eye-bold" className="text-[#64748B] w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 hover:bg-[#FEF2F2] rounded-full transition-colors group"
                            onClick={(e) => {
                              e.stopPropagation();
                              // @ts-ignore
                              setBlipProductIdToDelete(blip.productId || blip.product?._id || '');
                              setBlipToDelete(blip.blipId);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" className="text-[#EF4444] w-5 h-5 group-hover:text-[#DC2626]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {blipsPagination && blipsPagination.totalBlips > itemsPerPage && (
          <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between bg-white rounded-lg">
            <span className="text-xs text-gray-500">
              {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, blipsPagination.totalBlips)} of {blipsPagination.totalBlips}
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
                disabled={currentPage * itemsPerPage >= blipsPagination.totalBlips}
                className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

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
            onAddBlips={onBlipAdd}
          />
        )}

        {/* Create Blip Modal */}
        <CreateBlipModal
          open={isCreateBlipModalOpen}
          onOpenChange={() => setIsCreateBlipModalOpen(false)}
        />

        {/* Delete Blip Confirmation Modal */}
        <DeleteBlipConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setBlipToDelete('');
            setBlipProductIdToDelete('');
          }}
          productId={blipProductIdToDelete}
          blipId={blipToDelete}
          onSuccess={refetchBlips}
        />
      </div>
    </ConfigProvider>
  );
}
