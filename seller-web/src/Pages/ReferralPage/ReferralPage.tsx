import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/Components/ui/button';
import { ConfigProvider, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Copy, Check, Link2, Share2, Gift } from 'lucide-react';
import { referralService, Referral } from '@/services/referralService';
import { Skeleton } from '@/Components/shared/Skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { useNotification } from '@/Hooks/useNotification';
import { OutletContextType } from '@/types';
import OrdersDatePicker from '@/Components/ui/DashboardHomepageUi/OrdersDatePicker';
import { Dropdown, MenuProps } from 'antd';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon';
import LinksIcon from '@/assets/icons/LinksIcon';
import AnnouncementIcon from '@/assets/icons/AnnouncementIcon';
import GiftIcon from '@/assets/icons/GiftIcon';
import { formatMetricValue } from '@/util/helpers';



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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);

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

  const { data: history, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['referralHistory', currentPage, itemsPerPage, statusFilter, dateRange],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (dateRange.startDate && dateRange.endDate) {
        params.from = new Date(dateRange.startDate).toISOString();
        params.to = new Date(dateRange.endDate).toISOString();
      }

      return referralService.getHistory(params);
    },
  });

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
    setCurrentPage(1);
  };

  const handleCopyLink = async () => {
    const link = overview?.referralLink || '';
    if (!link) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setIsCopied(true);
      showNotification('Referral link copied to clipboard!', 'information');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      showNotification('Failed to copy link', 'error');
    }
  };

  const handleViewDetails = (referralId: string) => {
    setSelectedReferralId(referralId);
    setIsDetailsModalOpen(true);
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
          setCurrentPage(1);
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
          setCurrentPage(1);
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
          setCurrentPage(1);
        },
      },
    ],
  };

  const columns: ColumnsType<Referral> = [
    {
      title: 'NAME',
      dataIndex: ['referee', 'name'],
      key: 'name',
      render: (text) => <span className="font-medium text-[#101828]">{text}</span>,
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
          className="h-8 border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/10 px-4"
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
              <span className="text-sm text-[#344054]">Invite new sellers & earn <strong>₦2000</strong> (or 10%) after their first sales</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-[#E7F7ED] p-1">
                <Check className="h-3 w-3 text-[#0BB248]" />
              </div>
              <span className="text-sm text-[#344054]">You earn fee waivers for successful referrals</span>
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
              <span className="text-sm text-[#344054]"><strong>₦500</strong> discount on first order for referred buyer</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-[#E7F7ED] p-1">
                <Check className="h-3 w-3 text-[#0BB248]" />
              </div>
              <span className="text-sm text-[#344054]">Referrer gets store credit after purchase</span>
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-xl 3xl:text-2xl font-bold text-[#101828]">Referral History</h2>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Referrals" 
                className="h-10 pl-10 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] w-full md:w-[300px]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded bg-[#0BB248] flex items-center justify-center cursor-pointer">
                <Search className="h-3 w-3 text-white" />
              </div>
            </div>

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
          {isLoadingHistory ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history?.referrals && history.referrals.length > 0 ? (
            <>
              <ConfigProvider theme={brandTheme}>
                <Table
                  columns={columns}
                  dataSource={history.referrals}
                  rowKey="id"
                  pagination={false}
                  rowSelection={{
                    type: 'checkbox',
                  }}
                  className="w-full"
                />
              </ConfigProvider>
              
              {/* Pagination */}
              {history.pagination.pages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Entries per page</span>
                    <select 
                      className="h-8 border border-gray-200 rounded text-sm outline-none"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 rounded flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: history.pagination.pages }).map((_, idx) => {
                      const page = idx + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded flex items-center justify-center text-sm ${
                            currentPage === page 
                              ? 'bg-[#0BB248] text-white font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(history.pagination.pages, p + 1))}
                      disabled={currentPage === history.pagination.pages}
                      className="h-8 w-8 rounded flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
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
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[500px] text-center py-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-[#101828] text-center">Invite Sellers & Earn Together</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-[#344054] font-medium">Share your referral link. Earn rewards when they sell.</p>
            
            <div className="text-left space-y-2">
              <label className="text-sm font-semibold text-[#101828]">Your Referral Link</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-gray-200 rounded-lg p-1 pl-3">
                <input 
                  type="text" 
                  readOnly 
                  value={overview?.referralLink || ''} 
                  className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
                />
                <Button 
                  variant="outline" 
                  className="h-8 border-[#0BB248] text-[#0BB248] hover:text-[#0BB248] hover:bg-[#0BB248]/10 text-xs gap-1 px-3 bg-white"
                  onClick={handleCopyLink}
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-bold text-[#101828] mb-4">Share to your socials</p>
              <div className="flex items-center justify-center gap-4">
                {/* Social icons placeholders */}
                <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                  IG
                </button>
                <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                  TW
                </button>
                <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                  FB
                </button>
                <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                  TK
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" className="border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/10" onClick={() => setIsShareModalOpen(false)}>
                Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-lg">Referral Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="py-12 flex justify-center">
              <RefreshCw className="h-8 w-8 text-[#0BB248] animate-spin" />
            </div>
          ) : selectedReferral ? (
            <div className="space-y-6 pt-2">
              <p className="text-sm text-gray-500 text-center">This is an overview of the referral details of this user</p>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-semibold text-[#101828]">{selectedReferral.referee.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedReferral.status === 'completed' ? 'bg-[#0BB248]' : selectedReferral.status === 'pending' ? 'bg-[#F97316]' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium capitalize text-[#101828]">{selectedReferral.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Invited on</p>
                  <p className="text-sm font-semibold text-[#101828]">
                    {new Date(selectedReferral.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Joined on</p>
                  <p className="text-sm font-semibold text-[#101828]">
                    {new Date(selectedReferral.referee.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{selectedReferral.status === 'completed' ? 'Reward Earned' : 'Potential Reward'}</p>
                  <p className="text-sm font-bold text-[#0BB248]">
                    ₦{new Intl.NumberFormat('en-NG').format(selectedReferral.amountEarned || 2000)} {selectedReferral.status !== 'completed' && <span className="text-xs text-gray-500 font-normal">(Estimated)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reward Status</p>
                  <div className="flex items-center gap-1.5">
                    {selectedReferral.rewardIssued ? (
                      <>
                        <div className="h-4 w-4 rounded-sm bg-[#0BB248] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[#101828]">Paid</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-sm bg-red-100 flex items-center justify-center">
                          <X className="h-3 w-3 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-[#101828]">Not Yet Earned</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-[#101828]">
                  First sale : <span className="font-normal">{selectedReferral.completedAt ? new Date(selectedReferral.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Completed.'}</span>
                </p>
                
                <div>
                  <p className="text-sm font-bold text-[#101828] mb-4">Referral Timeline</p>
                  
                  {/* Timeline */}
                  <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                    {/* Invite Sent */}
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#0BB248] flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <p className="text-sm font-bold text-[#101828]">Invite Sent</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Sent on {new Date(selectedReferral.createdAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    
                    {/* Signed Up */}
                    <div className="relative pl-6">
                      <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center ${selectedReferral.referee.registeredAt ? 'bg-[#0BB248]' : 'bg-gray-200'}`}>
                        {selectedReferral.referee.registeredAt && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <p className={`text-sm font-bold ${selectedReferral.referee.registeredAt ? 'text-[#101828]' : 'text-gray-400'}`}>Signed Up</p>
                      {selectedReferral.referee.registeredAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Signed Up on {new Date(selectedReferral.referee.registeredAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      )}
                    </div>
                    
                    {/* First Sale (if applicable, based on completedAt) */}
                    <div className="relative pl-6">
                      <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center ${selectedReferral.completedAt ? 'bg-[#0BB248]' : 'bg-gray-200'}`}>
                        {selectedReferral.completedAt && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <p className={`text-sm font-bold ${selectedReferral.completedAt ? 'text-[#101828]' : 'text-gray-400'}`}>First Sale</p>
                      {selectedReferral.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sold on {new Date(selectedReferral.completedAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      )}
                    </div>

                    {/* Reward Confirmed */}
                    <div className="relative pl-6">
                      <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center ${selectedReferral.rewardIssued ? 'bg-[#0BB248]' : 'bg-gray-200'}`}>
                        {selectedReferral.rewardIssued && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <p className={`text-sm font-bold ${selectedReferral.rewardIssued ? 'text-[#101828]' : 'text-gray-400'}`}>Reward Confirmed</p>
                      {selectedReferral.rewardIssued && (
                        <p className="text-xs text-gray-500 mt-1">
                          Received reward on {new Date(selectedReferral.completedAt || selectedReferral.createdAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  className="bg-[#0BB248] hover:bg-[#0a9a3d] text-white px-8" 
                  onClick={() => setIsDetailsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-500">Failed to load details</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
