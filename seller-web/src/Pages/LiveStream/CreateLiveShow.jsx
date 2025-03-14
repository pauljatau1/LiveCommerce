import { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../../Constants/Server';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select";
import { Autocomplete, TextField, Chip, Switch } from '@mui/material';
import { useDispatch } from 'react-redux';
import { fetchSellerProducts } from '../../Redux/Slices/ProductSlice';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import CreateAuctionIcon from '../../assets/Upload icon.png';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs from 'dayjs';
import { Icon } from "@iconify/react";

const CreateLiveShow = () => {
    const { setHeaderName, setNavName } = useOutletContext();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { dispatch: livestreamDispatch, livestream } = useLivestreamContext();
    const [dragActive, setDragActive] = useState(false);
    const [categories, setCategories] = useState([]);
    const [startDate, setStartDate] = useState(dayjs());
    const [startTime, setStartTime] = useState(dayjs());
    const [startImmediately, setStartImmediately] = useState(false);
    
    // Blips related state
    const [videos, setVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);

    // State for controlling picker open status
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState(false);

    useEffect(() => {
        setHeaderName('Live Streams');
        setNavName('Create Live Show');
    }, []);

    // Update the scheduled start time in context whenever date, time, or startImmediately changes
    useEffect(() => {
        const getScheduledStartTime = () => {
            if (startImmediately) {
                return new Date().toISOString();
            }

            // Combine the date and time into a single Date object
            const combinedDateTime = new Date(startDate.year(), startDate.month(), startDate.date());
            combinedDateTime.setHours(
                startTime.hour(),
                startTime.minute(),
                0,
                0
            );

            return combinedDateTime.toISOString();
        };

        livestreamDispatch({
            type: 'SET_LIVESTREAM_DATA',
            payload: { scheduledStartTime: getScheduledStartTime() }
        });
    }, [startDate, startTime, startImmediately, livestreamDispatch]);

    const MAX_CHARS = 250;

    const inputRef = useRef(null);

    // Predefined tags
    const availableTags = [
        { id: 1, label: 'Fashion' },
        { id: 2, label: 'Shoes' },
        { id: 3, label: 'Trending' },
        { id: 4, label: 'Electronics' },
        { id: 5, label: 'Accessories' },
        { id: 6, label: 'Sports' },
        // Add more tags as needed
    ];

    // Fixed tags that cannot be removed
    const fixedTags = [availableTags[0]]; // Fashion is fixed

    // Initialize tags if they're undefined
    useEffect(() => {
        if (!livestream?.tags) {
            livestreamDispatch({
                type: 'SET_LIVESTREAM_DATA',
                payload: { tags: [] }
            });
        }
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/public/categories`);
                if (response.status === 200) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to fetch categories');
            }
        }
        fetchCategories();
    }, []);

    useEffect(() => {
        dispatch(fetchSellerProducts());
    }, [dispatch]);

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Triggers when file is dropped
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Triggers when file is selected with click
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    // Handle both selected and dropped files
    const handleFile = (file) => {
        // Add file type validation here - only allow image types
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type', {
                description: 'Please upload only image files (JPEG, PNG, GIF)',
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
            return;
        }
        livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { coverPhoto: file } });
    };

    // Handle button click
    const onButtonClick = () => {
        inputRef.current.click();
    };

    const handleDescriptionChange = (e) => {
        const input = e.target.value;
        // Only update if we're under max chars or if we're deleting
        if (input.length <= MAX_CHARS) {
            livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { description: input } });
        }
    };

    // Handle video upload for blips
    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a video file', {
                description: "Upload a video file for your blip",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
            return;
        }

        const maxSize = 60 * 1024 * 1024; // 60MB
        if (file.size > maxSize) {
            toast.error('Video must be less than 60MB', {
                description: "Please upload a smaller video file",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
            return;
        }

        // Add duration check
        try {
            const video = document.createElement('video');
            video.preload = 'metadata';

            const duration = await new Promise((resolve, reject) => {
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    resolve(video.duration);
                };
                video.onerror = () => reject("Invalid video file");
                video.src = URL.createObjectURL(file);
            });

            if (duration > 30) {
                toast.error('Video must be less than 30 seconds', {
                    description: "Please upload a shorter video for better viewer engagement",
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
                return;
            }

            setIsUploading(true);
            setUploadProgress(0);
            setSelectedFile(file);

            // Simulate upload progress
            await simulateUpload(
                file,
                (progress) => setUploadProgress(progress)
            );

            const videoUrl = URL.createObjectURL(file);
            setVideos([{ url: videoUrl, file }]);
            
            // Convert file to base64 before dispatching
            const convertBlobToBase64 = (blob) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };
            
            // Process video to base64
            const base64 = await convertBlobToBase64(file);
            
            // Update the livestream context with the processed video data
            livestreamDispatch({ 
                type: 'SET_LIVESTREAM_DATA', 
                payload: { 
                    video: {
                        data: base64,
                        contentType: file.type || 'video/mp4'
                    } 
                } 
            });

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload video', {
                description: "There was an error processing your video",
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Simulate upload progress (temporary function before implementing actual upload)
    const simulateUpload = (file, onProgress) => {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                onProgress(progress);

                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 200);
        });
    };

    const handleContinue = () => {
        if (livestream?.title && livestream?.description && livestream?.category && livestream?.tags.length > 0 && livestream?.coverPhoto && livestream?.scheduledStartTime) {
            navigate('/dashboard/live-streams/submit-live-show');
        } else {
            toast.error('Please fill all fields', {
                description: 'Please fill all fields to continue',
            });
        }
    }

    return (
        <div className="flex flex-col gap-6  py-10">

            <div className=" bg-white p-4 md:p-6 space-y-6">
                {/* Stream Title */}
                <div className="space-y-2">
                    <h1 className="text-sm md:text-base font-inter font-bold text-[#27272E]">Open Live Stream Title</h1>
                    <input
                        type="text"
                        value={livestream?.title}
                        onChange={(e) => livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { title: e.target.value } })}
                        placeholder="Enter title"
                        className="w-full px-4 py-2 border text-sm md:text-base border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2"
                    />
                </div>

                {/* Schedule Live Section */}
                <div className="space-y-4">
                    <h2 className="text-sm md:text-base font-inter font-bold text-[#27272E]">Schedule Live</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 max-w-[800px] gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                {/* Custom clickable button to open the date picker */}
                                <button
                                    type="button"
                                    onClick={() => !startImmediately && setDatePickerOpen(true)}
                                    className={`w-full relative text-left pl-10 pr-4 py-2 border border-gray-300 rounded-lg  cursor-pointer'}`}
                                    disabled={startImmediately}
                                >
                                    <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 flex rounded-tl-lg rounded-bl-lg items-center w-fit px-2 py-1 h-full justify-between ${startImmediately ? 'bg-gray-100 cursor-not-allowed' : 'bg-[#E9FCEF] hover:bg-[#D9F7E5]'}`}>
                                        <span className="">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <span className="block truncate text-sm">
                                        {startImmediately ? "Current Date" : startDate.format('DD/MM/YYYY')}
                                    </span>
                                </button>

                                {/* Date picker that appears below the button when open */}
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        open={datePickerOpen}
                                        onOpen={() => setDatePickerOpen(true)}
                                        onClose={() => setDatePickerOpen(false)}
                                        disabled={startImmediately}
                                        value={startDate}
                                        onChange={(newDate) => {
                                            setStartDate(newDate);
                                        }}
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
                                {/* Custom clickable button to open the time picker */}
                                <button
                                    type="button"
                                    onClick={() => !startImmediately && setTimePickerOpen(true)}
                                    className={`w-full relative text-left pl-10 pr-4 py-2 border border-gray-300 rounded-lg  cursor-pointer'}`}
                                    disabled={startImmediately}
                                >
                                    <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 flex rounded-tl-lg rounded-bl-lg items-center w-fit px-2 py-1 h-full justify-between ${startImmediately ? 'bg-gray-100 cursor-not-allowed' : 'bg-[#E9FCEF] hover:bg-[#D9F7E5]'}`}>
                                        <span className="">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <span className="block truncate text-sm">
                                        {startImmediately ? "Current Time" : startTime.format('HH:mm')}
                                    </span>
                                </button>

                                {/* Time picker that appears below the button when open */}
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                        open={timePickerOpen}
                                        onOpen={() => setTimePickerOpen(true)}
                                        onClose={() => setTimePickerOpen(false)}
                                        disabled={startImmediately}
                                        value={startTime}
                                        onChange={(newTime) => {
                                            setStartTime(newTime);
                                        }}
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
                                    '&.Mui-focusVisible .MuiSwitch-thumb': {
                                        color: '#33cf4d',
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

                {/* Stream Cover Photo */}
                <div className="space-y-2">
                    <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">Stream Cover Photo</label>
                    <div
                        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer
                        ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={onButtonClick}
                    >
                        {livestream?.coverPhoto ? (
                            <div className="flex flex-col items-center">
                                <img
                                    src={URL.createObjectURL(livestream?.coverPhoto)}
                                    alt="Preview"
                                    className="w-[250px] object-contain md:w-full h-24 rounded-lg mb-2"
                                />
                                <p className="text-sm text-gray-600">{livestream?.coverPhoto.name}</p>
                            </div>
                        ) : (
                            <>
                                <img src={CreateAuctionIcon} alt="Upload" className="w-14 h-12 mb-2" />
                                <div className="text-center px-4">
                                    <p className="text-sm text-gray-600">
                                        Drop & drop files or <span className="text-green-600">Browse</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Supported formats: JPEG, PNG, GIF
                                    </p>
                                </div>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleChange}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Make sure to fit and appears for best results. Wrong images will be removed automatically.
                    </p>
                </div>

                {/* Blips Section */}
                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                        <div>
                            <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">Blips</label>
                            <span className="ml-2 text-xs bg-[#E9FCEF] text-[#0BB248] px-2 py-0.5 rounded-full">Recommended</span>
                        </div>
                        <button className="text-sm text-[#0BB248] hover:underline flex items-center">
                            What are blips?
                            <Icon icon="solar:info-circle-linear" className="ml-1 w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-4 md:p-6">
                            {videos.length > 0 ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative w-full max-w-[270px] mx-auto rounded-lg overflow-hidden aspect-[9/16] shadow-md border border-gray-200 bg-black">
                                        <video
                                            src={videos[0].url}
                                            className="w-full h-full object-contain"
                                            controls
                                            playsInline
                                        />
                                        <button
                                            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-sm transition-all duration-200 hover:shadow focus:outline-none transform hover:scale-105"
                                            onClick={() => {
                                                setVideos([]);
                                                setSelectedFile(null);
                                                livestreamDispatch({ 
                                                    type: 'SET_LIVESTREAM_DATA', 
                                                    payload: { video: null } 
                                                });
                                            }}
                                        >
                                            <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5 text-red-500" />
                                        </button>
                                    </div>
                                    {selectedFile && (
                                        <div className="bg-gray-50 px-4 py-2 rounded-full w-fit max-w-full">
                                            <p className="text-sm text-gray-600 truncate flex items-center">
                                                <Icon icon="solar:file-check-bold" className="mr-2 w-4 h-4 text-[#0BB248]" />
                                                {selectedFile.name}
                                            </p>
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-500 text-center max-w-md">
                                        <p>Your blip has been uploaded successfully! This short video will help promote your livestream.</p>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-xl hover:border-[#0BB248]/50 p-6 md:p-8 text-center cursor-pointer transition-all duration-300 group"
                                    onClick={() => !isUploading && document.getElementById('blip-upload').click()}
                                >
                                    {isUploading ? (
                                        <div className="space-y-4 py-8">
                                            <div className="relative w-16 h-16 mx-auto">
                                                <div className="absolute inset-0 rounded-full border-4 border-t-4 border-[#0BB248]/20 border-t-[#0BB248] animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[#0BB248]">
                                                    {uploadProgress}%
                                                </div>
                                            </div>
                                            {/*<div className="max-w-xs mx-auto space-y-2">
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#0BB248] transition-all duration-300 ease-out"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Uploading your video... please wait
                                                </p>
                                            </div>*/}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-[#E9FCEF] rounded-full p-4 w-20 h-20 mx-auto mb-4 transition-transform group-hover:scale-110 duration-300">
                                                <Icon icon="solar:videocamera-record-broken" className="w-full h-full text-[#0BB248]" />
                                            </div>
                                            <h3 className="font-semibold text-lg mb-2 text-gray-700">Add a Blip to Your Livestream</h3>
                                            <p className="text-gray-500 max-w-md mx-auto mb-1">
                                                Upload a vertical video (max 30 seconds) to promote your upcoming livestream
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                                                    <Icon icon="solar:wand-magic-minimalistic-linear" className="mr-1 w-3 h-3" />
                                                    Increases visibility
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                                                    <Icon icon="solar:graph-up-linear" className="mr-1 w-3 h-3" />
                                                    Higher engagement
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                                                    <Icon icon="solar:users-group-rounded-linear" className="mr-1 w-3 h-3" />
                                                    Attracts viewers
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="blip-upload"
                                        className="hidden"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        disabled={isUploading}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 max-w-2xl">
                        Adding a blip can increase your livestream&apos;s visibility and engagement by up to 40%. For best results, make it visually appealing and focus on key products you&apos;ll feature in your stream.
                    </p>
                </div>

                {/* Stream Description */}
                <div className="space-y-2">
                    <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">
                        Stream Description
                    </label>
                    <textarea
                        placeholder="Enter description"
                        rows={4}
                        value={livestream?.description}
                        onChange={handleDescriptionChange}
                        className="w-full px-4 py-2 border text-sm md:text-base border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2"
                    />
                    <div className="flex justify-end">
                        <span
                            className={`text-xs ${livestream?.description?.length === MAX_CHARS
                                ? 'text-red-500 font-medium'
                                : 'text-gray-500'
                                }`}
                        >
                            {livestream?.description?.length}/{MAX_CHARS} Characters
                        </span>
                    </div>
                </div>

                {/* Stream Category */}
                <div className="space-y-2">
                    <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">Stream Category</label>
                    <Select
                        value={livestream?.category}
                        onValueChange={(value) => {
                            livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { category: value } });
                        }}
                    >
                        <SelectTrigger className="border border-gray-300 rounded-lg">
                            <SelectValue placeholder="Choose a category..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem
                                    key={category._id}
                                    value={category.name}
                                >
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Livestream Tags */}
                <div className="space-y-2">
                    <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">
                        Livestream Tags
                    </label>
                    <Autocomplete
                        multiple
                        id="tags-standard"
                        options={availableTags}
                        value={livestream?.tags || []}
                        onChange={(event, newValue) => {
                            livestreamDispatch({
                                type: 'SET_LIVESTREAM_DATA',
                                payload: { tags: [...newValue] }
                            });
                        }}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderTags={(tagValue, getTagProps) =>
                            tagValue.map((option, index) => (
                                <Chip
                                    key={option.id}
                                    label={option.label}
                                    {...getTagProps({ index })}
                                    disabled={fixedTags.find(tag => tag.id === option.id)}
                                    sx={{
                                        backgroundColor: '#f3f4f6',
                                        '&.MuiChip-root': {
                                            borderRadius: '9999px',
                                            height: '28px',
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 1,
                                            backgroundColor: '#e5e7eb',
                                        }
                                    }}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Search for tags..."
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        padding: '4px 8px',
                                        '& fieldset': {
                                            borderColor: '#d1d5db',
                                            borderRadius: '8px',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#d1d5db',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#d1d5db',
                                            borderWidth: '2px',
                                        },
                                    },
                                }}
                            />
                        )}
                        sx={{
                            width: '100%',
                            '& .MuiAutocomplete-tag': {
                                margin: '2px',
                            },
                        }}
                    />
                    <p className="text-xs text-gray-500">
                        Select relevant tags for your stream. Some tags are fixed and cannot be removed.
                    </p>
                </div>

                {/* Select Products */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm md:text-base font-inter font-bold text-[#27272E]">Select Products for Stream</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-medium text-[#8492A6] uppercase tracking-wider">
                                        Select
                                    </th>
                                    <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-medium text-[#8492A6] uppercase tracking-wider">
                                        Products
                                    </th>
                                    <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-medium text-[#8492A6] uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-medium text-[#8492A6] uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-medium text-[#8492A6] uppercase tracking-wider">
                                        Min Bid
                                    </th>
                                    <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-medium text-[#8492A6] uppercase tracking-wider">
                                        Max Bid
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="6" className="h-[300px]">
                                        <div className="w-[300px] md:w-full h-full flex flex-col md:flex-row items-center justify-center space-y-2">
                                            <div className="flex flex-col md:flex-row items-center gap-10" >
                                                <div>
                                                    <h3 className="text-base xl:text-lg font-semibold font-inter text-[#16192C]">Products Selection</h3>
                                                    <p className="text-sm text-[#425466] font-inter max-w-[500px]  ">
                                                        All products in your store are automatically selected for open live shows.
                                                        To remove a product, you can deactivate the product from the product listings.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <button onClick={handleContinue}>
                            <button className="px-6 py-2 text-sm font-medium text-white bg-[#0BB248] rounded-lg hover:bg-[#0BB248]/90">
                                Continue
                            </button>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateLiveShow;
