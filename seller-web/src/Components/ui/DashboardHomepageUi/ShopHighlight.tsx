import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sellerService } from '@/services/sellerService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type Dayjs } from 'dayjs';
import { Popover, Box } from '@mui/material';
import CalendarIcon from '@/assets/icons/CalendarIcon';
import EmptyProductsIcon from '@/assets/icons/EmptyProductsIcon';
import { Skeleton } from '@/Components/shared/Skeleton';
import type { TopSoldProducts } from '@/types/seller';
import GlassImage from '@/Components/ui/GlassImageV2';

type DateRange = [Dayjs | null, Dayjs | null];

export default function ShopHighlight() {
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('This Month');

  const { data: products, isPending } = useQuery({
    queryKey: ['topSellingProducts'],
    queryFn: () => sellerService.fetchTopSoldProducts()
  });

  // Cast products to array since API returns array but type says single object
  const productsArray = (Array.isArray(products) ? products : (products ? [products] : [])) as TopSoldProducts[];

  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handleStartDateChange = (newValue: Dayjs | null) => {
    const newRange: DateRange = [newValue, dateRange[1]];
    setDateRange(newRange);
    if (newValue && newRange[1]) {
      handleDateRangeComplete(newRange);
    }
  };

  const handleEndDateChange = (newValue: Dayjs | null) => {
    const newRange: DateRange = [dateRange[0], newValue];
    setDateRange(newRange);
    if (newRange[0] && newValue) {
      handleDateRangeComplete(newRange);
    }
  };

  const handleDateRangeComplete = (range: DateRange) => {
    if (range[0] && range[1]) {
      console.log('Date Range Selected:', {
        start: range[0].format('YYYY-MM-DD'),
        end: range[1].format('YYYY-MM-DD')
      });
      // Format the period display
      const startMonth = range[0].format('MMM');
      const endMonth = range[1].format('MMM');
      if (startMonth === endMonth) {
        setSelectedPeriod(range[0].format('MMM YYYY'));
      } else {
        setSelectedPeriod(`${startMonth} - ${endMonth} ${range[1].format('YYYY')}`);
      }
    }
  };

  const calendarOpen = Boolean(calendarAnchorEl);
  const calendarId = calendarOpen ? 'date-range-calendar-popover' : undefined;


  return (
    <div className="w-full p-6 border border-solid border-[#EDF2F7] bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] transition-shadow hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] flex flex-col gap-2.5">
      {/* Header */}
      <div className="w-full flex justify-start items-center gap-2.5">
        <div className="flex-1 flex justify-start items-center gap-4 sm:gap-8 lg:gap-56">
          <div className="flex-1 inline-flex flex-col justify-center items-start gap-6 xl:gap-4">
            <div className="w-full h-5 relative">
              <h2 className="text-zinc-800 text-xl sm:text-2xl font-semibold font-['Lexend'] leading-8">
                Shop Highlights
              </h2>
              <div className="absolute right-0 top-[2px] bg-neutral-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex justify-between items-center">
                <div className="flex-1 px-2 flex justify-center items-center gap-2.5">
                  <span className="text-gray-600 text-xs sm:text-sm font-normal font-['Lexend']">
                    {selectedPeriod}
                  </span>
                </div>
                <button
                  onClick={handleCalendarClick}
                  className="p-2 sm:p-3 bg-zinc-100 rounded-tl-md rounded-tr-[10px] rounded-bl-md rounded-br-[10px] flex justify-center items-center gap-2.5 overflow-hidden hover:bg-zinc-200 transition-colors"
                  aria-label="Select date range"
                >
                  <CalendarIcon width={14} height={14} color="#4B5563" />
                </button>
              </div>
            </div>
            <p className="w-full text-[#7A828A] text-xs lg:text-sm 5xl:text-base font-normal font-['Lexend']">
              Business snapshot of your top products this month
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full py-4 flex flex-col justify-center items-center gap-4">
        {isPending ? (
          // Loading Skeleton
          <div className="w-full flex flex-col gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="w-full inline-flex justify-start items-start gap-2">
                <Skeleton className="w-11 h-11 rounded-[58px]" />
                <div className="flex-1 inline-flex flex-col justify-center items-start gap-2.5">
                  <div className="w-full h-9 flex flex-col justify-center items-start">
                    <div className="w-full inline-flex justify-start items-center gap-2">
                      <Skeleton className="flex-1 h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : productsArray.length > 0 ? (
          // Highlights List - All Products
          <div className="w-full flex flex-col justify-start items-start gap-3">
            {productsArray.map((product, index) => (
              <React.Fragment key={product._id || index}>
                <div className="w-full inline-flex justify-start items-start gap-2 hover:bg-gray-100/80 cursor-pointer hover:backdrop-blur-sm rounded-lg p-2 transition-all duration-300 ease-in-out">
                  <GlassImage
                    src={product?.images?.[0]?.url || 'https://placehold.co/46x46'}
                    alt={product?.name || 'Product'}
                    containerClassName="w-12 h-12 rounded-[58px] object-cover flex-shrink-0"
                    imageClassName="w-12 h-12 rounded-[58px] object-cover"
                  />
                  <div className="flex-1 inline-flex flex-col justify-center items-start gap-2.5 min-w-0">
                    <div className="w-full flex flex-col justify-center items-start">
                      <div className="w-full inline-flex justify-between items-center gap-2">
                        <div className="flex-1 text-zinc-800 text-xs lg:text-sm 5xl:text-base font-semibold font-['Lexend'] leading-6 line-clamp-2 min-w-0 max-w-[140px] md:max-w-[300px] ">
                          {product?.name || ''}
                        </div>
                        <div className="inline-flex flex-col justify-center items-start gap-2.5 flex-shrink-0">
                          <div className="px-2 py-0.5 bg-indigo-50 rounded-md flex flex-col justify-start items-center gap-2.5">
                            <div className="p-0.5 inline-flex justify-start items-center gap-1.5">
                              <div className="text-slate-500 text-[10px] font-bold font-['Lexend'] leading-4 whitespace-nowrap">
                                {product?.stats?.soldCount || 0} Sold
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {index < productsArray.length - 1 && (
                  <div className="w-full h-px bg-slate-100" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="w-full flex flex-col items-center justify-center gap-4 py-8 min-h-[256px]">
            <div className="relative">
              <div className="w-[88px] h-[88px] border-2 border-dashed border-blue-200 rounded-lg flex items-center justify-center">
                <EmptyProductsIcon width={88} height={88} color="#A9A9A9" />
              </div>
            </div>
            <p className="text-base font-medium text-[#425466] font-['Lexend']">
              No Products sold yet!
            </p>
          </div>
        )}
      </div>

      {/* Date Range Calendar Popover */}
      <Popover
        id={calendarId}
        open={calendarOpen}
        anchorEl={calendarAnchorEl}
        onClose={handleCalendarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0px 3px 8px -1px rgba(50,50,71,0.05), 0px 0px 1px 0px rgba(12,26,75,0.24)',
            mt: 1,
            p: 2,
            '& .MuiButton-root': {
              color: '#16a34a',
              '&:hover': {
                backgroundColor: '#dcfce7',
              },
              '&.MuiButton-textPrimary': {
                color: '#16a34a',
              },
            },
            '& .MuiPickersActionBar-actionButton': {
              color: '#16a34a',
              '&:hover': {
                backgroundColor: '#dcfce7',
              },
            },
            '& .MuiPickersLayout-actionBar .MuiButton-root': {
              color: '#16a34a',
              '&:hover': {
                backgroundColor: '#dcfce7',
              },
            },
            '& .MuiPickersYear-yearButton': {
              '&.Mui-selected': {
                backgroundColor: '#16a34a !important',
                color: '#fff !important',
                '&:hover': {
                  backgroundColor: '#15803d !important',
                },
                '&:focus': {
                  backgroundColor: '#16a34a !important',
                },
              },
              '&:hover': {
                backgroundColor: '#dcfce7',
              },
            },
            '& .MuiPickersMonth-monthButton': {
              '&.Mui-selected': {
                backgroundColor: '#16a34a !important',
                color: '#fff !important',
                '&:hover': {
                  backgroundColor: '#15803d !important',
                },
                '&:focus': {
                  backgroundColor: '#16a34a !important',
                },
              },
              '&:hover': {
                backgroundColor: '#dcfce7',
              },
            },
            '& .MuiPickersCalendarHeader-switchViewButton': {
              color: '#27272E',
              '&:hover': {
                backgroundColor: '#dcfce7',
                color: '#16a34a',
              },
            },
            '& .MuiPickersYear-yearButton.Mui-selected': {
              backgroundColor: '#16a34a !important',
              color: '#fff !important',
            },
            '& .MuiPickersMonth-monthButton.Mui-selected': {
              backgroundColor: '#16a34a !important',
              color: '#fff !important',
            },
            '& .MuiDialog-root': {
              '& .MuiPickersYear-yearButton.Mui-selected': {
                backgroundColor: '#16a34a !important',
                color: '#fff !important',
              },
              '& .MuiPickersMonth-monthButton.Mui-selected': {
                backgroundColor: '#16a34a !important',
                color: '#fff !important',
              },
              '& .MuiButton-root': {
                color: '#16a34a',
                '&.MuiButton-textPrimary': {
                  color: '#16a34a',
                },
              },
            },
            '& .MuiModal-root': {
              '& .MuiPickersYear-yearButton.Mui-selected': {
                backgroundColor: '#16a34a !important',
                color: '#fff !important',
              },
              '& .MuiPickersMonth-monthButton.Mui-selected': {
                backgroundColor: '#16a34a !important',
                color: '#fff !important',
              },
              '& .MuiButton-root': {
                color: '#16a34a',
                '&.MuiButton-textPrimary': {
                  color: '#16a34a',
                },
              },
            },
          },
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <DatePicker
              label="Start Date"
              value={dateRange[0]}
              onChange={handleStartDateChange}
              maxDate={dateRange[1] || undefined}
              desktopModeMediaQuery="@media (pointer: fine)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#E5E7EB',
                  },
                  '&:hover fieldset': {
                    borderColor: '#16a34a',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#16a34a !important',
                    borderWidth: '1px',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#16a34a',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#16a34a !important',
                },
                '& .MuiPickersYear-yearButton': {
                  '&.Mui-selected': {
                    backgroundColor: '#16a34a !important',
                    color: '#fff !important',
                    '&:hover': {
                      backgroundColor: '#15803d !important',
                    },
                    '&:focus': {
                      backgroundColor: '#16a34a !important',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#dcfce7',
                  },
                },
                '& .MuiPickersMonth-monthButton': {
                  '&.Mui-selected': {
                    backgroundColor: '#16a34a !important',
                    color: '#fff !important',
                    '&:hover': {
                      backgroundColor: '#15803d !important',
                    },
                    '&:focus': {
                      backgroundColor: '#16a34a !important',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#dcfce7',
                  },
                },
              }}
              slotProps={{
                textField: {
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E5E7EB',
                      },
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a !important',
                        borderWidth: '1px',
                      },
                    },
                  },
                },
                popper: {
                  sx: {
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                    '& .MuiPickersActionBar-actionButton': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersYear-yearButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersMonth-monthButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                  },
                },
                mobilePaper: {
                  sx: {
                    '& .MuiPickersYear-yearButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersMonth-monthButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                    '& .MuiPickersActionBar-actionButton': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                  },
                },
                dialog: {
                  sx: {
                    '& .MuiPickersYear-yearButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersMonth-monthButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                    '& .MuiPickersActionBar-actionButton': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                  },
                },
                calendarHeader: {
                  sx: {
                    '& .MuiPickersCalendarHeader-label': {
                      color: '#27272E',
                      fontWeight: 600,
                    },
                    '& .MuiPickersArrowSwitcher-button': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersCalendarHeader-switchViewButton': {
                      color: '#27272E',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                      },
                    },
                  },
                },
                day: {
                  sx: {
                    '&.Mui-selected': {
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#15803d',
                      },
                      '&:focus': {
                        backgroundColor: '#16a34a',
                      },
                    },
                    '&.MuiPickersDay-today': {
                      border: '1px solid #16a34a',
                      color: '#16a34a',
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: '1px solid #16a34a',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#dcfce7',
                    },
                  },
                },
                actionBar: {
                  sx: {
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                  },
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={dateRange[1]}
              onChange={handleEndDateChange}
              minDate={dateRange[0] || undefined}
              desktopModeMediaQuery="@media (pointer: fine)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#E5E7EB',
                  },
                  '&:hover fieldset': {
                    borderColor: '#16a34a',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#16a34a !important',
                    borderWidth: '1px',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#16a34a',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#16a34a !important',
                },
                '& .MuiPickersYear-yearButton': {
                  '&.Mui-selected': {
                    backgroundColor: '#16a34a !important',
                    color: '#fff !important',
                    '&:hover': {
                      backgroundColor: '#15803d !important',
                    },
                    '&:focus': {
                      backgroundColor: '#16a34a !important',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#dcfce7',
                  },
                },
                '& .MuiPickersMonth-monthButton': {
                  '&.Mui-selected': {
                    backgroundColor: '#16a34a !important',
                    color: '#fff !important',
                    '&:hover': {
                      backgroundColor: '#15803d !important',
                    },
                    '&:focus': {
                      backgroundColor: '#16a34a !important',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#dcfce7',
                  },
                },
              }}
              slotProps={{
                textField: {
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E5E7EB',
                      },
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a !important',
                        borderWidth: '1px',
                      },
                    },
                  },
                },
                popper: {
                  sx: {
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                    '& .MuiPickersActionBar-actionButton': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersYear-yearButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersMonth-monthButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                  },
                },
                mobilePaper: {
                  sx: {
                    '& .MuiPickersYear-yearButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersMonth-monthButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                    '& .MuiPickersActionBar-actionButton': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                  },
                },
                dialog: {
                  sx: {
                    '& .MuiPickersYear-yearButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersMonth-monthButton': {
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a !important',
                        color: '#fff !important',
                        '&:hover': {
                          backgroundColor: '#15803d !important',
                        },
                        '&:focus': {
                          backgroundColor: '#16a34a !important',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                    '& .MuiPickersActionBar-actionButton': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                  },
                },
                calendarHeader: {
                  sx: {
                    '& .MuiPickersCalendarHeader-label': {
                      color: '#27272E',
                      fontWeight: 600,
                    },
                    '& .MuiPickersArrowSwitcher-button': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                    },
                    '& .MuiPickersCalendarHeader-switchViewButton': {
                      color: '#27272E',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                      },
                    },
                  },
                },
                day: {
                  sx: {
                    '&.Mui-selected': {
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#15803d',
                      },
                      '&:focus': {
                        backgroundColor: '#16a34a',
                      },
                    },
                    '&.MuiPickersDay-today': {
                      border: '1px solid #16a34a',
                      color: '#16a34a',
                      '&.Mui-selected': {
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: '1px solid #16a34a',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#dcfce7',
                    },
                  },
                },
                actionBar: {
                  sx: {
                    '& .MuiButton-root': {
                      color: '#16a34a',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                      },
                      '&.MuiButton-textPrimary': {
                        color: '#16a34a',
                      },
                    },
                  },
                },
              }}
            />
          </Box>
        </LocalizationProvider>
      </Popover>
    </div>
  );
}
