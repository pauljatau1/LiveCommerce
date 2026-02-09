import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useDevice } from '@/Contexts/DeviceContext';
import { orderService } from '@/services/orderService';
import type { SellerOrders } from '@/types';
import DesktopOrdersTable from './DesktopOrdersTable';
import MobileOrdersCards from './MobileOrdersCards';
import OrdersDatePicker from './OrdersDatePicker';

export default function DashboardOrdersSection() {
  const navigate = useNavigate();
  const { isDesktop } = useDevice();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });

  // Fetch paginated orders
  const { data, isLoading } = useQuery<SellerOrders>({
    queryKey: ['paginatedOrders', currentPage, pageSize, dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      orderService.fetchPaginatedOrders(
        currentPage,
        pageSize,
        dateRange.startDate || undefined,
        dateRange.endDate || undefined
      ),
    placeholderData: (previousData) => previousData,
  });

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setDateRange({ startDate, endDate });
    setCurrentPage(1); // Reset to first page when date range changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const orders = data?.data?.orders || [];
  const totalOrders = data?.pagination?.totalOrders || 0;

  return (
    <section className="mt-4 lg:mt-8 w-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-4 lg:px-6 lg:py-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-zinc-800 text-xl lg:text-2xl font-semibold font-['Lexend'] leading-8">
            Latest Orders
          </h2>
          <p className="text-[#64748B] text-sm lg:text-base font-normal font-['Lexend'] mt-1">
            Manage and track your recent orders
          </p>
        </div>

        <div className="flex flex-col border border-solid border-[#C6C6C6] px-[16px] py-[7.5px] rounded-sm sm:flex-row w-full lg:w-auto gap-2 lg:gap-3">
          {/* Date Picker */}
          <OrdersDatePicker onDateRangeChange={handleDateRangeChange} />

          {/* View All Button */}
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="w-full sm:w-auto px-6 py-3 bg-white rounded-lg border border-green-600 flex justify-center items-center gap-2.5 whitespace-nowrap hover:bg-green-50 transition-colors"
          >
            <span className="text-green-600 text-sm font-semibold font-['Montserrat'] leading-4">
              View all
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-green-600" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden">
        {isDesktop ? (
          <DesktopOrdersTable
            orders={orders}
            loading={isLoading}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalOrders,
              onChange: handlePageChange,
            }}
          />
        ) : (
          <div className="p-4">
            <MobileOrdersCards orders={orders} loading={isLoading} />
          </div>
        )}
      </div>
    </section>
  );
}
