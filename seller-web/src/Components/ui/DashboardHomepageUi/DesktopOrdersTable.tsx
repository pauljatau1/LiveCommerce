import React, { useState } from 'react';
import { Table, Tag, ConfigProvider, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { Radio, ShoppingBag, Copy, Check, Video, Tv } from 'lucide-react';
import type { Order } from '@/types';
import type { ThemeConfig } from 'antd';

interface DesktopOrdersTableProps {
  orders: Order[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

// Status color mapping
const getShippingStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    cancelled: '#DC2626',
    'to-process': '#F59E0B',
    'in-transit': '#EAB308',
    delivered: '#10B981',
    confirmed: '#3B82F6',
    pending: '#F59E0B',
    failed: '#DC2626',
  };
  return statusColors[status] || '#6B7280';
};

const getPaymentStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    refunded: '#3B82F6',
    pending: '#EAB308',
    paid: '#10B981',
    failed: '#DC2626',
  };
  return statusColors[status] || '#6B7280';
};

const getOrderStatusColor = (isCompleted: boolean): string => {
  return isCompleted ? '#10B981' : '#EF4444';
};

// Brand color theme configuration
const brandTheme: ThemeConfig = {
  token: {
    colorPrimary: '#16783A',
    colorLink: '#16783A',
    colorLinkHover: '#1a8a44',
    borderRadius: 6,
  },
  components: {
    Table: {
      borderColor: '#EDF2F7',
      headerBg: '#FAFAFA',
      headerColor: '#94A3B8',
    },
    Pagination: {
      itemActiveBg: '#16783A',
      itemInputBg: '#fff',
    },
    DatePicker: {
      colorPrimary: '#16783A',
      colorPrimaryHover: '#1a8a44',
      activeBorderColor: '#16783A',
      hoverBorderColor: '#16783A',
    },
  },
};

const DesktopOrdersTable: React.FC<DesktopOrdersTableProps> = ({
  orders,
  loading,
  pagination,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedId(orderId);
      message.success('Order ID copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      message.error('Failed to copy order ID');
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'ORDER DETAILS',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (_: unknown, record: Order) => (
        <div className="space-y-1">
          <div
            onClick={() => handleCopyOrderId(record?.order_id)}
            className="text-blue-500 text-sm font-normal font-['Lexend'] cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1.5 group"
            title="Click to copy order ID"
          >
            <span>{record?.order_id}</span>
            {copiedId === record?.order_id ? (
              <Check className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="text-slate-600 text-sm font-normal font-['Lexend']">
            {new Date(record?.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      title: 'CUSTOMER',
      dataIndex: 'buyer',
      key: 'customer',
      render: (_: unknown, record: Order) => (
        <div className="text-slate-600 text-xs font-semibold font-['Lexend'] capitalize">
          {`${record?.buyer?.firstName || 'unknown'} ${record?.buyer?.lastName || 'unknown'}`}
        </div>
      ),
    },
    {
      title: 'PRODUCT',
      dataIndex: 'items',
      key: 'product',
      render: (items: Order['items']) => (
        <div className="space-y-1">
          {items.slice(0, 2).map((item, index) => (
            <div
              key={index}
              className="text-slate-600 text-sm font-normal font-['Lexend'] capitalize"
            >
              {item.productName.length > 20
                ? `${item.productName.slice(0, 20)}...`
                : item.productName}
            </div>
          ))}
          {items.length > 2 && (
            <div className="text-slate-500 text-xs">
              +{items.length - 2} more
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'SHIPPING',
      dataIndex: 'shipping',
      key: 'shipping',
      render: (_: unknown, record: Order) => {
        const status = record?.isStale
          ? 'abandoned'
          : record.shipping?.tracking?.status || 'pending';
        return (
          <Tag
            color={getShippingStatusColor(status)}
            className="px-2 py-0.5 rounded-md font-['Lexend'] text-[10px] font-bold uppercase"
          >
            {status.replace('_', ' ').replace('-', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'PAYMENT',
      dataIndex: 'paymentInfo',
      key: 'payment',
      render: (_: unknown, record: Order) => {
        const status = record?.isStale
          ? 'abandoned'
          : record?.paymentInfo?.status || 'pending';
        const displayText =
          status === 'awaiting_cod' ? 'COD' : status.replace('_', ' ');
        return (
          <Tag
            color={getPaymentStatusColor(status)}
            className="px-2 py-0.5 rounded-md font-['Lexend'] text-[10px] font-bold uppercase"
          >
            {displayText}
          </Tag>
        );
      },
    },
    {
      title: 'AMOUNT',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount: number) => (
        <div className="text-slate-600 text-sm font-normal font-['Lexend']">
          <span className="line-through">N</span> {amount.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'CHANNEL',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => {
        const isBlips = channel?.toLowerCase() === 'blips' || channel?.toLowerCase() === 'livestream';
        const isShop = channel?.toLowerCase() === 'shop' || channel?.toLowerCase() === 'marketplace';
        const isLive = channel?.toLowerCase() === 'live' || channel?.toLowerCase() === 'liveshow';
        
        return (
          <div className="flex items-center gap-2">
            {isBlips && <Tv className="w-4 h-4 text-green-500" />}
            {isShop && <ShoppingBag className="w-4 h-4 text-blue-500" />}
            {isLive && <Radio className="w-4 h-4 text-rose-600" />}
            <span
              className={`text-sm font-normal font-['Lexend'] capitalize ${
                isBlips ? 'text-green-500' : isShop ? 'text-blue-500' : isLive ? 'text-rose-600' : 'text-gray-500'
              }`}
            >
              {isBlips ? 'Blips' : isShop ? 'Shop' : channel}
            </span>
          </div>
        );
      },
    },
    {
      title: 'ORDER STATUS',
      dataIndex: 'status',
      key: 'orderStatus',
      render: (_: unknown, record: Order) => {
        const isCompleted = !record?.isOpen && record?.closedAt;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getOrderStatusColor(Boolean(isCompleted)) }}
            />
            <span className="text-slate-600 text-sm font-normal font-['Lexend'] capitalize">
              {isCompleted ? 'Completed' : record?.isStale ? 'Abandoned' : 'Pending'}
            </span>
          </div>
        );
      },
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Link to={`/dashboard/order/${record?._id}`}>
          <button className="px-4 py-2 rounded border border-green-600 text-green-600 text-[10px] font-semibold font-['Lexend'] hover:bg-green-50 transition-colors">
            View
          </button>
        </Link>
      ),
    },
  ];

  return (
    <ConfigProvider theme={brandTheme}>
      <div className="w-full">
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: pagination.onChange,
            showSizeChanger: false,
            position: ['bottomCenter'],
          }}
          rowKey="_id"
          className="orders-table"
          scroll={{ x: 'max-content' }}
        />
        <style>{`
          .orders-table .ant-table {
            border: 1px solid #EDF2F7;
          }
          .orders-table .ant-table-thead > tr > th {
            background-color: #FAFAFA;
            color: #94A3B8;
            font-size: 10px;
            font-weight: 600;
            font-family: 'Lexend', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #EDF2F7;
            border-right: 1px solid #EDF2F7;
            padding: 18px 24px;
          }
          .orders-table .ant-table-thead > tr > th:last-child {
            border-right: none;
          }
          .orders-table .ant-table-tbody > tr > td {
            background-color: white;
            border-bottom: 1px solid #EDF2F7;
            border-right: 1px solid #EDF2F7;
            padding: 16px 24px;
          }
          .orders-table .ant-table-tbody > tr > td:last-child {
            border-right: none;
          }
          .orders-table .ant-table-tbody > tr:hover > td {
            background-color: #F9FAFB;
          }
          .orders-table .ant-pagination {
            margin-top: 24px;
          }
          .orders-table .ant-pagination .ant-pagination-item-active {
            background-color: #16783A;
            border-color: #16783A;
          }
          .orders-table .ant-pagination .ant-pagination-item-active a {
            color: #fff;
          }
          .orders-table .ant-pagination .ant-pagination-item:hover {
            border-color: #16783A;
          }
          .orders-table .ant-pagination .ant-pagination-item:hover a {
            color: #16783A;
          }
          .orders-table .ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
          .orders-table .ant-pagination .ant-pagination-next:hover .ant-pagination-item-link {
            border-color: #16783A;
            color: #16783A;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default DesktopOrdersTable;

