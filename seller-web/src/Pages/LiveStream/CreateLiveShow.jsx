import { toast } from 'sonner';
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef, useCallback } from 'react';
import { BASE_URL } from '../../Constants/Server';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useOutletContext } from 'react-router-dom';
import { fetchSellerProducts } from '../../Redux/Slices/ProductSlice';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { useDispatch, useSelector } from 'react-redux';
import { Autocomplete, TextField, Chip, Switch } from '@mui/material';
import { debounce } from 'lodash';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../Components/ui/tooltip';
import CategorySelectionModal from '../../Components/ui/CategorySelectionModal';
import axios from 'axios';
import dayjs from 'dayjs';
import CreateAuctionIcon from '../../assets/Upload icon.png';
import ZeroQuantityProductsModal from '../../Components/ZeroQuantityProductsModal';

const CreateLiveShow = () => {
    const { setHeaderName, setNavName } = useOutletContext();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products, message } = useSelector((state) => state.product);
    const { dispatch: livestreamDispatch, livestream } = useLivestreamContext();
    const [dragActive, setDragActive] = useState(false);
    const [categories, setCategories] = useState([]);
    const [startDate, setStartDate] = useState(dayjs());
    const [startTime, setStartTime] = useState(dayjs());
    const [startImmediately, setStartImmediately] = useState(false);
    const [showZeroQuantityModal, setShowZeroQuantityModal] = useState(false);
    const [zeroQuantityProducts, setZeroQuantityProducts] = useState([]);

    // Blips related state
    const [videos, setVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);

    // State for controlling picker open status
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState(false);

    // State for tag search
    const [searchTag, setSearchTag] = useState('');
    const [filteredTags, setFilteredTags] = useState([]);

    // Comprehensive predefined tags grouped by category
    const allTags = [
        // Fashion Category
        { id: 1, label: 'Fashion', category: 'Fashion' },
        { id: 2, label: 'Clothing', category: 'Fashion' },
        { id: 3, label: 'Dresses', category: 'Fashion' },
        { id: 4, label: 'Tops', category: 'Fashion' },
        { id: 5, label: 'Pants', category: 'Fashion' },
        { id: 6, label: 'Traditional', category: 'Fashion' },
        { id: 7, label: 'Vintage', category: 'Fashion' },

        // Footwear Category
        { id: 8, label: 'Shoes', category: 'Footwear' },
        { id: 9, label: 'Sneakers', category: 'Footwear' },
        { id: 10, label: 'Heels', category: 'Footwear' },
        { id: 11, label: 'Boots', category: 'Footwear' },
        { id: 12, label: 'Sandals', category: 'Footwear' },

        // Accessories Category
        { id: 13, label: 'Accessories', category: 'Accessories' },
        { id: 14, label: 'Jewelry', category: 'Accessories' },
        { id: 15, label: 'Watches', category: 'Accessories' },
        { id: 16, label: 'Bags', category: 'Accessories' },
        { id: 17, label: 'Wallets', category: 'Accessories' },
        { id: 18, label: 'Belts', category: 'Accessories' },

        // Electronics Category
        { id: 19, label: 'Electronics', category: 'Electronics' },
        { id: 20, label: 'Smartphones', category: 'Electronics' },
        { id: 21, label: 'Laptops', category: 'Electronics' },
        { id: 22, label: 'Tablets', category: 'Electronics' },
        { id: 23, label: 'Headphones', category: 'Electronics' },
        { id: 24, label: 'Speakers', category: 'Electronics' },
        { id: 25, label: 'Cameras', category: 'Electronics' },

        // Home & Living Category
        { id: 26, label: 'Home Decor', category: 'Home & Living' },
        { id: 27, label: 'Furniture', category: 'Home & Living' },
        { id: 28, label: 'Kitchen', category: 'Home & Living' },
        { id: 29, label: 'Bedding', category: 'Home & Living' },

        // Beauty Category
        { id: 30, label: 'Beauty', category: 'Beauty' },
        { id: 31, label: 'Makeup', category: 'Beauty' },
        { id: 32, label: 'Skincare', category: 'Beauty' },
        { id: 33, label: 'Haircare', category: 'Beauty' },
        { id: 34, label: 'Fragrance', category: 'Beauty' },

        // Kids & Baby Category
        { id: 35, label: 'Kids', category: 'Kids & Baby' },
        { id: 36, label: 'Baby Clothes', category: 'Kids & Baby' },
        { id: 37, label: 'Toys', category: 'Kids & Baby' },

        // Seasonal & Trending Tags
        { id: 38, label: 'Trending', category: 'Popular' },
        { id: 39, label: 'New Arrivals', category: 'Popular' },
        { id: 40, label: 'Sale', category: 'Popular' },
        { id: 41, label: 'Limited Edition', category: 'Popular' },
        { id: 42, label: 'Exclusive', category: 'Popular' },
        { id: 43, label: 'Seasonal', category: 'Popular' },

        // Sports & Fitness Tags
        { id: 44, label: 'Sports', category: 'Sports & Fitness' },
        { id: 45, label: 'Fitness', category: 'Sports & Fitness' },
        { id: 46, label: 'Activewear', category: 'Sports & Fitness' },
        { id: 47, label: 'Outdoor', category: 'Sports & Fitness' },
    ];

    // Fixed tags that cannot be removed
    const fixedTags = [allTags[0]]; // Fashion is fixed

    // Initialize filtered tags to show all tags initially
    useEffect(() => {
        setFilteredTags(allTags);
    }, []);

    useEffect(() => {
        dispatch(fetchSellerProducts());
    }, [dispatch]);

    // fetch products on initial render
    useEffect(() => {
        if (message === 'Products fetched successfully') {
          livestreamDispatch({
            type: 'SET_LIVESTREAM_DATA',
            payload: {
              products: products.map(product => {
                return {
                  productId: product?._id,
                  name: product?.name,
                  category: product?.category,
                  images: product?.images,
                  sku: product?.sku,
                  quantity: product?.stock,
                  minBid: product?.price,
                  maxBid: 0,
                  selected: true
                }
              })
            }
          });
        }
      }, [message, products, livestreamDispatch])

    // Initialize tags if they're undefined
    useEffect(() => {
        if (!livestream?.tags) {
            livestreamDispatch({
                type: 'SET_LIVESTREAM_DATA',
                payload: { tags: [] }
            });
        }
    }, [livestream?.tags, livestreamDispatch]);

    // Filter tags based on search input
    useEffect(() => {
        if (searchTag.trim() === '') {
            setFilteredTags(allTags);
        } else {
            const filtered = allTags.filter(tag =>
                tag.label.toLowerCase().includes(searchTag.toLowerCase()) ||
                tag.category.toLowerCase().includes(searchTag.toLowerCase())
            );
            setFilteredTags(filtered);
        }
    }, [searchTag]);

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchTag(event.target.value);
    };

    useEffect(() => {
        setHeaderName('Live Streams');
        setNavName('Create Live Show');
    }, [setHeaderName, setNavName]);

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
            payload: { scheduledStartTime: getScheduledStartTime(), startImmediately: startImmediately }
        });
    }, [startDate, startTime, startImmediately, livestreamDispatch]);

    const MAX_CHARS = 250;

    const inputRef = useRef(null);

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
    const handleFile = async (file) => {
        // Add file type validation here - only allow image types
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type', {
                description: 'Please upload only image files (JPEG, PNG, GIF)',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
            return;
        }

        try {
            // Convert file to base64 before dispatching
            const convertBlobToBase64 = (blob) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            // Process image to base64
            const base64 = await convertBlobToBase64(file);

            // Update the livestream context with the processed image data
            livestreamDispatch({
                type: 'SET_LIVESTREAM_DATA',
                payload: {
                    coverPhoto: {
                        file: file, // Keep the file for preview
                        data: base64,
                        contentType: file.type
                    }
                }
            });
        } catch (error) {
            console.error('Image processing failed:', error);
            toast.error('Failed to process image', {
                description: "There was an error processing your image",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        }
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
                    background: '#17171B',
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
        // Check each required field individually
        const missingFields = [];
        
        if (!livestream?.title) missingFields.push('Stream Title');
        if (!livestream?.description) missingFields.push('Stream Description');
        if (!livestream?.category) missingFields.push('Stream Category');
        if (!livestream?.tags || livestream.tags.length === 0) missingFields.push('Livestream Tags');
        if (!livestream?.coverPhoto) missingFields.push('Stream Cover Photo');
        if (!livestream?.scheduledStartTime) missingFields.push('Schedule Time');

        if (missingFields.length > 0) {
            const fieldsList = missingFields.length === 1 
                ? missingFields[0]
                : missingFields.length === 2
                ? `${missingFields[0]} and ${missingFields[1]}`
                : `${missingFields.slice(0, -1).join(', ')}, and ${missingFields[missingFields.length - 1]}`;
            
            toast.error(`Missing required field${missingFields.length > 1 ? 's' : ''}`, {
                description: `Please fill in: ${fieldsList}`,
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
            return;
        }

        // Check for products with zero or negative quantity
        // For live shows, we check all products since they're all included
        if (livestream.products && livestream.products.length > 0) {
            const invalidProducts = livestream.products.filter(product => 
                product.quantity <= 0 || !product.quantity
            );

            if (invalidProducts.length > 0) {
                setZeroQuantityProducts(invalidProducts);
                setShowZeroQuantityModal(true);
                return;
            }
        }

        navigate('/dashboard/live-streams/submit-live-show');
    }

    // Add these new state variables for CategorySelectionModal
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Add helper function to get subcategories
    const getSubCategories = (categoryName) => {
        const category = categories.find(cat => cat.name === categoryName);
        return category ? category.subCategories : [];
    };

    // Add search function
    const searchCategories = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get(`${BASE_URL}/public/categories/search`, {
                params: { query }
            });

            if (response.data.success) {
                setSearchResults(response.data.results);
            }
        } catch (error) {
            console.error('Error searching categories:', error);
            toast.error('Failed to search categories');
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search function
    const debouncedSearch = useCallback(
        debounce((query) => {
            if (query.trim()) {
                searchCategories(query);
            }
        }, 400),
        []
    );

    // Update search when query changes
    useEffect(() => {
        debouncedSearch(categorySearchQuery);
    }, [categorySearchQuery, debouncedSearch]);

    // Add handler for category selection
    const handleCategorySelection = (category, subCategory) => {
        setSelectedCategory(category);
        setSelectedSubCategory(subCategory);

        // Update livestream context with the selected category and subcategory
        livestreamDispatch({
            type: 'SET_LIVESTREAM_DATA',
            payload: {
                category: category,
                subCategory: subCategory
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 py-10">
            <div className="bg-white p-4 md:p-6 space-y-6">
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
                                    src={URL.createObjectURL(livestream?.coverPhoto.file)}
                                    alt="Preview"
                                    className="w-[250px] object-contain md:w-full h-24 rounded-lg mb-2"
                                />
                                <p className="text-sm text-gray-600">{livestream?.coverPhoto.file.name}</p>
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
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-[#E9FCEF] rounded-full p-4 w-20 h-20 mx-auto mb-4 transition-transform group-hover:scale-110 duration-300">
                                                <Icon icon="fluent:video-32-light" className="w-full h-full text-[#16783A]" />
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

                {/* Category Selection Modal */}
                <CategorySelectionModal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    selectedSubCategory={selectedSubCategory}
                    onApply={handleCategorySelection}
                    isSearching={isSearching}
                    searchResults={searchResults}
                    categorySearchQuery={categorySearchQuery}
                    setCategorySearchQuery={setCategorySearchQuery}
                    getSubCategories={getSubCategories}
                />

                {/* Stream Category - Replace with button that opens modal */}
                <div className="space-y-2">
                    <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">Stream Category</label>
                    <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="w-full flex items-center justify-between gap-2 p-3 border border-gray-300 bg-white rounded-lg hover:border-gray-400 transition-colors text-left"
                    >
                        <div className="flex flex-col">
                            <span className={selectedCategory ? "text-black" : "text-gray-500"}>
                                {selectedCategory || "Choose a category..."}
                            </span>
                            {selectedCategory && selectedSubCategory && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                    {selectedSubCategory}
                                </span>
                            )}
                        </div>
                        <Icon icon="heroicons:chevron-right" className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Display selected values as badges if selected */}
                    {selectedCategory && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            <div className="inline-flex items-center px-3 py-1 rounded-lg text-xs bg-[#0BB248]/10 text-[#0BB248] border border-[#0BB248]/20">
                                <span className="font-medium mr-1">Category:</span> {selectedCategory}
                            </div>
                            {selectedSubCategory && (
                                <div className="inline-flex flex-wrap items-center px-3 py-1 rounded-lg text-xs bg-[#17171B]/10 text-[#17171B] border border-[#17171B]/20">
                                    <span className="font-medium mr-1">Subcategory:</span> {selectedSubCategory}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Livestream Tags */}
                <div className="space-y-2">
                    <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">
                        Livestream Tags
                    </label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Autocomplete
                                multiple
                                id="tags-standard"
                                options={filteredTags}
                                value={livestream?.tags || []}
                                freeSolo
                                onChange={(event, newValue) => {
                                    // Transform any string values into tag objects
                                    const formattedTags = newValue.map(tag => {
                                        // If tag is a string (user input), create a new tag object
                                        if (typeof tag === 'string') {
                                            return {
                                                id: `custom-${tag}`,
                                                label: tag,
                                                category: 'Custom Tags'
                                            };
                                        }
                                        // Otherwise return the existing tag object
                                        return tag;
                                    });

                                    livestreamDispatch({
                                        type: 'SET_LIVESTREAM_DATA',
                                        payload: { tags: formattedTags }
                                    });
                                }}
                                getOptionLabel={(option) => {
                                    // Handle both string values and option objects
                                    if (typeof option === 'string') {
                                        return option;
                                    }
                                    return option.label;
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    // Handle custom tags
                                    if (typeof value === 'string') {
                                        return option.label === value;
                                    }
                                    return option.id === value.id;
                                }}
                                groupBy={(option) => option.category}
                                renderTags={(tagValue, getTagProps) =>
                                    tagValue.map((option, index) => {
                                        const tagProps = getTagProps({ index });
                                        // Check for custom tags (string IDs starting with 'custom-')
                                        const isCustom = typeof option.id === 'string' && option.id.startsWith('custom-');
                                        const isDisabled = !isCustom && Boolean(fixedTags.find(tag => tag.id === option.id));

                                        return (
                                            <Chip
                                                key={option.id || option}
                                                label={typeof option === 'string' ? option : option.label}
                                                {...tagProps}
                                                disabled={isDisabled}
                                                sx={{
                                                    backgroundColor: isCustom ? '#e6f7ef' : '#f3f4f6',
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
                                        );
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Search or add new tags..."
                                        value={searchTag}
                                        onChange={handleSearchChange}
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
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                            <p>Press enter to add custom tags</p>
                        </TooltipContent>
                    </Tooltip>
                    <p className="text-xs text-gray-500">
                        Select relevant tags for your stream. Some tags are fixed and cannot be removed.
                    </p>
                </div>

                {/* Select Products */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
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

            {showZeroQuantityModal && (
                <ZeroQuantityProductsModal
                    products={zeroQuantityProducts}
                    onClose={() => setShowZeroQuantityModal(false)}
                />
            )}
        </div>
    );
};

export default CreateLiveShow;
