import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from "@iconify/react";
import {
    Collapsible,
    CollapsibleContent,
} from "../../Components/ui/collapsible";
import { Button } from "../../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Label } from "../../Components/ui/label";
import { Input } from "../../Components/ui/input2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select";
import { BASE_URL } from '../../Constants/Server';
import { toast } from 'sonner';
//import { useAuthContext } from '../../Hooks/useAuthContext';
//import { useProductContext } from '../../Hooks/useProductContext';
import { useSelector, useDispatch } from 'react-redux';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { createProduct, resetResponse } from '../../Redux/Slices/ProductSlice';
import { VariantsProvider } from '../../Contexts/VariantContext'
import UploadImage from '../../assets/upload-image.png';
import LinearProgress from '@mui/material/LinearProgress';
import axios from 'axios';
import ImageEditModal from '../../Components/ui/ImageEditModal';

// Comment out ProductSpecifications import
// import ProductSpecifications from '../../Components/ui/ProductCategoryUploadUi/ProductSpecifications';
import PropTypes from 'prop-types';
import VariantSection from '../../Components/ui/VariantComponents/VariantSection';
import { Checkbox } from "../../Components/ui/checkbox";
import { debounce } from 'lodash';
import CategorySelectionModal from '../../Components/ui/CategorySelectionModal';
import SimpleEditor from '../../Components/ui/SimpleEditor';
import { useIntercomVisibility } from '../../Hooks/useIntercomVisibility';

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
    const [platformFee, setPlatformFee] = useState(0);
    const [skuNumber, setSkuNumber] = useState('');
    const [upcNumber, setUpcNumber] = useState('');
    const [brand, setBrand] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [contentProgress, setContentProgress] = useState(0);
    // Comment out productSpecs state
    // const [productSpecs, setProductSpecs] = useState({});
    // const { variantStructure } = useVariants(); // Commented out as it's not used in AddProduct
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [hasLinksInDescription, setHasLinksInDescription] = useState(false);
    const [detectedLinksInDescription, setDetectedLinksInDescription] = useState([]);
    
    // Image editing modal state
    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const [currentEditingImage, setCurrentEditingImage] = useState("");
    const [currentEditingFile, setCurrentEditingFile] = useState(null);

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

    // Hide the Intercom launcher for this component - high priority
    // This should run before any other effects
    useIntercomVisibility(true);

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

        // File size limit: 3MB
        const maxSize = 3 * 1024 * 1024; // 3MB in bytes
        const validFiles = [];
        const oversizedFiles = [];

        // Check file sizes
        filesToProcess.forEach(file => {
            if (file.size > maxSize) {
                oversizedFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        });

        // Show error for oversized files
        if (oversizedFiles.length > 0) {
            toast.error(`File${oversizedFiles.length > 1 ? 's' : ''} too large: ${oversizedFiles.join(', ')}`, {
                description: "Each image must be less than 3MB",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        }

        // Process valid files only
        if (validFiles.length === 0) {
            return;
        }

        // Process each valid file and check dimensions
        for (const file of validFiles) {
            try {
                const dimensions = await checkImageDimensions(file);
                
                if (dimensions.isMobileScreenshot) {
                    // Show image editing modal for mobile screenshot-like images
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setCurrentEditingImage(reader.result);
                        setCurrentEditingFile(file);
                        setIsImageEditModalOpen(true);
                    };
                    reader.readAsDataURL(file);
                    
                    toast.warning('Image has mobile screenshot aspect ratio. Please edit it for better product display.');
                    // Process only the first problematic image to avoid multiple modals
                    break;
                } else {
                    // Process normally if aspect ratio is acceptable
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const newImage = {
                            url: reader.result,
                            contentType: file.type,
                            isDefault: images.length === 0 // First image is default
                        };
                        setImages(prev => [...prev, newImage]);
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error('Error checking image dimensions:', error);
                toast.error(`Failed to process ${file.name}`);
            }
        }

        // Show message if some files were not processed due to limit
        if (files.length > remainingSlots) {
            toast.warning(`Only ${remainingSlots} image${remainingSlots > 1 ? 's' : ''} added. Maximum limit reached.`);
        }

        // Clear the file input to allow selecting the same file again
        e.target.value = '';
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

    // Helper function to check if image has mobile screenshot aspect ratio
    const isMobileScreenshotAspectRatio = (width, height) => {
        const aspectRatio = width / height;
        
        // Mobile screenshots typically have aspect ratios less than 0.8 (height > 1.25 * width)
        // Common mobile screenshot ratios: 9:16 (0.5625), 9:18 (0.5), 9:19.5 (0.46), etc.
        // We'll use 0.8 as threshold - images narrower than this are likely mobile screenshots
        const MOBILE_SCREENSHOT_THRESHOLD = 0.8;
        
        return aspectRatio < MOBILE_SCREENSHOT_THRESHOLD;
    };

    // Helper function to check image dimensions
    const checkImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: img.naturalWidth / img.naturalHeight,
                    isMobileScreenshot: isMobileScreenshotAspectRatio(img.naturalWidth, img.naturalHeight)
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

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
                    totalStock: mainVariant.totalStock || mainVariant.subVariants.reduce((total, subVar) =>
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
            
            // Check for links in description before validation
            if (hasLinksInDescription) {
                toast.error('Product description contains links', {
                    description: `Please remove the following links: ${detectedLinksInDescription.join(', ')}`,
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
                return;
            }

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

    // VariantSection component moved to external file

    // Add handler for category selection from modal
    const handleCategorySelection = (category, subCategory) => {
        const selectedCategoryObj = categories.find(cat => cat.name === category);
        setSelectedCategory(category);
        setSelectedSubCategory(subCategory || '');
        setPlatformFee(selectedCategoryObj?.platformFee || 0);
    };

    // Handle link detection in description
    const handleLinkDetection = (hasLinks, links) => {
        setHasLinksInDescription(hasLinks);
        setDetectedLinksInDescription(links);
    };

    // Handler for saving edited image
    const handleSaveEditedImage = (editedImageData) => {
        const newImage = {
            url: editedImageData.url,
            contentType: editedImageData.contentType,
            isDefault: images.length === 0 // First image is default
        };
        setImages(prev => [...prev, newImage]);
        toast.success('Image added successfully after editing!');
    };

    // Handler for closing image edit modal
    const handleCloseImageEditModal = () => {
        setIsImageEditModalOpen(false);
        setCurrentEditingImage("");
        setCurrentEditingFile(null);
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
                            loading={loading}
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
                                        <SimpleEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Enter detailed product description"
                                            className="min-h-[226px] rounded-2xl bg-white"
                                            onLinkDetected={handleLinkDetection}
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
                                                        <div className="space-y-2">
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
                                                            {selectedCategory && (
                                                                <div className="space-y-1">
                                                                    <div className="text-sm text-gray-600">
                                                                        Platform Fee: {platformFee}% ({shippingDetails.pricing ? `₦${(shippingDetails.pricing * platformFee / 100).toFixed(2)}` : '₦0.00'})
                                                                    </div>
                                                                    <div className="text-sm font-medium text-green-600">
                                                                        You Receive: {shippingDetails.pricing ? `₦${(shippingDetails.pricing * (100 - platformFee) / 100).toFixed(2)}` : '₦0.00'} ({100 - platformFee}% of sale)
                                                                    </div>
                                                                </div>
                                                            )}
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
                                    <VariantSection variantContextRef={variantContextRef} />
                                </VariantsProvider>
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
                                                    {/* offline auction is now disabled and set to coming soon per management request
                                                    <SelectItem value="offline_auction">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                            Offline Auction
                                                        </div>
                                                    </SelectItem>*/}
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

            {/* Image Edit Modal */}
            <ImageEditModal
                isOpen={isImageEditModalOpen}
                onClose={handleCloseImageEditModal}
                image={currentEditingImage}
                onSave={handleSaveEditedImage}
                originalFile={currentEditingFile}
            />
        </>
    );
};

export default AddProduct;