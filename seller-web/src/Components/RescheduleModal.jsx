import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from "@iconify/react";
import dayjs from 'dayjs';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { Switch } from '@mui/material';
import { useLivestreamContext } from '../Hooks/useLivestreamContext';
import { toast } from 'sonner';

const RescheduleModal = ({ isOpen, onClose, streamData }) => {
    const { rescheduleExpiredStream, isLoading } = useLivestreamContext();
    const [startDate, setStartDate] = useState(dayjs());
    const [startTime, setStartTime] = useState(dayjs());
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const [startImmediately, setStartImmediately] = useState(false);

    // Set initial values when modal opens
    useEffect(() => {
        if (isOpen && streamData) {
            const currentScheduledTime = dayjs(streamData.scheduledStartTime);
            setStartDate(currentScheduledTime);
            setStartTime(currentScheduledTime);
            setStartImmediately(false);
        }
    }, [isOpen, streamData]);

    const handleReschedule = async () => {
        try {
            let scheduledStartTime;
            
            if (startImmediately) {
                // Set to current time + 5 minutes to give some buffer
                scheduledStartTime = dayjs().add(5, 'minute').toISOString();
            } else {
                // Combine selected date and time
                const combinedDateTime = startDate
                    .hour(startTime.hour())
                    .minute(startTime.minute())
                    .second(0)
                    .millisecond(0);

                // Validate that the selected time is in the future
                if (combinedDateTime.isBefore(dayjs())) {
                    toast.error('Please select a future date and time');
                    return;
                }

                scheduledStartTime = combinedDateTime.toISOString();
            }

            await rescheduleExpiredStream(streamData.id, scheduledStartTime);
            toast.success('Stream rescheduled successfully!');
            onClose();
        } catch (error) {
            console.error('Error rescheduling stream:', error);
            toast.error('Failed to reschedule stream');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Reschedule Live Stream</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Icon icon="ph:x" className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Stream Information */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-medium text-gray-900">Stream Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Title:</span>
                                <p className="font-medium">{streamData?.title || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Category:</span>
                                <p className="font-medium">{streamData?.category || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Current Status:</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {streamData?.status || 'expired'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Previous Start Time:</span>
                                <p className="font-medium">
                                    {streamData?.scheduledStartTime 
                                        ? dayjs(streamData.scheduledStartTime).format('DD/MM/YYYY HH:mm')
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Live Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">New Schedule</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => !startImmediately && setDatePickerOpen(true)}
                                        className={`w-full relative text-left pl-10 pr-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                                            startImmediately ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                                        }`}
                                        disabled={startImmediately}
                                    >
                                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 flex rounded-tl-lg rounded-bl-lg items-center w-fit px-2 py-1 h-full justify-between ${
                                            startImmediately ? 'bg-gray-100 cursor-not-allowed' : 'bg-[#E9FCEF] hover:bg-[#D9F7E5]'
                                        }`}>
                                            <Icon icon="ph:calendar" className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <span className="block truncate text-sm">
                                            {startImmediately ? "Current Date" : startDate.format('DD/MM/YYYY')}
                                        </span>
                                    </button>

                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            open={datePickerOpen}
                                            onOpen={() => setDatePickerOpen(true)}
                                            onClose={() => setDatePickerOpen(false)}
                                            disabled={startImmediately}
                                            value={startDate}
                                            onChange={(newDate) => setStartDate(newDate)}
                                            format="DD/MM/YYYY"
                                            minDate={dayjs()}
                                            slotProps={{
                                                popper: {
                                                    disablePortal: true,
                                                    placement: 'left-start',
                                                    sx: {
                                                        position: 'absolute !important',
                                                        zIndex: 9999,
                                                        '& .MuiPaper-root': {
                                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                            borderRadius: '0.5rem',
                                                        },
                                                        '& .MuiPickersDay-root.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                        '& .MuiButton-root': {
                                                            color: '#0BB248',
                                                        },
                                                        '& .MuiPickersCalendarHeader-switchViewButton': {
                                                            color: '#0BB248',
                                                        },
                                                        '& .MuiPickersYear-yearButton.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                        '& .MuiPickersYear-yearButton.Mui-selected:hover': {
                                                            backgroundColor: '#0AA240',
                                                        },
                                                        '& .MuiPickersMonth-monthButton.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                        '& .MuiPickersMonth-monthButton.Mui-selected:hover': {
                                                            backgroundColor: '#0AA240',
                                                        }
                                                    }
                                                },
                                                day: {
                                                    sx: {
                                                        fontWeight: 'medium',
                                                        '&.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                            '&:hover': {
                                                                backgroundColor: '#0BB248',
                                                            },
                                                            '&:focus': {
                                                                backgroundColor: '#0BB248',
                                                            },
                                                        },
                                                    },
                                                },
                                                textField: {
                                                    // This is just for the hidden field
                                                    sx: {
                                                        position: 'absolute',
                                                        width: 0,
                                                        height: 0,
                                                        overflow: 'hidden'
                                                    }
                                                },
                                                actionBar: {
                                                    sx: {
                                                        '& .MuiButton-root': {
                                                            color: '#0BB248',
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">
                                    Start Time <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => !startImmediately && setTimePickerOpen(true)}
                                        className={`w-full relative text-left pl-10 pr-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                                            startImmediately ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                                        }`}
                                        disabled={startImmediately}
                                    >
                                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 flex rounded-tl-lg rounded-bl-lg items-center w-fit px-2 py-1 h-full justify-between ${
                                            startImmediately ? 'bg-gray-100 cursor-not-allowed' : 'bg-[#E9FCEF] hover:bg-[#D9F7E5]'
                                        }`}>
                                            <Icon icon="ph:clock" className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <span className="block truncate text-sm">
                                            {startImmediately ? "Current Time" : startTime.format('HH:mm')}
                                        </span>
                                    </button>

                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <TimePicker
                                            open={timePickerOpen}
                                            onOpen={() => setTimePickerOpen(true)}
                                            onClose={() => setTimePickerOpen(false)}
                                            disabled={startImmediately}
                                            value={startTime}
                                            onChange={(newTime) => setStartTime(newTime)}
                                            format="HH:mm"
                                            viewRenderers={{
                                                hours: renderTimeViewClock,
                                                minutes: renderTimeViewClock,
                                                seconds: renderTimeViewClock,
                                            }}
                                            slotProps={{
                                                popper: {
                                                    disablePortal: true,
                                                    placement: 'left-start',
                                                    sx: {
                                                        position: 'absolute !important',
                                                        zIndex: 9999,
                                                        '& .MuiPaper-root': {
                                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                            borderRadius: '0.5rem',
                                                        },
                                                        '& .MuiButtonBase-root.MuiIconButton-root:hover': {
                                                            backgroundColor: 'rgba(11, 178, 72, 0.04)',
                                                        },
                                                        '& .MuiClock-pin': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                        '& .MuiClockPointer-root': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                        '& .MuiClockPointer-thumb': {
                                                            backgroundColor: '#0BB248',
                                                            borderColor: '#0BB248',
                                                        },
                                                        '& .MuiButton-root': {
                                                            color: '#0BB248',
                                                        },
                                                        '& .MuiPickersDigitalClockClockNumber-root.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                        // Add direct styling for the AM/PM buttons
                                                        '& [role="toolbar"] button': {
                                                            '&[aria-pressed="true"]': {
                                                                backgroundColor: '#0BB248 !important',
                                                                color: 'white !important',
                                                            }
                                                        },
                                                        // More specific selectors for the AM/PM segment
                                                        '& .MuiPickersToolbar-root .MuiButton-root.Mui-selected': {
                                                            backgroundColor: '#0BB248 !important',
                                                            color: 'white !important',
                                                        },
                                                        '& .MuiButtonBase-root.Mui-selected': {
                                                            backgroundColor: '#0BB248 !important',
                                                            color: 'white !important',
                                                        },
                                                        // Additional selectors targeting the AM/PM buttons
                                                        '& .MuiTimeClock-ampmSelection .MuiButton-root.Mui-selected': {
                                                            backgroundColor: '#0BB248 !important',
                                                            color: 'white !important',
                                                        },
                                                        // Style the OK button in the actionBar
                                                        '& .MuiDialogActions-root .MuiButton-root': {
                                                            color: '#0BB248',
                                                        },
                                                        // Target all the toolbar buttons
                                                        '& .MuiTimePickerToolbar-ampmSelection button': {
                                                            '&.Mui-selected': {
                                                                backgroundColor: '#0BB248 !important',
                                                                color: 'white !important',
                                                            }
                                                        }
                                                    }
                                                },
                                                digital: {
                                                    sx: {
                                                        '& .MuiPickersDigitalClockClockNumber-root.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                    },
                                                },
                                                clock: {
                                                    sx: {
                                                        '& .MuiClockNumber-root.Mui-selected': {
                                                            backgroundColor: '#0BB248',
                                                        },
                                                    },
                                                },
                                                textField: {
                                                    // This is just for the hidden field
                                                    sx: {
                                                        position: 'absolute',
                                                        width: 0,
                                                        height: 0,
                                                        overflow: 'hidden'
                                                    }
                                                },
                                                actionBar: {
                                                    sx: {
                                                        '& .MuiButton-root': {
                                                            color: '#0BB248',
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                            <Switch
                                checked={startImmediately}
                                onChange={() => setStartImmediately(!startImmediately)}
                                size="small"
                                sx={{
                                    width: 38,
                                    height: 22,
                                    padding: 0,
                                    '& .MuiSwitch-switchBase': {
                                        padding: 0,
                                        margin: '1px',
                                        transitionDuration: '300ms',
                                        '&.Mui-checked': {
                                            transform: 'translateX(16px)',
                                            color: '#fff',
                                            '& + .MuiSwitch-track': {
                                                backgroundColor: '#16783A',
                                                opacity: 1,
                                                border: 0,
                                            },
                                        },
                                    },
                                    '& .MuiSwitch-thumb': {
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                    },
                                    '& .MuiSwitch-track': {
                                        borderRadius: 26 / 2,
                                        backgroundColor: '#E9E9EA',
                                        opacity: 1,
                                    },
                                }}
                            />
                            <span className="text-sm text-gray-700">Start Immediately</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReschedule}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading && (
                            <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                        )}
                        {isLoading ? 'Rescheduling...' : 'Reschedule Stream'}
                    </button>
                </div>
            </div>
        </div>
    );
};

RescheduleModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    streamData: PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        category: PropTypes.string,
        status: PropTypes.string,
        scheduledStartTime: PropTypes.string,
    }),
};

export default RescheduleModal;