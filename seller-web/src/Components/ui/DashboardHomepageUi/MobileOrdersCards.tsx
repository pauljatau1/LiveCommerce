import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Radio, ShoppingBag } from 'lucide-react';
import type { Order } from '@/types';

interface MobileOrdersCardsProps {
  orders: Order[];
  loading: boolean;
}

const getShippingStatusStyle = (status: string): string => {
  const statusStyles: Record<string, string> = {
    cancelled: 'bg-red-600/20 text-red-600/70',
    'to-process': 'bg-amber-100/80 text-amber-500/80',
    'in-transit': 'bg-yellow-50 text-yellow-500',
    delivered: 'bg-green-100 text-emerald-300',
    confirmed: 'bg-blue-500/20 text-blue-500',
    pending: 'bg-yellow-50 text-yellow-500',
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-600';
};

const getPaymentStatusStyle = (status: string): string => {
  const statusStyles: Record<string, string> = {
    refunded: 'bg-blue-500/20 text-blue-500',
    pending: 'bg-yellow-50 text-yellow-500',
    paid: 'bg-green-100 text-emerald-300',
    failed: 'bg-red-600/20 text-red-600/70',
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-600';
};

const MobileOrdersCards: React.FC<MobileOrdersCardsProps> = ({ orders, loading }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (orderId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16783A]"></div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders found
      </div>
    );
  }

  // Show only first 4 orders for mobile
  const displayOrders = orders.slice(0, 4);

  return (
    <div className="space-y-3">
      {displayOrders.map((order) => {
        const isExpanded = expandedCards.has(order._id);
        const shippingStatus = order.isStale
          ? 'abandoned'
          : order.shipping?.tracking?.status || 'pending';
        const paymentStatus = order.isStale
          ? 'abandoned'
          : order.paymentInfo?.status || 'pending';
        const isBlips = order.channel.toLowerCase() === 'blips' || order.channel.toLowerCase() === 'livestream';
        const isShop = order.channel.toLowerCase() === 'shop' || order.channel.toLowerCase() === 'marketplace';
        const isCompleted = !order.isOpen && order.closedAt;

        return (
          <div
            key={order._id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Card Header - Always Visible */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleCard(order._id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-blue-500 text-sm font-medium font-['Lexend']">
                    {order.order_id}
                  </div>
                  <div className="text-slate-600 text-xs font-normal font-['Lexend'] mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCompleted ? 'bg-emerald-300' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-xs text-slate-600 font-['Lexend']">
                    {isCompleted ? 'Completed' : order.isStale ? 'Abandoned' : 'Pending'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 font-['Lexend']">Customer</div>
                  <div className="text-sm font-medium text-slate-600 font-['Lexend'] capitalize truncate">
                    {`${order.buyer.firstName} ${order.buyer.lastName}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-['Lexend']">Amount</div>
                  <div className="text-sm font-medium text-slate-600 font-['Lexend']">
                    <span className="line-through">N</span> {order.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
                {/* Products */}
                <div>
                  <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Products</div>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div
                        key={index}
                        className="text-sm text-slate-600 font-['Lexend'] capitalize"
                      >
                        {item.productName.length > 30
                          ? `${item.productName.slice(0, 30)}...`
                          : item.productName}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-xs text-slate-500">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping & Payment Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Shipping</div>
                    <div
                      className={`px-2 py-1 rounded-md inline-block ${getShippingStatusStyle(
                        shippingStatus
                      )}`}
                    >
                      <span className="text-[10px] font-bold font-['Lexend'] uppercase">
                        {shippingStatus.replace('_', ' ').replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Payment</div>
                    <div
                      className={`px-2 py-1 rounded-md inline-block ${getPaymentStatusStyle(
                        paymentStatus
                      )}`}
                    >
                      <span className="text-[10px] font-bold font-['Lexend'] uppercase">
                        {paymentStatus === 'awaiting_cod'
                          ? 'COD'
                          : paymentStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Channel */}
                <div>
                  <div className="text-xs text-gray-500 font-['Lexend'] mb-1">Channel</div>
                  <div className="flex items-center gap-2">
                    {isBlips && <Radio className="w-4 h-4 text-rose-600" />}
                    {isShop && <ShoppingBag className="w-4 h-4 text-blue-500" />}
                    <span
                      className={`text-sm font-normal font-['Lexend'] capitalize ${
                        isBlips ? 'text-rose-600' : 'text-blue-500'
                      }`}
                    >
                      {isBlips ? 'Blips' : isShop ? 'Shop' : order.channel}
                    </span>
                  </div>
                </div>

                {/* View Order Button */}
                <Link to={`/dashboard/order/${order._id}`}>
                  <button className="w-full mt-2 px-4 py-2 rounded border border-green-600 text-green-600 text-xs font-semibold font-['Lexend'] hover:bg-green-50 transition-colors">
                    View Order Details
                  </button>
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileOrdersCards;

