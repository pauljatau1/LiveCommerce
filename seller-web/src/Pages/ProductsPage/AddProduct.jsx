import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { Icon } from "@iconify/react";
import {
    Collapsible,
    CollapsibleContent,
} from "../../Components/ui/collapsible";
import { Button } from "../../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../Components/ui/card";
import { Label } from "../../Components/ui/label";
import { Input } from "../../Components/ui/input2";
import { Textarea } from "../../Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select";
import { BASE_URL } from '../../Constants/Server';
import { toast } from 'sonner';
//import { useAuthContext } from '../../Hooks/useAuthContext';
//import { useProductContext } from '../../Hooks/useProductContext';
import { useSelector, useDispatch } from 'react-redux';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { createProduct, resetResponse } from '../../Redux/Slices/ProductSlice';
import { VariantsProvider, useVariants } from '../../Contexts/VariantContext'
import UploadImage from '../../assets/upload-image.png';
import LinearProgress from '@mui/material/LinearProgress';
import axios from 'axios';
import Header from '../../Components/ui/Header/Header';
import NoCatImage from '../../assets/no-cat.png';
// Comment out ProductSpecifications import
// import ProductSpecifications from '../../Components/ui/ProductCategoryUploadUi/ProductSpecifications';
import PropTypes from 'prop-types';
import VariantOptions from '../../Components/ui/VariantComponents/VariantOptions';
import VariantCard from '../../Components/ui/VariantComponents/VariantCard';
import VariantCombinations from '../../Components/ui/VariantComponents/VariantCombinations';
import VariantImageUpload from '../../Components/ui/VariantComponents/VariantImageUpload';
import VariantCombinationsMobile from '../../Components/ui/VariantComponents/VariantCombinationsMobile';
import AddOptionCard from '../../Components/ui/VariantComponents/AddOptionCard';
import { Checkbox } from "../../Components/ui/checkbox";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { debounce } from 'lodash';
import CategorySelectionModal from '../../Components/ui/CategorySelectionModal';

// Define the rich text editor toolbar options
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic',
    'list', 'bullet'
];

const AddProduct = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    const location = useLocation();
    // Add navigate hook
    const navigate = useNavigate();
    //const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    //const { seller } = useAuthContext();
    const dispatch = useDispatch();
    const { message, error, isLoading, response } = useSelector(state => state.product)
    //const [notification, setNotification] = useState(true);
    //const [open, setOpen] = useState(false);
    //const [isChatVisible, setIsChatVisible] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [images, setImages] = useState([]);
    const [shippingDetails, setShippingDetails] = useState({
        pricing: null,
        salePrice: null,
        weight: null,
        weightUnit: 'kg',
        inventory: null,
        condition: 'fairly-used',
        dimensions: {
            length: null,
            width: null,
            height: null
        }
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [videos, setVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [productStatus, setProductStatus] = useState('active');
    const [auctionDetails, setAuctionDetails] = useState({
        minBid: null,
        maxBid: null,
        endOnMaxBid: false,
        startDate: null,
        endDate: null
    });
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [skuNumber, setSkuNumber] = useState('');
    const [upcNumber, setUpcNumber] = useState('');
    const [brand, setBrand] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [contentProgress, setContentProgress] = useState(0);
    // Comment out productSpecs state
    // const [productSpecs, setProductSpecs] = useState({});
    const { variantStructure } = useVariants();
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Check URL parameters for ?type=auction
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        
        if (type === 'auction') {
            setProductStatus('offline_auction');
        }
    }, [location]);

    useEffect(() => {
        setHeaderName('Products')
        setNavName(productStatus === 'offline_auction' ? 'Add Offline Auction' : 'Add Product')
    }, [productStatus])

    // Create a ref to store the variant context
    const variantContextRef = useRef(null);

    // Comment out handleSpecificationsChange function
    // const handleSpecificationsChange = (specs) => {
    //     setProductSpecs(specs);
    // };

    // console.log('productSpecs:', productSpecs)

    useEffect(() => {
        if (message) {
            toast.success(message);
        }
        if (error) {
            toast.error(error);
        }
    }, [message, error]);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${BASE_URL}/public/categories`);
                if (response.status === 200) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to fetch categories');
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    }, []);

    console.log('cat:', categories);

    const handleShippingChange = (field, value) => {
        setShippingDetails(prev => {
            // Handle weight unit conversions - always store as kg internally
            if (field === 'weightUnit') {
                const currentWeight = prev.weight;
                let convertedWeight = currentWeight;
                
                // Convert from previous unit to kg
                if (currentWeight) {
                    if (value === 'g' && prev.weightUnit === 'kg') {
                        // kg to g
                        convertedWeight = currentWeight * 1000;
                    } else if (value === 'lb' && prev.weightUnit === 'kg') {
                        // kg to lb
                        convertedWeight = currentWeight * 2.20462;
                    } else if (value === 'kg' && prev.weightUnit === 'g') {
                        // g to kg
                        convertedWeight = currentWeight / 1000;
                    } else if (value === 'kg' && prev.weightUnit === 'lb') {
                        // lb to kg
                        convertedWeight = currentWeight / 2.20462;
                    } else if (value === 'g' && prev.weightUnit === 'lb') {
                        // lb to g
                        convertedWeight = (currentWeight / 2.20462) * 1000;
                    } else if (value === 'lb' && prev.weightUnit === 'g') {
                        // g to lb
                        convertedWeight = (currentWeight / 1000) * 2.20462;
                    }
                }
                
                return {
                    ...prev,
                    weightUnit: value,
                    weight: convertedWeight ? parseFloat(convertedWeight.toFixed(2)) : currentWeight
                };
            }
            
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value
                    }
                };
            }
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const remainingSlots = 5 - images.length;

        if (remainingSlots <= 0) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        // Take only the number of files that will fit within the limit
        const filesToProcess = files.slice(0, remainingSlots);

        const newImages = await Promise.all(filesToProcess.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({
                    url: reader.result,
                    contentType: file.type,
                    isDefault: false
                });
                reader.readAsDataURL(file);
            });
        }));

        if (newImages.length > 0) {
            newImages[0].isDefault = true;
        }

        setImages(prev => [...prev, ...newImages]);

        // Show message if some files were not processed due to limit
        if (files.length > remainingSlots) {
            toast.warning(`Only ${remainingSlots} image${remainingSlots > 1 ? 's' : ''} added. Maximum limit reached.`);
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a video file', {
                description: "upload a video file",
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
                description: "upload a video less than 60MB",
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
                    description: "Please upload a shorter video",
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
                return;
            }

            setIsUploading(true);
            setUploadProgress(0);

            // Simulate upload progress
            await simulateUpload(
                file,
                (progress) => setUploadProgress(progress)
            );

            const videoUrl = URL.createObjectURL(file);
            setVideos([{ url: videoUrl }]);

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload video');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Simulate upload progress (remove this when implementing actual upload)
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

    const fetchSeller = localStorage.getItem('seller');
    const sellerDetails = fetchSeller ? JSON.parse(fetchSeller) : null;

    const getSubCategories = (categoryName) => {
        const category = categories.find(cat => cat.name === categoryName);
        return category ? category.subCategories : [];
    };

    // Helper function to generate SKU
    const generateSKU = useCallback(() => {
        const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        return `SKU-${randomString}-${timestamp}`;
    }, []);

    // Helper function to generate UPC
    const generateUPC = useCallback(() => {
        // Generate a random 12-digit number for UPC
        return Math.floor(100000000000 + Math.random() * 900000000000).toString();
    }, []);

    // Auto-generate SKU and UPC when the component loads
    useEffect(() => {
        setSkuNumber(generateSKU());
        setUpcNumber(generateUPC());
    }, [generateSKU, generateUPC]);

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

    //submit product
    const handleSubmitProduct = async (e) => {
        e.preventDefault();

        try {
            // Helper function to convert blob to base64
            const convertBlobToBase64 = (blob) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result;
                        resolve(base64String.split(',')[1]); // Remove data URL prefix
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            // Process variants with base64 images
            const processedVariants = await Promise.all(variantContextRef.current?.variantStructure?.map(async mainVariant => {
                // Process main variant images
                const mainVariantImages = await Promise.all((mainVariant.images || []).map(async (img) => {
                    const base64Response = await fetch(img.url);
                    const blob = await base64Response.blob();
                    const base64 = await convertBlobToBase64(blob);
                    return {
                        data: base64,
                        contentType: 'image/jpeg',
                        isDefault: img.isDefault || false
                    };
                }));

                return {
                    name: mainVariant.name,
                    value: mainVariant.value,
                    price: parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing),
                    totalStock: mainVariant.subVariants.reduce((total, subVar) =>
                        total + (parseInt(subVar.stock) || 0) +
                        subVar.subSubVariants.reduce((subTotal, subSubVar) =>
                            subTotal + (parseInt(subSubVar.stock) || 0), 0
                        ), 0) || 1,
                    images: mainVariantImages,

                    subVariants: await Promise.all(mainVariant.subVariants.map(async subVariant => {
                        const subVariantImages = await Promise.all((subVariant.images || []).map(async (img) => {
                            const base64Response = await fetch(img.url);
                            const blob = await base64Response.blob();
                            const base64 = await convertBlobToBase64(blob);
                            return {
                                data: base64,
                                contentType: 'image/jpeg',
                                isDefault: img.isDefault || false
                            };
                        }));

                        return {
                            name: subVariant.name,
                            value: subVariant.value,
                            price: parseFloat(subVariant.price) || parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing),
                            stock: parseInt(subVariant.stock) || 0,
                            images: subVariantImages,
                            subSubVariants: await Promise.all(subVariant.subSubVariants.map(async subSubVariant => {
                                const subSubVariantImages = await Promise.all((subSubVariant.images || []).map(async (img) => {
                                    const base64Response = await fetch(img.url);
                                    const blob = await base64Response.blob();
                                    const base64 = await convertBlobToBase64(blob);
                                    return {
                                        data: base64,
                                        contentType: 'image/jpeg',
                                        isDefault: img.isDefault || false
                                    };
                                }));

                                return {
                                    name: subSubVariant.name,
                                    value: subSubVariant.value,
                                    price: parseFloat(subSubVariant.price) || parseFloat(subVariant.price) || parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing),
                                    stock: parseInt(subSubVariant.stock) || 0,
                                    sku: `${skuNumber}-${mainVariant.value}-${subVariant.value}-${subSubVariant.value}`.toUpperCase().replace(/\s+/g, '-'),
                                    images: subSubVariantImages
                                };
                            }))
                        };
                    }))
                };
            }) || []);

            // Process main product images
            const processedImages = await Promise.all(images.map(async (image) => {
                const base64Response = await fetch(image.url);
                const blob = await base64Response.blob();
                const base64 = await convertBlobToBase64(blob);
                return {
                    data: base64,
                    contentType: 'image/jpeg'
                };
            }));

            // Process video if exists
            const processedBlips = [];
            if (videos.length > 0) {
                const base64Response = await fetch(videos[0].url);
                const blob = await base64Response.blob();
                const base64 = await convertBlobToBase64(blob);
                processedBlips.push({
                    data: base64,
                    contentType: 'video/mp4'
                });
            }

            // When creating productData, ensure weight is in kg
            let weightInKg = Number(shippingDetails.weight) || 10;
            if (shippingDetails.weightUnit === 'g') {
                weightInKg = Number(shippingDetails.weight) / 1000;
            } else if (shippingDetails.weightUnit === 'lb') {
                weightInKg = Number(shippingDetails.weight) / 2.20462;
            }
            
            // Create the product data object
            const productData = {
                name: title,
                description: description,
                price: Number(shippingDetails.pricing),
                salePrice: Number(shippingDetails.salePrice),
                weight: weightInKg, // Always store weight in kg
                stock: productStatus === 'offline_auction' ? 1 : Number(shippingDetails.inventory),
                condition: shippingDetails.condition,
                status: productStatus,
                category: selectedCategory,
                subCategory: selectedSubCategory,
                sku: skuNumber,
                upc: upcNumber,
                brand: brand, // Still include brand even if optional
                variants: processedVariants,
                images: processedImages,
                blips: processedBlips,
                shippingInfo: {
                    weight: {
                        value: weightInKg, // Weight in kg
                        unit: 'kg' // Always set to kg
                    },
                    dimensions: {
                        length: Number(shippingDetails.dimensions.length) || 10,
                        width: Number(shippingDetails.dimensions.width) || 10,
                        height: Number(shippingDetails.dimensions.height) || 10
                    },
                    freeShipping: false,
                    shippingClass: 'standard'
                }
            };

            // Comment out the section that adds product specifications
            // Add product specifications
            // if (productSpecs) {
            //     Object.entries(productSpecs).forEach(([key, value]) => {
            //         if (value) {
            //             productData[key] = Array.isArray(value) ? value.join(',') : value;
            //         }
            //     });
            // }

            // Add auction details if product is an offline auction
            if (productStatus === 'offline_auction') {
                productData.auction = {
                    minBid: Number(auctionDetails.minBid),
                    maxBid: Number(auctionDetails.maxBid),
                    endOnMaxBid: auctionDetails.endOnMaxBid,
                    startDate: new Date(auctionDetails.startDate).toISOString(),
                    endDate: new Date(auctionDetails.endDate).toISOString()
                };
            }

            console.log('submit product data', productData);
            
            // Validate all required fields and collect missing fields
            const missingFields = [];
            
            if (!title) missingFields.push('Product title');
            if (!description) missingFields.push('Product description');
            if (images.length === 0) missingFields.push('Product images');
            if (!shippingDetails.pricing) missingFields.push('Pricing information');
            if (!shippingDetails.weight) missingFields.push('Product weight');
            if (productStatus !== 'offline_auction' && !shippingDetails.inventory) missingFields.push('Inventory quantity');
            if (!shippingDetails.condition) missingFields.push('Product condition');
            if (!selectedCategory) missingFields.push('Product category');
            if (!selectedSubCategory) missingFields.push('Product sub-category');
            // Removed brand name validation as it's now optional

            // Add auction-specific validations
            if (productStatus === 'offline_auction') {
                if (!auctionDetails.minBid) missingFields.push('Minimum bid amount');
                if (!auctionDetails.maxBid) missingFields.push('Maximum bid amount');
                if (!auctionDetails.startDate) missingFields.push('Auction start date');
                if (!auctionDetails.endDate) missingFields.push('Auction end date');
                
                // Validate min bid is less than max bid
                if (Number(auctionDetails.minBid) >= Number(auctionDetails.maxBid)) {
                    toast.error('Maximum bid must be greater than minimum bid');
                    return;
                }

                // Validate start date is in the future
                // if (new Date(auctionDetails.startDate) <= new Date()) {
                //     toast.error('Auction start date must be in the future');
                //     return;
                // }

                // Validate end date is after start date
                if (new Date(auctionDetails.endDate) <= new Date(auctionDetails.startDate)) {
                    toast.error('Auction end date must be after start date');
                    return;
                }
            }

            // Submit if no missing fields, otherwise show specific error messages
            if (missingFields.length === 0) {
                dispatch(createProduct(productData));
            } else {
                if (missingFields.length === 1) {
                    toast.error(`Please fill the required field: ${missingFields[0]}`);
                } else if (missingFields.length <= 3) {
                    toast.error(`Please fill these required fields: ${missingFields.join(', ')}`);
                } else {
                    toast.error(`Several required fields are missing: ${missingFields.join(', ')}`);
                }
            }

        } catch (error) {
            console.error('Error submitting product:', error);
            toast.error('Failed to submit product');
        }
    };

    useEffect(() => {
        // Reset fields after successful submission
        if (response === 'success') {
            setTitle('');
            setDescription('');
            setImages([]);
            setShippingDetails({
                pricing: null,
                salePrice: null,
                weight: null,
                weightUnit: 'kg',
                inventory: null,
                condition: 'fairly-used',
                dimensions: {
                    length: null,
                    width: null,
                    height: null
                }
            });
            setSelectedCategory('');
            setSelectedSubCategory('');
            setSkuNumber('');
            setUpcNumber('');
            setBrand('');
            setVideos([]);
            setProductStatus('active');
            // setProductSpecs({}); // Reset specifications
            
            // Add navigation to products page
            toast.success("Product added successfully!");
            navigate("/dashboard/products");
            
            // Reset the response state so it doesn't trigger again if we come back
            dispatch(resetResponse());
        }
    }, [response, navigate, dispatch])

    const handleRemoveImage = (indexToRemove) => {
        setImages(prev => {
            const newImages = prev.filter((_, index) => index !== indexToRemove);
            // Revoke the Object URL to free up memory
            URL.revokeObjectURL(prev[indexToRemove].url);
            return newImages;
        });
    };

    const handleCancelButton = () => {
        setTitle('');
        setDescription('');
        setImages([]);
        setShippingDetails({
            pricing: null,
            salePrice: null,
            weight: null,
            weightUnit: 'kg',
            inventory: null,
            condition: 'fairly-used',
            dimensions: {
                length: null,
                width: null,
                height: null
            }
        });
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSkuNumber('');
        setUpcNumber('');
        setBrand('');
        setVideos([]);
        setProductStatus('active');
        // setProductSpecs({}); // Reset specifications
        setAuctionDetails({
            minBid: null,
            maxBid: null,
            endOnMaxBid: false,
            startDate: null,
            endDate: null
        });
    };

    // Move conditions outside of the callback to prevent recreating on every render
    const getContentConditions = () => [
        { met: images.length >= 3, text: "Add at least 3 images" },
        { met: selectedCategory !== '', text: "Choose a product category" },
        { met: title !== '', text: "Add a product title" },
        { met: description !== '', text: "Add a product description" }
    ];

    // Update progress calculation
    const updateContentProgress = useCallback(() => {
        const conditions = getContentConditions();
        const metConditions = conditions.filter(condition => condition.met).length;
        const progress = (metConditions / conditions.length) * 100;
        setContentProgress(progress);
    }, [images, selectedCategory, title, description]);

    // Use effect to update progress when dependencies change
    useEffect(() => {
        updateContentProgress();
    }, [updateContentProgress]);

    // First, create a reusable Label component with required indicator
    const RequiredLabel = ({ children }) => (
        <div className="flex items-center gap-1">
            <span className="font-cabin font-base">{children}</span>
            <span className="text-[#FFFFFF] text-[8px] px-1.5 py-0.5 bg-[#17171B]/80 rounded-full backdrop-blur-sm border border-[#FFFFFF]/10">Required</span>
        </div>
    );

    RequiredLabel.propTypes = {
        children: PropTypes.node.isRequired
    };

    // Modified VariantSection component
    const VariantSection = memo(() => {
        const variantContext = useVariants();

        // Store the context in the ref whenever it changes
        useEffect(() => {
            variantContextRef.current = variantContext;
        }, [variantContext]);

        const [showAddOption, setShowAddOption] = useState(false);
        const [editingVariantId, setEditingVariantId] = useState(null);
        const {
            options,
            deleteOption,
            setOptions,
            updateVariantValue,
        } = useVariants();

        const handleDone = useCallback(() => {
            setShowAddOption(false);
            setEditingVariantId(null);
        }, []);

        const handleDeleteOption = useCallback((optionId) => {
            const optionIndex = options.findIndex(opt => opt.id === optionId);

            // If deleting a subvariant (size), remove both size and material cards
            if (optionIndex === 1) {
                // Remove both size and material options
                setOptions(prev => prev.slice(0, 1)); // Keep only the first option (color)
                deleteOption(optionId); // Also call deleteOption to update variant combinations
            } else {
                deleteOption(optionId);
            }
            updateVariantValue(optionId, null, null);
        }, [deleteOption, updateVariantValue, options, setOptions]);

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Variants (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                    {options.length === 0 && !showAddOption ? (
                        // Initial empty state
                        <>
                            <div className="text-center py-8">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-12 h-12 text-gray-400 mx-auto"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill="currentColor"
                                        fillRule="evenodd"
                                        d="M17.5 2.75a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5h-2.25V9.5a.75.75 0 0 1-1.5 0V7.25H14.5a.75.75 0 0 1 0-1.5h2.25V3.5a.75.75 0 0 1 .75-.75"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M2 6.5c0-2.121 0-3.182.659-3.841S4.379 2 6.5 2s3.182 0 3.841.659S11 4.379 11 6.5s0 3.182-.659 3.841S8.621 11 6.5 11s-3.182 0-3.841-.659S2 8.621 2 6.5m11 11c0-2.121 0-3.182.659-3.841S15.379 13 17.5 13s3.182 0 3.841.659S22 15.379 22 17.5s0 3.182-.659 3.841S19.621 22 17.5 22s-3.182 0-3.841-.659S13 19.621 13 17.5m-11 0c0-2.121 0-3.182.659-3.841S4.379 13 6.5 13s3.182 0 3.841.659S11 15.379 11 17.5s0 3.182-.659 3.841S8.621 22 6.5 22s-3.182 0-3.841-.659S2 19.621 2 17.5"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-500">Add a new variant, there are none yet!!</p>
                            </div>
                            <Button
                                onClick={() => setShowAddOption(true)}
                                className="mt-4 lg:mt-12 bg-[#17171B]/90 flex items-center justify-center gap-0 text-white rounded-full px-3 py-3 text-[11px] md:text-sm lg:px-3 lg:py-5 hover:bg-[#17171B]/80 hover:scale-95 transition-all duration-300 ease-in-out hover:text-white w-full md:w-auto"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1024 1024"
                                    className="w-4 h-4 mr-2"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M512 0C229.232 0 0 229.232 0 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512C1024 229.232 794.784 0 512 0m0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01M736 480H544V288c0-17.664-14.336-32-32-32s-32 14.336-32 32v192H288c-17.664 0-32 14.336-32 32s14.336 32 32 32h192v192c0 17.664 14.336 32 32 32s32-14.336 32-32V544h192c17.664 0 32-14.336 32-32s-14.336-32-32-32"
                                    />
                                </svg>
                                Add options like size or color
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {/* Show existing variant cards */}
                            {options.map(option => (
                                editingVariantId === option.id ? (
                                    <VariantOptions
                                        key={option.id}
                                        onDone={() => setEditingVariantId(null)}
                                        editingVariant={option}
                                    />
                                ) : (
                                    <VariantCard
                                        key={option.id}
                                        variant={option}
                                        onEdit={() => setEditingVariantId(option.id)}
                                        onDelete={() => handleDeleteOption(option.id)}
                                    />
                                )
                            ))}

                            {/* Show AddOptionCard when adding new option */}
                            {showAddOption && (
                                <AddOptionCard onDone={handleDone} />
                            )}

                            {/* Show add another option button if not currently adding */}
                            {!showAddOption && options.length < 3 && (
                                <button
                                    onClick={() => setShowAddOption(true)}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 bg-[#FFFFFF]/90 border border-gray-300 text-gray-500 hover:bg-[#FFFFFF]/80 hover:border-gray-500 hover:text-gray-700 transition-all duration-300 ease-in-out"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 1024 1024"
                                        className="w-4 h-4 mr-2"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M512 0C229.232 0 0 229.232 0 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512C1024 229.232 794.784 0 512 0m0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01M736 480H544V288c0-17.664-14.336-32-32-32s-32 14.336-32 32v192H288c-17.664 0-32 14.336-32 32s14.336 32 32 32h192v192c0 17.664 14.336 32 32 32s32-14.336 32-32V544h192c17.664 0 32-14.336 32-32s-14.336-32-32-32"
                                        />
                                    </svg>
                                    Add another option
                                </button>
                            )}

                            {/* Show combinations if options exist */}
                            {options.length > 0 && (
                                <>
                                    <div className="hidden md:block mt-6">
                                        <VariantCombinations />
                                    </div>
                                    <div className="md:hidden mt-6">
                                        <VariantCombinationsMobile />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    });

    VariantSection.displayName = 'VariantSection';

    // Add handler for category selection from modal
    const handleCategorySelection = (category, subCategory) => {
        setSelectedCategory(category);
        setSelectedSubCategory(subCategory);
    };

    return (
        <>
            {
                loading ? (
                    <div className="flex flex-col justify-center items-center h-[80dvh]">
                        <div className="w-1/4">
                            <LinearProgress color="success" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col justify-between gap-4 py-6">
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
                        
                        <div className="flex flex-col lg:flex-row mt-[15.5px] xl:mt-[31px] gap-4 relative">
                            {/* Left Section */}
                            <div className="flex-1 space-y-4 bg-[#F7F7F7] border border-[#00000024] rounded-lg py-3 lg:py-7 px-3 lg:px-6 ">
                                {/* Product Status Banner - Moved to top for better visibility */}
                                {/* <div className="w-full flex flex-col gap-2 p-4 rounded-lg bg-[#17171B]/5 border border-[#17171B]/10">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Product Status</span>
                                        <Select
                                            value={productStatus}
                                            onValueChange={setProductStatus}
                                            defaultValue="active"
                                        >
                                            <SelectTrigger className="w-[180px] rounded-full">
                                                <SelectValue>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            productStatus === 'active' ? 'bg-green-500' : 
                                                            productStatus === 'offline_auction' ? 'bg-purple-500' : 'bg-orange-500'
                                                        }`} />
                                                        {productStatus === 'offline_auction' ? 'Offline Auction' : 
                                                         productStatus.charAt(0).toUpperCase() + productStatus.slice(1)}
                                                    </div>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        Active
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="draft">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                        Draft
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="offline_auction">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                        Offline Auction
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                   
                                </div> */}
                                
                                {/* Title Input */}
                                <div className="space-y-2">
                                    <RequiredLabel>Title</RequiredLabel>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter product title"
                                        className='bg-[#FFFFFF] border border-[#02020238] rounded-full'
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <RequiredLabel>Description</RequiredLabel>
                                    <div className="border border-[#02020238] rounded-2xl overflow-hidden">
                                        <ReactQuill
                                            theme="snow"
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Enter detailed product description"
                                            modules={quillModules}
                                            formats={quillFormats}
                                            className="min-h-[226px] rounded-2xl bg-white"
                                        />
                                    </div>
                                </div>

                                {/** mobile categories */}
                                <div className="flex lg:hidden flex-col gap-4">
                                    <div className="space-y-2">
                                        <RequiredLabel>Category & Sub-Category</RequiredLabel>
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryModalOpen(true)}
                                            className="w-full flex items-center justify-between gap-2 p-3 border border-[#02020238] bg-white rounded-xl hover:border-gray-400 transition-colors text-left"
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
                                    </div>
                                </div>

                                {/* Remove conditional rendering and directly show the fields */}
                                {/* Product Images */}
                                <div>
                                    <Card className="border border-[#02020238]">
                                        <CardHeader>
                                            <CardTitle className='text-base lg:text-lg font-cabin font-medium'>Product Images</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                                                <div className="flex flex-col items-center justify-center gap-4 lg:gap-7 mb-7 lg:mb-14">
                                                    <img src={UploadImage} alt="Upload Image" className="w-12 h-12 lg:w-28 lg:h-28 mx-auto mb-2" />
                                                    <p className="text-sm lg:text-base font-cabin font-normal text-[#17171B96]">Upload Up To 5 Square Images With Dimensions Min Of 1024 X 1024, Max: 3200 X 3200</p>
                                                </div>
                                                <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
                                                    {images.map((image, index) => (
                                                        <div key={index} className="relative sm:w-24 sm:h-24 w-16 h-16">
                                                            <img
                                                                src={image.url}
                                                                alt={`Product image ${index + 1}`}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                            <button
                                                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                                                                onClick={() => handleRemoveImage(index)}
                                                            >
                                                                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {images.length < 5 && (
                                                        <label className="w-24 h-24 border-2 border-dashed border-[#02020238] rounded-lg flex flex-col text-sm space-y-2 font-cabin text-[#17171B]/80 items-center justify-center cursor-pointer">
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handleImageUpload}
                                                                multiple
                                                            />
                                                            Add Image
                                                            <Icon icon="solar:add-circle-bold" className="w-6 h-6" />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Shipping & Pricing */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className='text-base lg:text-lg font-cabin font-medium mb-5'>
                                            {productStatus === 'offline_auction' ? 'Auction Details & Shipping' : 'Shipping & Pricing'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {productStatus === 'offline_auction' ? (
                                            <>
                                                {/* Auction Details */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <RequiredLabel>Minimum Bid</RequiredLabel>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                placeholder="0.00"
                                                                value={auctionDetails.minBid}
                                                                onChange={(e) => {
                                                                    setAuctionDetails(prev => ({
                                                                        ...prev,
                                                                        minBid: e.target.value
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <RequiredLabel>Maximum Bid</RequiredLabel>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                placeholder="0.00"
                                                                value={auctionDetails.maxBid}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    setAuctionDetails(prev => ({
                                                                        ...prev,
                                                                        maxBid: value
                                                                    }));
                                                                    setShippingDetails(prev => ({
                                                                        ...prev,
                                                                        pricing: value
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Rest of auction details component */}
                                                {/* Date Picker Row */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <RequiredLabel>Start Date & Time</RequiredLabel>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="datetime-local"
                                                                value={auctionDetails.startDate}
                                                                onChange={(e) => setAuctionDetails(prev => ({
                                                                    ...prev,
                                                                    startDate: e.target.value
                                                                }))}
                                                                className="flex-1"
                                                            />
                                                            <Button 
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    // Set to current time plus 5 minutes
                                                                    const now = new Date();
                                                                    now.setMinutes(now.getMinutes() + 5);
                                                                    const dateString = now.toISOString().slice(0, 16);
                                                                    setAuctionDetails(prev => ({
                                                                        ...prev,
                                                                        startDate: dateString
                                                                    }));
                                                                }}
                                                                className="whitespace-nowrap bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                                                            >
                                                                Start Now
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <RequiredLabel>End Date & Time</RequiredLabel>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="datetime-local"
                                                                value={auctionDetails.endDate}
                                                                onChange={(e) => setAuctionDetails(prev => ({
                                                                    ...prev,
                                                                    endDate: e.target.value
                                                                }))}
                                                                className="flex-1"
                                                            />
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    if (!auctionDetails.startDate) {
                                                                        toast.error("Please set start date first");
                                                                        return;
                                                                    }
                                                                    
                                                                    const startDate = new Date(auctionDetails.startDate);
                                                                    const endDate = new Date(startDate);
                                                                    
                                                                    // Add duration based on selection
                                                                    switch(value) {
                                                                        case '1day':
                                                                            endDate.setDate(endDate.getDate() + 1);
                                                                            break;
                                                                        case '3days':
                                                                            endDate.setDate(endDate.getDate() + 3);
                                                                            break;
                                                                        case '7days':
                                                                            endDate.setDate(endDate.getDate() + 7);
                                                                            break;
                                                                        case '14days':
                                                                            endDate.setDate(endDate.getDate() + 14);
                                                                            break;
                                                                        case '30days':
                                                                            endDate.setDate(endDate.getDate() + 30);
                                                                            break;
                                                                        default:
                                                                            break;
                                                                    }
                                                                    
                                                                    setAuctionDetails(prev => ({
                                                                        ...prev,
                                                                        endDate: endDate.toISOString().slice(0, 16)
                                                                    }));
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-[100px]">
                                                                    <SelectValue placeholder="Duration" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="1day">1 Day</SelectItem>
                                                                    <SelectItem value="3days">3 Days</SelectItem>
                                                                    <SelectItem value="7days">7 Days</SelectItem>
                                                                    <SelectItem value="14days">14 Days</SelectItem>
                                                                    <SelectItem value="30days">30 Days</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* End on max bid checkbox */}
                                                <div className="flex items-center p-3 border border-purple-200 bg-purple-50 rounded-lg">
                                                    <Checkbox
                                                        id="endOnMaxBid"
                                                        checked={auctionDetails.endOnMaxBid}
                                                        onCheckedChange={(checked) => setAuctionDetails(prev => ({
                                                            ...prev,
                                                            endOnMaxBid: checked
                                                        }))}
                                                        className="border-purple-500 data-[state=checked]:bg-purple-500"
                                                    />
                                                    <label
                                                        htmlFor="endOnMaxBid"
                                                        className="ml-2 text-sm font-medium text-purple-800"
                                                    >
                                                        End auction immediately when maximum bid is reached
                                                    </label>
                                                </div>
                                                
                                                {/* Fixed inventory notice for auction */}
                                                <div className="p-3 bg-[#17171B]/5 rounded-lg flex items-center gap-2">
                                                    <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-[#17171B]/70" />
                                                    <p className="text-sm text-[#17171B]/70">
                                                        Auction inventory is automatically set to 1 item.
                                                    </p>
                                                </div>
                                                
                                                {/* Shipping Information */}
                                                <div className="pt-4 border-t border-gray-200">
                                                    <h3 className="text-base font-medium mb-4">Shipping Information</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Weight</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.0"
                                                                    value={shippingDetails.weight}
                                                                    onChange={(e) => handleShippingChange('weight', e.target.value)}
                                                                    className="flex-1"
                                                                />
                                                                <Select
                                                                    value={shippingDetails.weightUnit}
                                                                    onValueChange={(value) => handleShippingChange('weightUnit', value)}
                                                                >
                                                                    <SelectTrigger className="w-20">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="kg">kg</SelectItem>
                                                                        <SelectItem value="g">g</SelectItem>
                                                                        <SelectItem value="lb">lb</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Condition</Label>
                                                            <Select
                                                                value={shippingDetails.condition}
                                                                onValueChange={(value) => handleShippingChange('condition', value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="fairly-used">Fairly Used</SelectItem>
                                                                    <SelectItem value="new">New</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 space-y-2">
                                                        <Label>Dimensions</Label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <Input
                                                                placeholder="Length"
                                                                value={shippingDetails.dimensions.length}
                                                                onChange={(e) => handleShippingChange('dimensions.length', e.target.value)}
                                                                className="rounded-lg text-center"
                                                            />
                                                            <Input
                                                                placeholder="Width"
                                                                value={shippingDetails.dimensions.width}
                                                                onChange={(e) => handleShippingChange('dimensions.width', e.target.value)}
                                                                className="rounded-lg text-center"
                                                            />
                                                            <Input
                                                                placeholder="Height"
                                                                value={shippingDetails.dimensions.height}
                                                                onChange={(e) => handleShippingChange('dimensions.height', e.target.value)}
                                                                className="rounded-lg text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 space-y-2">
                                                        <RequiredLabel>Inventory</RequiredLabel>
                                                        <Input
                                                            type="number"
                                                            placeholder="1"
                                                            value="1"
                                                            disabled
                                                            className="bg-gray-100"
                                                            onChange={() => {}} // Empty handler
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Regular product shipping & pricing section */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <RequiredLabel>Pricing</RequiredLabel>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                placeholder="0.00"
                                                                value={shippingDetails.pricing}
                                                                onChange={(e) => handleShippingChange('pricing', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Weight</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="0.0"
                                                                value={shippingDetails.weight}
                                                                onChange={(e) => handleShippingChange('weight', e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Select
                                                                value={shippingDetails.weightUnit}
                                                                onValueChange={(value) => handleShippingChange('weightUnit', value)}
                                                            >
                                                                <SelectTrigger className="w-20">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="kg">kg</SelectItem>
                                                                    <SelectItem value="g">g</SelectItem>
                                                                    <SelectItem value="lb">lb</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <RequiredLabel>Inventory</RequiredLabel>
                                                        <Input
                                                            type="number"
                                                            placeholder="102"
                                                            value={shippingDetails.inventory}
                                                            onChange={(e) => {
                                                                const value = Math.max(1, parseInt(e.target.value) || 1);
                                                                handleShippingChange('inventory', value);
                                                            }}
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Condition</Label>
                                                        <Select
                                                            value={shippingDetails.condition}
                                                            onValueChange={(value) => handleShippingChange('condition', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="fairly-used">Fairly Used</SelectItem>
                                                                <SelectItem value="new">New</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                                        <Label>Dimensions</Label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <Input
                                                                placeholder="Length"
                                                                value={shippingDetails.dimensions.length}
                                                                onChange={(e) => handleShippingChange('dimensions.length', e.target.value)}
                                                                className="rounded-lg text-center"
                                                            />
                                                            <Input
                                                                placeholder="Width"
                                                                value={shippingDetails.dimensions.width}
                                                                onChange={(e) => handleShippingChange('dimensions.width', e.target.value)}
                                                                className="rounded-lg text-center"
                                                            />
                                                            <Input
                                                                placeholder="Height"
                                                                value={shippingDetails.dimensions.height}
                                                                onChange={(e) => handleShippingChange('dimensions.height', e.target.value)}
                                                                className="rounded-lg text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Variants Section */}
                                <VariantsProvider>
                                    <VariantSection />
                                </VariantsProvider>

                                {/* Blips Section */}
                                <Card>
                                    <CardHeader className="flex justify-between items-center">
                                        <CardTitle>Blips (Recommended)</CardTitle>
                                        <Button variant="link">What are blips?</Button>
                                    </CardHeader>
                                    <CardContent>
                                        {videos.length > 0 ? (
                                            <div className="space-y-4">
                                                {videos.map((video, index) => (
                                                    <div key={index} className="relative border rounded-lg overflow-hidden aspect-[9/16] max-w-[240px] mx-auto">
                                                        <video
                                                            src={video.url}
                                                            className="w-full h-full object-cover"
                                                            controls
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                                            onClick={() => {
                                                                setVideos(prev => prev.filter((_, i) => i !== index));
                                                                setSelectedFile(null);
                                                            }}
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <p className="text-sm text-gray-500 text-center">
                                                    {selectedFile?.name}
                                                </p>
                                            </div>
                                        ) : (
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
                                                onClick={() => !isUploading && document.getElementById('blip-upload').click()}
                                            >
                                                {isUploading ? (
                                                    <div className="space-y-4">
                                                        <Icon icon="solar:loading-bold" className="w-12 h-12 text-gray-400 mx-auto animate-spin" />
                                                        <div className="max-w-xs mx-auto space-y-2">
                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-[#17171B] transition-all duration-300 ease-out"
                                                                    style={{ width: `${uploadProgress}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-sm text-gray-500">
                                                                Uploading... {uploadProgress}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Icon icon="solar:video-add-bold" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                        <p className="font-medium mb-1">Click To Upload</p>
                                                        <p className="text-sm text-gray-500">
                                                            Upload A Vertical Video Max 60 Seconds, To Improve Visibility Of Your Products
                                                        </p>
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
                                    </CardContent>
                                </Card>
                            </div>
                        
                            {/* Right Section - Collapsible */}
                            <div className="lg:w-[300px] h-fit bg-[#F7F7F7] border border-[#00000024] rounded-lg ">
                                <Collapsible
                                    open={isRightPanelOpen}
                                    onOpenChange={setIsRightPanelOpen}
                                    className="bg-[#F7F7F7]  rounded-lg shadow-sm"
                                >

                                    <CollapsibleContent className="p-4 mt-3 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Upload Status</Label>
                                            <Select
                                                value={productStatus}
                                                onValueChange={setProductStatus}
                                                defaultValue="active"
                                            >
                                                <SelectTrigger className="rounded-full">
                                                    <SelectValue>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${
                                                                productStatus === 'active' ? 'bg-green-500' : 
                                                                productStatus === 'offline_auction' ? 'bg-purple-500' : 'bg-orange-500'
                                                                }`} />
                                                            {productStatus === 'offline_auction' ? 'Offline Auction' : 
                                                             productStatus.charAt(0).toUpperCase() + productStatus.slice(1)}
                                                        </div>
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                                            Active
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="draft">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                            Draft
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="offline_auction">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                            Offline Auction
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Vendor</Label>
                                            <Input value={sellerDetails?.firstName + " " + sellerDetails?.lastName} disabled />
                                        </div>

                                        <div className="hidden lg:block space-y-2 ">
                                            <div className="space-y-2">
                                                <RequiredLabel>Category & Sub-Category</RequiredLabel>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCategoryModalOpen(true)}
                                                    className="w-full flex items-center justify-between gap-2 p-3 border border-[#02020238] bg-white rounded-lg hover:border-gray-400 transition-colors text-left"
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
                                                            <div className="inline-flex flex-wrap items-center px-3 py-1  rounded-lg text-xs bg-[#17171B]/10 text-[#17171B] border border-[#17171B]/20">
                                                                <span className="font-medium mr-1">Subcategory:</span> {selectedSubCategory}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Brand Name</Label>
                                            <Input
                                                value={brand}
                                                onChange={(e) => setBrand(e.target.value)}
                                                placeholder="Enter brand name"
                                                className="rounded-full"
                                            />
                                        </div>

                                        {/* Content Diagnosis */}
                                        <div className="bg-[#17171B] text-white p-4 rounded-lg mt-6">
                                            <h3 className="text-lg font-semibold mb-4">Content Diagnosis</h3>
                                            <p>
                                                {
                                                    contentProgress === 100 ? 'Your product content is complete and ready to be published' :
                                                        contentProgress > 50 ? 'Your product content is almost complete, please add more details' :
                                                            'Your product content is incomplete, please add more details'
                                                }
                                            </p>
                                            <div className="h-2 rounded-full my-2 overflow-hidden bg-gray-700">
                                                <div
                                                    className={`h-full transition-all duration-500 ${contentProgress === 100
                                                        ? 'bg-green-500'
                                                        : contentProgress > 50
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-600'
                                                        }`}
                                                    style={{ width: `${contentProgress}%` }}
                                                />
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                {getContentConditions().map((condition, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Icon
                                                            icon={condition.met ? "solar:check-circle-bold" : "solar:close-circle-bold"}
                                                            className={condition.met ? "text-green-500" : "text-red-500"}
                                                        />
                                                        <span className="text-sm">{condition.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </div>

                        {/* Bottom Action Buttons */}
                        <div className="flex flex-wrap justify-end gap-4 mt-6">
                            <Button onClick={handleCancelButton} variant="outline">Cancel</Button>
                            <Button 
                                onClick={handleSubmitProduct} 
                                className="bg-[#17171B]/90 disabled:opacity-50 disabled:cursor-not-allowed" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Publishing...' : 'Publish Product'}
                            </Button>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default AddProduct;