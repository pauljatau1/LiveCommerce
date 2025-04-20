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
import { VariantsProvider, useVariants } from '../../Contexts/VariantContext'
import { getProductDetailsById, updateProduct, resetResponse } from '../../Redux/Slices/ProductSlice';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
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
import VariantCombinationsMobile from '../../Components/ui/VariantComponents/VariantCombinationsMobile';
import AddOptionCard from '../../Components/ui/VariantComponents/AddOptionCard';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

const EditProduct = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    //const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    //const { seller } = useAuthContext();
    const dispatch = useDispatch();
    const { id } = useParams();
    const navigate = useNavigate();
    const { message, error, isLoading, response, product } = useSelector(state => state.product)
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

    useEffect(() => {
        setHeaderName('Products')
        setNavName('Edit Product')
    }, [])

    console.log('productId', id)
    console.log('fetched product', product)

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
        dispatch(getProductDetailsById(id));
    }, [response]);

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
                    if (img?.url && img?.url.startsWith('https://')) {
                        return {
                            data: img?.url, // Handle both base64 with prefix and without
                            contentType: img?.contentType,
                            isDefault: img?.isDefault || false

                        };
                    } else {
                        // Otherwise, fetch from URL
                        const base64Response = await fetch(img.url);
                        const blob = await base64Response.blob();
                        const base64 = await convertBlobToBase64(blob);
                        return {
                            data: base64,
                            contentType: 'image/jpeg',
                            isDefault: img.isDefault || false
                        };
                    }
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
                            if (img?.url && img?.url.startsWith('https://')) {
                                return {
                                    data: img?.url, // Handle both base64 with prefix and without
                                    contentType: img?.contentType,
                                    isDefault: img?.isDefault || false
                                };
                            } else {
                                // Otherwise, fetch from URL
                                const base64Response = await fetch(img.url);
                                const blob = await base64Response.blob();
                                const base64 = await convertBlobToBase64(blob);
                                return {
                                    data: base64,
                                    contentType: 'image/jpeg',
                                    isDefault: img?.isDefault || false
                                };
                            }
                        }));

                        return {
                            name: subVariant.name,
                            value: subVariant.value,
                            price: parseFloat(subVariant.price) || parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing),
                            stock: parseInt(subVariant.stock) || 0,
                            images: subVariantImages,
                            subSubVariants: await Promise.all(subVariant.subSubVariants.map(async subSubVariant => {
                                const subSubVariantImages = await Promise.all((subSubVariant.images || []).map(async (img) => {
                                    if (img?.url && img?.url.startsWith('https://')) {
                                        return {
                                            data: img?.url, // Handle both base64 with prefix and without
                                            contentType: img?.contentType,
                                            isDefault: img?.isDefault || false
                                        };
                                    } else {
                                        // Otherwise, fetch from URL
                                        const base64Response = await fetch(img?.url);
                                        const blob = await base64Response.blob();
                                        const base64 = await convertBlobToBase64(blob);
                                        return {
                                            data: base64,
                                            contentType: 'image/jpeg',
                                            isDefault: img?.isDefault || false
                                        };
                                    }
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
                if (image?.url.startsWith('https://auqli-uploads.s3')) {
                    return {
                        data: image?.url,
                        contentType: image?.contentType,
                        isDefault: image?.isDefault || false
                    };
                }
                const base64Response = await fetch(image?.url);
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
                if (videos[0]?.url.startsWith('https://auqli-uploads.s3')) {
                    processedBlips.push({
                        data: videos[0]?.url,
                    });
                } else {
                    const base64Response = await fetch(videos[0]?.url);
                    const blob = await base64Response.blob();
                    const base64 = await convertBlobToBase64(blob);
                    processedBlips.push({
                        data: base64,
                    });
                }
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
                stock: Number(shippingDetails.inventory),
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

            // Comment out Add product specifications
            // if (productSpecs) {
            //     Object.entries(productSpecs).forEach(([key, value]) => {
            //         if (value) {
            //             productData[key] = Array.isArray(value) ? value.join(',') : value;
            //         }
            //     });
            // }

            console.log('submit product data', productData);
            
            // Validate all required fields and collect missing fields
            const missingFields = [];
            
            if (!title) missingFields.push('Product title');
            if (!description) missingFields.push('Product description');
            if (images.length === 0) missingFields.push('Product images');
            if (!shippingDetails.pricing) missingFields.push('Pricing information');
            if (!shippingDetails.weight) missingFields.push('Product weight');
            if (!shippingDetails.inventory) missingFields.push('Inventory quantity');
            if (!shippingDetails.condition) missingFields.push('Product condition');
            if (!selectedCategory) missingFields.push('Product category');
            if (!selectedSubCategory) missingFields.push('Product sub-category');

            // Submit if no missing fields, otherwise show specific error messages
            if (missingFields.length === 0) {
                dispatch(updateProduct({ productId: product._id, formData: productData }));
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
            toast.error('Failed to submit product', {
                description: error.message,
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        }
    };

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
        // Reset specifications
        // setProductSpecs({});
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
            <Card className="relative">
                <CardHeader>
                    <CardTitle>Variants (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col min-h-[400px]">
                    {options.length === 0 && !showAddOption ? (
                        // Initial empty state
                        <>
                            <div className="text-center py-8">
                                <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
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
                        <div className="space-y-4 h-full">
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

                            {/* Wrap combinations in a div with fixed height */}
                            {options.length > 0 && (
                                <div className="h-full max-h-[600px]">
                                    <div className="hidden md:block">
                                        <VariantCombinations />
                                    </div>
                                    <div className="md:hidden">
                                        <VariantCombinationsMobile />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    });

    VariantSection.displayName = 'VariantSection';

    // Populate form with product data when it's fetched, the structure to be fetched is the same as the one in the create product page, 
    // the only difference is that the product specs are not fetched, they are fetched in the product specifications component
    // the product specs are fetched in the product specifications component because the structure is different for each category and subcategory

    useEffect(() => {
        if (product && Object.keys(product).length > 0) {
            // Basic product info
            setTitle(product.name || '');
            setDescription(product.description || '');
            setSkuNumber(product.sku || '');
            setUpcNumber(product.upc || '');
            setBrand(product.brand || '');
            setSelectedCategory(product.category || '');
            setSelectedSubCategory(product.subCategory || '');
            setProductStatus(product.status || 'active');

            // Shipping details
            setShippingDetails({
                pricing: product.price || null,
                salePrice: product.salePrice || null,
                weight: product.shippingInfo?.weight?.value || null,
                weightUnit: product.shippingInfo?.weight?.unit || 'kg',
                inventory: product.stock || null,
                condition: product.condition || 'fairly-used',
                dimensions: {
                    length: product.shippingInfo?.dimensions?.length || null,
                    width: product.shippingInfo?.dimensions?.width || null,
                    height: product.shippingInfo?.dimensions?.height || null
                }
            });

            // Product images
            if (product.images && product.images.length > 0) {
                const formattedImages = product.images.map(img => ({
                    url: img.url,
                    contentType: 'image/jpeg',
                    isDefault: false
                }));
                if (formattedImages.length > 0) {
                    formattedImages[0].isDefault = true;
                }
                setImages(formattedImages);
            }

            // Product video
            if (product.blips && product.blips.length > 0) {
                setVideos([{ url: product.blips[0].url }]);
            }

            // Comment out Product specifications based on category and subcategory
            // if (product.category === 'Smartphones & Phones') {
            //     switch (product.subCategory) {
            //         case 'Smart Phones':
            //             setProductSpecs({
            //                 phones_operatingsystem: product.phones_operatingsystem || '',
            //                 phones_screensize: product.phones_screensize || '',
            //                 phones_storagecapacity: product.phones_storagecapacity || '',
            //                 phones_camera: product.phones_camera || '',
            //                 phones_batterylife: product.phones_batterylife || '',
            //                 phones_connectivity: product.phones_connectivity || '',
            //                 phones_simtype: product.phones_simtype || ''
            //             });
            //             break;
            //         // ... rest of the switch cases for phones
            //     }
            // }
            // else if (product.category === 'Computer Accessories') {
            //     // ... computer accessories cases
            // }
            // else if (product.category === 'Data Storage') {
            //     // ... data storage cases
            // }
            // else if (product.category === 'PC Components') {
            //     // ... PC components cases
            // }
        }
    }, [product]);

    useEffect(() => {
        if (product?.variants) {
            // Transform backend variants to match variantStructure format
            const transformedVariants = product.variants.map(variant => ({
                id: variant._id,
                name: variant.name,
                value: variant.value,
                price: variant.price.toString(),
                images: variant.images.map(img => ({
                    url: img.data,
                    contentType: img.contentType,
                    isDefault: false
                })),
                subVariants: variant.subVariants.map(subVar => ({
                    id: subVar._id,
                    name: subVar.name,
                    value: subVar.value,
                    price: subVar.price.toString(),
                    stock: subVar.stock.toString(),
                    images: subVar.images.map(img => ({
                        url: img.data,
                        contentType: img.contentType,
                        isDefault: false
                    })),
                    subSubVariants: subVar.subSubVariants.map(subSubVar => ({
                        id: subSubVar._id,
                        name: subSubVar.name,
                        value: subSubVar.value,
                        price: subSubVar.price.toString(),
                        stock: subSubVar.stock.toString(),
                        sku: subSubVar.sku,
                        images: subSubVar.images.map(img => ({
                            url: img.data,
                            contentType: img.contentType,
                            isDefault: false
                        }))
                    }))
                }))
            }));

            // Extract unique options for variant cards
            const options = [
                {
                    id: 'option-1',
                    name: product?.variants[0]?.name,
                    values: product?.variants?.map(v => v.value)
                },
                {
                    id: 'option-2',
                    name: product?.variants[0]?.subVariants[0]?.name,
                    values: [...new Set(product?.variants[0]?.subVariants?.map(sv => sv.value))]
                },
                {
                    id: 'option-3',
                    name: product?.variants[0]?.subVariants[0]?.subSubVariants[0]?.name,
                    values: [...new Set(product?.variants[0]?.subVariants[0]?.subSubVariants?.map(ssv => ssv.value))]
                }
            ];

            // Update variant context
            if (variantContextRef.current) {
                variantContextRef.current.setVariantStructure(transformedVariants);
                variantContextRef.current.setOptions(options);
            }
        }
    }, [product]);

    // Add effect to handle successful product update
    useEffect(() => {
        if (response === 'success') {
            toast.success("Product updated successfully!");
            navigate("/dashboard/products");
            // Reset the response state
            dispatch(resetResponse());
        }
    }, [response, navigate, dispatch]);

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
                        <div className="flex flex-col lg:flex-row mt-[15.5px] xl:mt-[31px] gap-4 relative">
                            {/* Left Section */}
                            <div className="flex-1 space-y-4 bg-[#F7F7F7] border border-[#00000024] rounded-lg py-3 lg:py-7 px-3 lg:px-6 ">
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
                                            placeholder="Enter product description"
                                            modules={quillModules}
                                            formats={quillFormats}
                                            className="min-h-[226px] rounded-2xl bg-white"
                                        />
                                    </div>
                                </div>

                                {/** mobile categories */}
                                <div className="flex lg:hidden flex-col gap-4">
                                    <div className="space-y-2">
                                        <RequiredLabel>Category</RequiredLabel>
                                        <Select
                                            value={selectedCategory}
                                            onValueChange={(value) => {
                                                setSelectedCategory(value);
                                                setSelectedSubCategory(''); // Reset subcategory when category changes
                                            }}
                                        >
                                            <SelectTrigger className="rounded-full">
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

                                    <div className="space-y-2">
                                        <Label>Sub-Category</Label>
                                        <Select
                                            value={selectedSubCategory}
                                            onValueChange={setSelectedSubCategory}
                                            disabled={!selectedCategory}
                                        >
                                            <SelectTrigger className="rounded-full">
                                                <SelectValue placeholder="Choose a sub-category..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getSubCategories(selectedCategory).map((subCategory) => (
                                                    <SelectItem
                                                        key={subCategory._id}
                                                        value={subCategory.name}
                                                    >
                                                        {subCategory.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {
                                    selectedCategory.length > 0 && selectedSubCategory.length > 0 ? (
                                        <>
                                            {/* Comment out Product Specifications */}
                                            {/* <Card>
                                                <CardHeader>
                                                    <CardTitle className='text-base lg:text-lg font-cabin font-medium'>Product Specifications</CardTitle>
                                                    <CardDescription className='text-sm lg:text-base font-cabin font-normal text-[#17171B96]'>Select specifications that apply to your product</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    {selectedCategory && selectedSubCategory ? (
                                                        <ProductSpecifications
                                                            category={selectedCategory}
                                                            subcategory={selectedSubCategory}
                                                            onSpecsChange={handleSpecificationsChange}
                                                            initialSpecs={productSpecs}
                                                        />
                                                    ) : (
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
                                                            <p className="mt-2 text-gray-500">
                                                                Select a category and subcategory to view specifications
                                                            </p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card> */}
                                            
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
                                                                    <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col text-sm space-y-2 font-cabin text-[#17171B]/80 items-center justify-center cursor-pointer">
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
                                                    <CardTitle className='text-base lg:text-lg font-cabin font-medium mb-5'>Shipping & Pricing</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                                        <div>
                                                            <RequiredLabel>Pricing</RequiredLabel>
                                                            <div className="relative space-y-2">
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
                                                        {/*<div>
                                                            <Label>On Sale Price</Label>
                                                            <div className="relative space-y-2">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                                                <Input
                                                                    type="number"
                                                                    className="pl-8"
                                                                    placeholder="0.00"
                                                                    value={shippingDetails.salePrice}
                                                                    onChange={(e) => handleShippingChange('salePrice', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>*/}
                                                        <div className="space-y-2">
                                                            <Label>Weight</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.0"
                                                                    value={shippingDetails.weight}
                                                                    onChange={(e) => handleShippingChange('weight', e.target.value)}
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
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                            <RequiredLabel>Inventory</RequiredLabel>
                                                            <Input
                                                                type="number"
                                                                placeholder="102"
                                                                value={shippingDetails.inventory}
                                                                onChange={(e) => handleShippingChange('inventory', e.target.value)}
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
                                                        <div className="col-span-2 space-y-2">
                                                            <Label>Dimensions</Label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        placeholder="L"
                                                                        value={shippingDetails.dimensions.length}
                                                                        onChange={(e) => handleShippingChange('dimensions.length', e.target.value)}
                                                                        className="rounded-lg xl:rounded-full text-start xl:text-center"
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        placeholder="W"
                                                                        value={shippingDetails.dimensions.width}
                                                                        onChange={(e) => handleShippingChange('dimensions.width', e.target.value)}
                                                                        className="rounded-lg xl:rounded-full text-start xl:text-center"
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        placeholder="H"
                                                                        value={shippingDetails.dimensions.height}
                                                                        onChange={(e) => handleShippingChange('dimensions.height', e.target.value)}
                                                                        className="rounded-lg xl:rounded-full text-start xl:text-center"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
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
                                                                                className="h-full bg-[#05031F] transition-all duration-300 ease-out"
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
                                        </>
                                    ) : (
                                        <div className="h-[500px] xl:h-1/2 flex flex-col justify-center items-center gap-2 xl:gap-4 ">
                                            <img src={NoCatImage} alt="No Category" className="w-15 h-15" />
                                            <p className="text-sm max-w-[170px] xl:max-w-none text-center xl:text-base text-gray-500">Please select a category and sub-category</p>
                                        </div>
                                    )
                                }
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
                                                            <span className={`w-2 h-2 rounded-full ${productStatus === 'active' ? 'bg-green-500' : 'bg-orange-500'
                                                                }`} />
                                                            {productStatus.charAt(0).toUpperCase() + productStatus.slice(1)}
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
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/*<div>
                                            <Label>Product Type</Label>
                                            <Input placeholder="Choose a product type..." />
                                        </div>*/}

                                        <div className="space-y-2">
                                            <Label>Vendor</Label>
                                            <Input value={sellerDetails?.firstName + " " + sellerDetails?.lastName} disabled />
                                        </div>

                                        <div className="hidden lg:block space-y-2 ">
                                            <div className="space-y-2">
                                                <RequiredLabel>Category</RequiredLabel>
                                                <Select
                                                    value={selectedCategory}
                                                    onValueChange={(value) => {
                                                        setSelectedCategory(value);
                                                        setSelectedSubCategory(''); // Reset subcategory when category changes
                                                    }}
                                                >
                                                    <SelectTrigger className="rounded-full">
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

                                            <div className="space-y-2">
                                                <Label>Sub-Category</Label>
                                                <Select
                                                    value={selectedSubCategory}
                                                    onValueChange={setSelectedSubCategory}
                                                    disabled={!selectedCategory}
                                                >
                                                    <SelectTrigger className="rounded-full">
                                                        <SelectValue placeholder="Choose a sub-category..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getSubCategories(selectedCategory).map((subCategory) => (
                                                            <SelectItem
                                                                key={subCategory._id}
                                                                value={subCategory.name}
                                                            >
                                                                {subCategory.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>SKU</Label>
                                            <Input
                                                value={skuNumber}
                                                onChange={(e) => setSkuNumber(e.target.value)}
                                                placeholder="store keeping unit"
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>UPC</Label>
                                            <Input
                                                value={upcNumber}
                                                onChange={(e) => setUpcNumber(e.target.value)}
                                                placeholder="universal product code"
                                                className="rounded-full"
                                            />
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

                                        {/*<div>
                                            <Label>Logistics Settings</Label>
                                            <Select defaultValue="auqli">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="auqli">Shipped Via Auqli</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Warehouse Location</Label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a Location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="loc1">Location 1</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>*/}

                                        {/* Content Diagnosis */}
                                        <div className="bg-[#17171B] text-white p-4 rounded-lg mt-6">
                                            <h3 className="text-lg font-semibold mb-4">Content Diagnosis</h3>
                                            <p>
                                                {
                                                    contentProgress === 100 ? 'Your product content is complete and ready to be updated' :
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
                            <Button disabled={isLoading} onClick={handleSubmitProduct} className="bg-[#17171B]/90 disabled:opacity-50">
                                {
                                    isLoading ? 'Updating...' : 'Update Product'
                                }
                            </Button>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default EditProduct;