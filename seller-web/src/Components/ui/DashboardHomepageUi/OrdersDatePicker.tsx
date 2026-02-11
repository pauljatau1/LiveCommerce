import { useState, useRef } from 'react';
import { Popover, DatePicker, ConfigProvider } from 'antd';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Dayjs } from 'dayjs';
import type { ThemeConfig } from 'antd';
import { useDevice } from '@/Contexts/DeviceContext';

const { RangePicker } = DatePicker;

// Brand color theme configuration for DatePicker
const datePickerTheme: ThemeConfig = {
  token: {
    colorPrimary: '#16783A',
    colorLink: '#16783A',
    colorLinkHover: '#1a8a44',
    borderRadius: 6,
  },
  components: {
    DatePicker: {
      colorPrimary: '#16783A',
      colorPrimaryHover: '#1a8a44',
      activeBorderColor: '#16783A',
      hoverBorderColor: '#16783A',
      cellActiveWithRangeBg: '#16783A',
      cellHoverWithRangeBg: 'rgba(22, 120, 58, 0.1)',
    },
  },
};

interface OrdersDatePickerProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

const OrdersDatePicker: React.FC<OrdersDatePickerProps> = ({ onDateRangeChange }) => {
  const { isMobile } = useDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [displayText, setDisplayText] = useState('This Month');

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleDateRangeChange = (dates: null | (Dayjs | null)[]) => {
    if (dates) {
      setDateRange([dates[0], dates[1]]);
      
      // Update display text
      if (dates[0] && dates[1]) {
        const start = dates[0].format('MMM D');
        const end = dates[1].format('MMM D, YYYY');
        setDisplayText(`${start} - ${end}`);
        
        // Notify parent component
        onDateRangeChange(dates[0].toISOString(), dates[1].toISOString());
      } else {
        setDisplayText('This Month');
        onDateRangeChange(null, null);
      }
      
      setOpen(false);
    } else {
      setDateRange([null, null]);
      setDisplayText('This Month');
      onDateRangeChange(null, null);
    }
  };

  const content = (
    <div className={`${isMobile ? 'p-1' : 'p-2'}`}>
      <RangePicker
        value={dateRange}
        onChange={handleDateRangeChange}
        format="YYYY-MM-DD"
        className="w-full"
        allowClear
        size={isMobile ? 'small' : 'middle'}
        popupStyle={isMobile ? {
          width: 'calc(100vw - 32px)',
          maxWidth: '100%',
        } : undefined}
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
      />
    </div>
  );

  return (
    <ConfigProvider theme={datePickerTheme}>
      <div ref={containerRef} className="w-full">
        <Popover
          content={content}
          trigger="click"
          open={open}
          onOpenChange={handleOpenChange}
          placement={isMobile ? 'bottom' : 'bottomRight'}
          getPopupContainer={() => containerRef.current || document.body}
          overlayInnerStyle={{
            maxWidth: isMobile ? 'calc(100vw - 16px)' : 'auto',
            width: isMobile ? 'calc(100vw - 56px)' : 'auto',
            padding: isMobile ? '8px' : '12px',
          }}
          overlayStyle={{
            maxWidth: isMobile ? '100vw' : 'none',
          }}
        >
        <div className="w-full h-10 px-0.5 bg-neutral-50 rounded-xl border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex-1 px-2 flex justify-center items-center">
            <div className="flex-1 text-gray-600 text-sm font-normal font-['Lexend'] truncate">
              {displayText}
            </div>
          </div>
          <div className="p-3 bg-zinc-100 rounded-tl-md rounded-tr-[10px] rounded-bl-md rounded-br-[10px] flex justify-center items-center">
            <CalendarIcon className="w-3 h-3 text-gray-600" />
          </div>
        </div>
        </Popover>
      </div>
      <style>{`
        .ant-picker-dropdown {
          max-width: 100vw !important;
        }
        @media (max-width: 640px) {
          .ant-picker-dropdown {
            width: calc(100vw - 16px) !important;
            max-width: calc(100vw - 16px) !important;
            left: 8px !important;
            right: 8px !important;
            position: fixed !important;
          }
          .ant-picker-panel-container {
            width: 100% !important;
            max-width: 100% !important;
          }
          .ant-picker-panels {
            flex-direction: column !important;
            width: 100% !important;
          }
          .ant-picker-panel {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .ant-picker-date-panel {
            width: 100% !important;
          }
          .ant-picker-body {
            padding: 8px 4px !important;
          }
          .ant-picker-cell {
            min-width: calc((100% - 48px) / 7) !important;
            height: 36px !important;
            padding: 2px !important;
          }
          .ant-picker-cell-inner {
            width: 100% !important;
            height: 100% !important;
            line-height: 32px !important;
            font-size: 13px !important;
          }
          .ant-picker-header {
            padding: 8px 4px !important;
            border-bottom: 1px solid #f0f0f0 !important;
          }
          .ant-picker-header-view {
            font-size: 14px !important;
          }
          .ant-picker-prev-icon,
          .ant-picker-next-icon {
            font-size: 12px !important;
          }
          .ant-picker-input {
            font-size: 14px !important;
          }
          .ant-picker-input input {
            font-size: 14px !important;
            padding: 4px 8px !important;
          }
        }
        .ant-picker-dropdown .ant-picker-cell-selected .ant-picker-cell-inner {
          background-color: #16783A !important;
        }
        .ant-picker-dropdown .ant-picker-cell:hover .ant-picker-cell-inner {
          background-color: rgba(22, 120, 58, 0.1) !important;
        }
        .ant-picker-dropdown .ant-picker-today .ant-picker-cell-inner {
          border-color: #16783A !important;
        }
        .ant-picker-dropdown .ant-picker-header-view button:hover {
          color: #16783A !important;
        }
        .ant-picker-dropdown .ant-picker-prev-icon,
        .ant-picker-dropdown .ant-picker-next-icon {
          color: #16783A !important;
        }
        .ant-picker-dropdown .ant-picker-prev-icon:hover,
        .ant-picker-dropdown .ant-picker-next-icon:hover {
          color: #1a8a44 !important;
        }
        .ant-picker-range .ant-picker-active-bar {
          background: #16783A !important;
        }
        .ant-picker-dropdown .ant-picker-cell-in-range::before {
          background-color: rgba(22, 120, 58, 0.1) !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default OrdersDatePicker;

