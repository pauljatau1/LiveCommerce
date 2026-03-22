import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/Components/ui/button';
import { ConfigProvider, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Copy, Check, Link2, Share2, Gift } from 'lucide-react';
import { referralService, Referral } from '@/services/referralService';
import { Skeleton } from '@/Components/shared/Skeleton';
import { useNotification } from '@/Hooks/useNotification';
import { OutletContextType } from '@/types';
import OrdersDatePicker from '@/Components/ui/DashboardHomepageUi/OrdersDatePicker';
import { Dropdown, MenuProps } from 'antd';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon';
import LinksIcon from '@/assets/icons/LinksIcon';
import AnnouncementIcon from '@/assets/icons/AnnouncementIcon';
import GiftIcon from '@/assets/icons/GiftIcon';
import { formatMetricValue } from '@/util/helpers';

// Modals & Components
import ShareReferralLinkModal from '@/Components/marketing/ShareReferralLinkModal';
import ReferralDetailsModal from '@/Components/marketing/ReferralDetailsModal';
import MobileReferralList from '@/Components/marketing/MobileReferralList';



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

export default function ReferralPage() {
  const { setHeaderName, setNavName } = useOutletContext<OutletContextType>();
  const { showNotification } = useNotification();

  // Filters and pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  // Modals & Selection
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Copy state
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setHeaderName('Referral');
    setNavName('');
  }, [setHeaderName, setNavName]);

  // Tanstack Queries
  const { data: overview, isLoading: isLoadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['referralOverview'],
    queryFn: () => referralService.getOverview(),
  });

  const { 
    data: historyPages, 
    isRefetching: isLoadingHistory, 
    refetch: refetchHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['referralHistory', itemsPerPage, statusFilter, dateRange, searchQuery],
    queryFn: ({ pageParam = 1 }) => {
      const params: any = {
        page: pageParam,
        limit: itemsPerPage,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (dateRange.startDate && dateRange.endDate) {
        params.from = new Date(dateRange.startDate).toISOString();
        params.to = new Date(dateRange.endDate).toISOString();
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      return referralService.getHistory(params);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const allReferrals = useMemo(() => {
    return historyPages?.pages.flatMap(page => page.referrals) || [];
  }, [historyPages]);

  const { data: selectedReferral, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['referralDetail', selectedReferralId],
    queryFn: () => referralService.getReferralDetail(selectedReferralId!),
    enabled: !!selectedReferralId && isDetailsModalOpen,
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchHistory();
  };

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setDateRange({ startDate, endDate });
  };

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleViewDetails = (referralId: string) => {
    setSelectedReferralId(referralId);
    setIsDetailsModalOpen(true);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as string[]);
  };

  // Status Filter Menu
  const statusFilterMenu: MenuProps = {
    items: [
      {
        key: 'all',
        label: (
          <div className={`px-3 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            All Status
          </div>
        ),
        onClick: () => {
          setStatusFilter('all');
        },
      },
      {
        key: 'pending',
        label: (
          <div className={`px-3 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            Pending
          </div>
        ),
        onClick: () => {
          setStatusFilter('pending');
        },
      },
      {
        key: 'completed',
        label: (
          <div className={`px-3 py-2 rounded-lg ${statusFilter === 'completed' ? 'bg-[#0BB248] text-white' : 'text-gray-700'}`}>
            Completed
          </div>
        ),
        onClick: () => {
          setStatusFilter('completed');
        },
      },
    ],
  };

  const columns: ColumnsType<Referral> = [
    {
      title: 'NAME',
      dataIndex: ['referee', 'name'],
      key: 'name',
      render: (text) => <p className="font-medium max-w-[200px] truncate text-[#101828]">{text}sddddddddddddddddddddddddddddddddd</p>,
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status === 'completed' ? 'bg-[#0BB248]' : status === 'pending' ? 'bg-[#F97316]' : 'bg-gray-400'}`} />
          <span className="text-[#344054] capitalize">{status}</span>
        </div>
      ),
    },
    {
      title: 'REWARD',
      dataIndex: 'amountEarned',
      key: 'reward',
      render: (amount: number, record: Referral) => (
        <span className="text-[#344054]">
          {record.status === 'completed' ? `₦ ${new Intl.NumberFormat('en-NG').format(amount)}` : '-'}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_, record) => (
        <Button
          variant="outline"
          className="h-8 border-[#0BB248] text-[#0BB248] hover:text-[#0BB248] hover:bg-[#0BB248]/10 px-4"
          onClick={() => handleViewDetails(record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="py-6 space-y-8 ">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl 3xl:text-2xl font-bold text-[#16192C]">Invite, Earn & Grow Together</h1>
          <p className="text-[#718096] text-sm 3xl:text-base mt-1">Get rewards for referring sellers to Auqli.</p>
        </div>
        <Button 
          className="h-10 rounded-lg border border-[#0BB248] bg-transparent text-[#0BB248] hover:bg-[#0BB248]/10 px-6 font-semibold"
          onClick={() => setIsShareModalOpen(true)}
        >
          <Link2 className="h-4 w-4 mr-2 text-[#0BB248]" />
          Share Your Link
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          {isLoadingOverview ? (
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
          ) : (
            <div className="text-2xl 3xl:text-3xl font-bold text-[#101828]">
              {overview?.stats.totalReferred ? overview.stats.totalReferred - overview.stats.completedReferrals : 0}
            </div>
          )}
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending Referrals</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          {isLoadingOverview ? (
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
          ) : (
            <div className="text-2xl 3xl:text-3xl font-bold text-[#101828]">
              {overview?.stats.completedReferrals || 0}
            </div>
          )}
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Successful Referrals</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          {isLoadingOverview ? (
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
          ) : (
            <div className="text-2xl 3xl:text-3xl font-bold text-[#101828]">
              ₦{formatMetricValue(overview?.stats.totalEarned || 0)}
            </div>
          )}
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rewards Earned</div>
        </div>
      </div>

      {/* Info Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-base border-b-2 border-[#16192C] inline-block pb-1 mb-4">For Sellers</h3>
          <p className="text-sm text-[#425466] mb-4 font-medium">Seller-Side Rewards</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-[#E7F7ED] p-1">
                <Check className="h-3 w-3 text-[#0BB248]" />
              </div>
              <span className="text-sm text-[#344054]">Invite new sellers & earn <strong>5%</strong> order value as wallet credit, up to a maximum of <strong>₦3,000</strong> per transaction.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-[#E7F7ED] p-1">
                <Check className="h-3 w-3 text-[#0BB248]" />
              </div>
              <span className="text-sm text-[#344054]">Your reward is automatically added to your wallet for future use.</span>
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-base border-b-2 border-[#16192C] inline-block pb-1 mb-4">For Buyers</h3>
          <p className="text-sm text-[#425466] mb-4 font-medium">Buyer-Side Rewards</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-[#E7F7ED] p-1">
                <Check className="h-3 w-3 text-[#0BB248]" />
              </div>
              <span className="text-sm text-[#344054]">Earn <strong>10%</strong> cashback on every eligible purchase, up to a maximum of <strong>₦2,000</strong> per transaction.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-[#E7F7ED] p-1">
                <Check className="h-3 w-3 text-[#0BB248]" />
              </div>
              <span className="text-sm text-[#344054]">Your reward is automatically added to your wallet for future use.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-gray-100 text-center">
        <h3 className="font-bold text-lg border-b-2 border-[#101828] inline-block pb-1 mb-8">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-xl bg-[#0BB2481A] flex items-center justify-center mb-4">
              <LinksIcon />
            </div>
            <p className="text-sm font-semibold text-[#101828]">1. Get your unique link</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-xl bg-[#0BB2481A] flex items-center justify-center mb-4">
              <AnnouncementIcon className="h-6 w-6 text-[#0BB248]" />
            </div>
            <p className="text-sm font-semibold text-[#101828]">2. Share with friends/sellers</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-xl bg-[#0BB2481A] flex items-center justify-center mb-4">
              <GiftIcon className="h-6 w-6 text-[#0BB248]" />
            </div>
            <p className="text-sm font-semibold text-[#101828]">3. Earn when they Sign up + Transact</p>
          </div>
        </div>
      </div>

      {/* Referral History Table Section */}
      <div className="space-y-4">
        <div className="md:bg-[#FFFFFF] md:p-3 md:rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-xl 3xl:text-2xl font-bold text-[#101828]">Referral History</h2>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            {/*<div className="relative w-full">
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search Referrals" 
                  className="h-10 pl-10 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] w-full lg:w-[300px]"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded bg-[#0BB248] flex items-center justify-center cursor-pointer border-none outline-none hover:bg-[#0a9a3d]"
                >
                  <Search className="h-3 w-3 text-white" />
                </button>
              </form>
            </div>*/}

            <OrdersDatePicker 
              onDateRangeChange={handleDateRangeChange}
            />

            <Dropdown menu={statusFilterMenu} trigger={['click']} placement="bottomRight">
              <Button variant="outline" className="h-8 border-[#0BB248] text-[#0BB248] hover:text-[#0BB248] hover:bg-[#0BB248]/5 gap-2 min-w-[130px] justify-between">
                {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <ArrowDownIcon className="w-3 h-3" color="#0BB248" />
              </Button>
            </Dropdown>

            <Button variant="outline" onClick={handleRefresh} className="h-8 border-[#0BB248] hover:text-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/5 gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {isLoadingHistory && allReferrals.length === 0 ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allReferrals.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <ConfigProvider theme={brandTheme}>
                  <Table
                    columns={columns}
                    dataSource={allReferrals}
                    rowKey="id"
                    pagination={false}
                    rowSelection={{
                      type: 'checkbox',
                      selectedRowKeys,
                      onChange: onSelectChange,
                    }}
                    className="w-full"
                  />
                </ConfigProvider>
              </div>

              {/* Mobile View */}
              <div className="block md:hidden bg-[#F8FAFC] p-4">
                <MobileReferralList 
                  referrals={allReferrals}
                  isLoading={isFetchingNextPage}
                  onViewDetails={handleViewDetails}
                  selectedKeys={selectedRowKeys}
                  onSelectChange={setSelectedRowKeys}
                />
              </div>
              
              {/* Pagination */}
              {hasNextPage && (
                <div className="flex items-center justify-center p-6 border-t border-gray-100 bg-white">
                  <Button 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    variant="outline"
                    className="border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/5"
                  >
                    {isFetchingNextPage ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <h3 className="text-xl 3xl:text-2xl font-bold text-[#0BB248] mb-2">No Referrals Found!</h3>
              <p className="text-gray-500 text-sm lg:text-base mb-8 max-w-[800px] ">
                There are no products matching your current filters. Try adjusting your search criteria, date range.
              </p>
              
              <div className="mb-8">
                {/* Simple illustration placeholder for empty state */}
                <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="50" y="50" width="100" height="80" rx="8" fill="#0BB248" />
                  <circle cx="80" cy="90" r="5" fill="#101828" />
                  <circle cx="120" cy="90" r="5" fill="#101828" />
                  <path d="M85 110 Q100 120 115 110" stroke="#101828" strokeWidth="3" strokeLinecap="round" />
                  <rect x="60" y="30" width="80" height="20" rx="4" fill="#E7F7ED" />
                </svg>
              </div>

              <p className="font-semibold text-[#425466] mb-4">Let's fix that!</p>
              <Button 
                className="bg-[#0BB248] hover:bg-[#0a9a3d] text-white px-8"
                onClick={() => setIsShareModalOpen(true)}
              >
                Share Link
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Share Link Modal */}
      <ShareReferralLinkModal 
        isOpen={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        referralLink={overview?.referralLink || ''}
      />

      {/* Referral Details Modal */}
      <ReferralDetailsModal 
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        isLoading={isLoadingDetails}
        selectedReferral={selectedReferral}
      />
    </div>
  );
}
