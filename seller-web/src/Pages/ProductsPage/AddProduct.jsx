import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Icon } from "@iconify/react";
//import { useNavigation, useOutletContext } from "react-router-dom";
{/*import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../Components/ui/popover";
import { Crisp } from "crisp-sdk-web";
import AlertNotification from '../../Components/ui/AlertNotification';*/}
import {
    Collapsible,
    CollapsibleContent,
} from "../../Components/ui/collapsible";
import { Button } from "../../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Label } from "../../Components/ui/label";
import { Input } from "../../Components/ui/input2";
import { Textarea } from "../../Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select";
import { BASE_URL } from '../../Constants/Server';
import { toast } from 'sonner';
//import { useAuthContext } from '../../Hooks/useAuthContext';
//import { useProductContext } from '../../Hooks/useProductContext';
import { useSelector, useDispatch } from 'react-redux';
import UploadImage from '../../assets/upload-image.png';
import LinearProgress from '@mui/material/LinearProgress';
import axios from 'axios';
import { createProduct } from '../../Redux/Slices/ProductSlice';
import Header from '../../Components/ui/Header/Header';
import NoCatImage from '../../assets/no-cat.png';
import ProductSpecifications from '../../Components/ui/ProductCategoryUploadUi/ProductSpecifications';
import PropTypes from 'prop-types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../Components/ui/tooltip";
import { cn } from '../../lib/utils';
import { VariantsProvider, useVariants } from '../../Contexts/VariantContext'
import VariantOptions from '../../Components/ui/VariantComponents/VariantOptions';
import VariantCard from '../../Components/ui/VariantComponents/VariantCard';
import VariantCombinations from '../../Components/ui/VariantComponents/VariantCombinations';
import VariantImageUpload from '../../Components/ui/VariantComponents/VariantImageUpload';
import VariantCombinationsMobile from '../../Components/ui/VariantComponents/VariantCombinationsMobile';
import AddOptionCard from '../../Components/ui/VariantComponents/AddOptionCard';

const AddProduct = () => {
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
    const [showVariants, setShowVariants] = useState(false);
    const [newVariant, setNewVariant] = useState({
        size: '',
        price: null,
        stock: null
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSizeForm, setShowSizeForm] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');
    const [showColorForm, setShowColorForm] = useState(false);
    const [colors, setColors] = useState([]);
    const [newColor, setNewColor] = useState('');
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
    const [productSpecs, setProductSpecs] = useState({});
    const [variantOptions, setVariantOptions] = useState({
        main: { name: '', values: [] },
        sub: { name: '', values: [] }
    });
    const [variantCombinations, setVariantCombinations] = useState([]);
    const [tempOptionValues, setTempOptionValues] = useState(['']);
    const [expandedOption, setExpandedOption] = useState(null);
    const [expandedVariants, setExpandedVariants] = useState(new Set());
    const [allExpanded, setAllExpanded] = useState(false);
    const [variants, setVariants] = useState([]);
    const [variantInputs, setVariantInputs] = useState({});
    const [showOptions, setShowOptions] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const { options, deleteOption, tempInputs, updateVariantValue, toggleExpanded, areAllVariantsFilled, variantStructure } = useVariants();
    const [showAddOption, setShowAddOption] = useState(false);
    const [editingVariantId, setEditingVariantId] = useState(null);

    // Define addColorVariant BEFORE using it in other hooks
    const addColorVariant = useCallback((colorVariant) => {
        setVariants(prev => {
            const existingIndex = prev.findIndex(v => v.id === colorVariant.id);
            if (existingIndex !== -1) {
                return prev.map((variant, index) =>
                    index === existingIndex
                        ? { ...variant, name: "Color", value: colorVariant.value }
                        : variant
                );
            }
            return [...prev, {
                id: colorVariant.id,
                name: "Color",
                value: colorVariant.value,
                subVariants: []
            }];
        });
    }, []);

    // Now we can use addColorVariant in other hooks
    const handleDoneOption = useCallback((optionId) => {
        const option = variantOptions.find(opt => opt.id === optionId);
        const validValues = tempOptionValues.filter(value => value.trim() !== '');

        setVariantOptions(prev => prev.map(opt =>
            opt.id === optionId
                ? { ...opt, isExpanded: false, values: validValues }
                : opt
        ));

        if (option.name.toLowerCase() === 'color') {
            validValues.forEach(value => {
                addColorVariant({
                    id: crypto.randomUUID(),
                    value: value
                });
            });
        }

        setExpandedOption(null);
        setTempOptionValues(['']);
    }, [variantOptions, tempOptionValues, addColorVariant]);

    const handleSpecificationsChange = (specs) => {
        setProductSpecs(specs);
    };

    console.log('productSpecs:', productSpecs)

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
                    background: '#05031F',
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
                    background: '#05031F',
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
                        background: '#05031F',
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
        const formData = new FormData();

        // Process variants data to match the required JSON structure
        const processVariants = () => {
            return variantStructure.map(mainVariant => ({
                name: mainVariant.name,
                value: mainVariant.value,
                price: parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing), // Use main product price as fallback
                totalStock: mainVariant.subVariants.reduce((total, subVar) => 
                    total + subVar.subSubVariants.reduce((subTotal, subSubVar) => 
                        subTotal + (parseInt(subSubVar.stock) || 0), 0
                    ), 0
                ),
                images: mainVariant.images.map(img => ({
                    data: img.url,
                    contentType: img.type || 'image/jpeg'
                })) || [],
                subVariants: mainVariant.subVariants.map(subVariant => ({
                    name: subVariant.name,
                    value: subVariant.value,
                    price: parseFloat(subVariant.price) || parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing),
                    stock: subVariant.subSubVariants.reduce((total, subSubVar) => 
                        total + (parseInt(subSubVar.stock) || 0), 0
                    ),
                    images: subVariant.images.map(img => ({
                        data: img.url,
                        contentType: img.type || 'image/jpeg'
                    })) || [],
                    subSubVariants: subVariant.subSubVariants.map(subSubVariant => ({
                        name: subSubVariant.name,
                        value: subSubVariant.value,
                        price: parseFloat(subSubVariant.price) || parseFloat(subVariant.price) || parseFloat(mainVariant.price) || parseFloat(shippingDetails.pricing),
                        stock: parseInt(subSubVariant.stock) || 0,
                        sku: `${skuNumber}-${mainVariant.value}-${subVariant.value}-${subSubVariant.value}`.toUpperCase().replace(/\s+/g, '-'),
                        images: subSubVariant.images.map(img => ({
                            data: img.url,
                            contentType: img.type || 'image/jpeg',
                            isDefault: img.isDefault || false
                        })) || []
                    }))
                }))
            }));
        };

        // Process and append variants
        const processedVariants = processVariants();
        console.log('Processed Variants:', JSON.stringify(processedVariants, null, 2)); // For verification
        formData.append('variants', JSON.stringify(processedVariants));

        // Handle main product images
        for (let i = 0; i < images.length; i++) {
            const base64Response = await fetch(images[i].url);
            const blob = await base64Response.blob();
            const file = new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
            formData.append('images', file);
        }

        // Handle video if exists
        if (videos.length > 0) {
            const base64Response = await fetch(videos[0].url);
            const blob = await base64Response.blob();
            const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
            formData.append('blips', file);
        }

        // Basic data
        formData.append('name', title);
        formData.append('description', description);
        formData.append('price', Number(shippingDetails.pricing));
        formData.append('salePrice', Number(shippingDetails.salePrice));
        formData.append('weight', Number(shippingDetails.weight));
        formData.append('stock', Number(shippingDetails.inventory));
        formData.append('condition', shippingDetails.condition);

        // Shipping info
        formData.append('shippingInfo', JSON.stringify({
            weight: {
                value: Number(shippingDetails.weight),
                unit: shippingDetails.weightUnit
            },
            dimensions: {
                length: Number(shippingDetails.dimensions.length),
                width: Number(shippingDetails.dimensions.width),
                height: Number(shippingDetails.dimensions.height)
            },
            freeShipping: false,
            shippingClass: 'standard'
        }));

        // Basic fields
        formData.append('status', productStatus);
        formData.append('category', selectedCategory);
        formData.append('subCategory', selectedSubCategory);
        formData.append('sku', skuNumber);
        formData.append('upc', upcNumber);
        formData.append('brand', brand);

        // Add product specifications
        if (productSpecs) {
            Object.entries(productSpecs).forEach(([key, value]) => {
                if (value) {
                    if (Array.isArray(value)) {
                        formData.append(key, value.join(','));
                    } else {
                        formData.append(key, value);
                    }
                }
            });
        }

        // Validate and submit
        if (title && description && images.length > 0 && shippingDetails.pricing &&
            shippingDetails.weight && shippingDetails.inventory && shippingDetails.condition &&
            selectedCategory && selectedSubCategory && skuNumber && upcNumber && brand) {
            dispatch(createProduct(formData));
        } else {
            toast.error('Please fill all required fields');
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
            setProductSpecs({}); // Reset specifications
        }
    }, [response])

    const handleRemoveImage = (indexToRemove) => {
        setImages(prev => {
            const newImages = prev.filter((_, index) => index !== indexToRemove);
            // Revoke the Object URL to free up memory
            URL.revokeObjectURL(prev[indexToRemove].url);
            return newImages;
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
            <span className="text-[#FFFFFF] text-[8px] px-1.5 py-0.5 bg-[#05031F]/80 rounded-full backdrop-blur-sm border border-[#FFFFFF]/10">Required</span>
        </div>
    );

    RequiredLabel.propTypes = {
        children: PropTypes.node.isRequired
    };

    const handleAddNewOption = useCallback(() => {
        if (variantOptions.length >= 3) return;

        const newOption = {
            id: crypto.randomUUID(),
            name: '',
            values: [],
            isExpanded: true
        };

        setVariantOptions([...variantOptions, newOption]);
        setTempOptionValues(['']);
        setExpandedOption(newOption.id);
    }, [variantOptions]);

    const handleOptionNameChange = useCallback((optionId, name) => {
        setVariantOptions(prev => prev.map(opt =>
            opt.id === optionId ? { ...opt, name } : opt
        ));
    }, []);

    const handleOptionValueChange = useCallback((index, value) => {
        setTempOptionValues(prev => {
            const newValues = [...prev];
            newValues[index] = value;
            if (index === newValues.length - 1 && value !== '') {
                newValues.push('');
            }
            return newValues;
        });
    }, []);

    // Add this function to handle variant expansion
    const toggleVariantExpansion = (variantValue) => {
        setExpandedVariants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(variantValue)) {
                newSet.delete(variantValue);
            } else {
                newSet.add(variantValue);
            }
            return newSet;
        });
    };


    // Individual input components for maximum performance
    const PriceInput = memo(({ variantPath, value, onChange }) => {
        const { updateDraft, commitDraft, getDraftValue } = useVariants();
        const initialValue = getDraftValue(variantPath, 'price') || value;
        const [localValue, setLocalValue] = useState(initialValue);

        const handleChange = (e) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            updateDraft(variantPath, 'price', newValue);
        };

        return (
            <div className="w-40 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                <Input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    onBlur={() => commitDraft(variantPath)}
                    placeholder="0.00"
                    className="text-right pr-3 pl-8"
                />
            </div>
        );
    });
    PriceInput.displayName = 'PriceInput';

    const StockInput = memo(({ variantPath, value, onChange }) => {
        const { updateDraft, commitDraft, getDraftValue } = useVariants();
        const initialValue = getDraftValue(variantPath, 'stock') || value;
        const [localValue, setLocalValue] = useState(initialValue);

        const handleChange = (e) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            updateDraft(variantPath, 'stock', newValue);
        };

        return (
            <Input
                type="text"
                value={localValue}
                onChange={handleChange}
                onBlur={() => commitDraft(variantPath)}
                placeholder="stock"
                className="w-20 text-center"
            />
        );
    });
    StockInput.displayName = 'StockInput';

    const StockDisplay = memo(({ value }) => {
        return (
            <div className="w-20 h-10 bg-[#05031F]/10 flex items-center justify-center rounded-lg text-[#05031F]/50">
                {value || 0}
            </div>
        );
    });
    StockDisplay.displayName = 'StockDisplay';

    const ImageUploadSection = memo(({ images, onUpload, onRemove }) => {
        return (
            <div className="flex items-center gap-2">
                <div className="flex gap-2">
                    {images?.map((image, index) => (
                        <div key={index} className="relative w-12 h-12">
                            <img
                                src={image.data}
                                alt={`Variant ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(index);
                                }}
                                className="absolute -top-1 -right-1 bg-white rounded-full p-0.5"
                            >
                                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <label className="w-12 h-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                e.stopPropagation();
                                onUpload(e);
                            }}
                        />
                        <Icon icon="solar:gallery-add-bold" className="w-6 h-6 text-gray-400" />
                        <span className="text-[10px] text-gray-400">Upload</span>
                    </label>
                </div>
            </div>
        );
    });
    ImageUploadSection.displayName = 'ImageUploadSection';

    // Update VariantGroupHeader to use the new components
    const VariantGroupHeader = memo(({ variant, onToggle, isExpanded }) => {
        const {
            getTotalStock
        } = useVariants();

        // Memoize these values to prevent unnecessary re-renders
        const totalStock = useMemo(() => getTotalStock(variant.value), [getTotalStock, variant.value]);

        // Memoize the input handler
        const handleInputChange = useCallback((field, value) => {
            setVariantInputs(prev => ({
                ...prev,
                [variant.value]: {
                    ...prev[variant.value],
                    [field]: value
                }
            }));
        }, [variant.value]);

        // Keep ALL existing image handling code
        const handleVariantImageUpload = async (e, variantPath) => {
            const files = Array.from(e.target.files);
            const images = await Promise.all(files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({
                        data: reader.result,
                        contentType: file.type,
                        isDefault: false
                    });
                    reader.readAsDataURL(file);
                });
            }));

            if (images.length > 0) {
                images[0].isDefault = true;
            }

            setVariantInputs(prev => ({
                ...prev,
                [variantPath]: {
                    ...prev[variantPath],
                    images
                }
            }));
        };

        const handleVariantImageRemove = async (index, variantPath) => {
            setVariantInputs(prev => {
                const currentImages = prev[variantPath]?.images || [];
                const updatedImages = currentImages.filter((_, i) => i !== index);

                if (updatedImages.length > 0) {
                    updatedImages[0].isDefault = true;
                }

                return {
                    ...prev,
                    [variantPath]: {
                        ...prev[variantPath],
                        images: updatedImages
                    }
                };
            });
        };

        // Memoize all subvariant details outside the map
        const subVariantDetails = useMemo(() =>
            variant.subVariants?.reduce((acc, subVariant) => {
                const path = `${variant.value}${`_${subVariant[1]}`}${subVariant[2] ? `_${subVariant[2]}` : ''}`;
                acc[path] = variantInputs[path] || {};
                return acc;
            }, {}),
            [variant.subVariants, variant.value, variantInputs]
        );

        return (
            <div className="space-y-2">
                {/* Main variant row */}
                <div className="flex flex-wrap w-full items-center gap-4 p-3 border rounded-lg">
                    <input type="checkbox" className="w-4 h-4" onClick={e => e.stopPropagation()} />
                    {/* Image upload for main variant */}
                    <ImageUploadSection
                        images={variantInputs[variant.value]?.images}
                        onUpload={(e) => handleVariantImageUpload(e, variant.value)}
                        onRemove={(index) => handleVariantImageRemove(index, variant.value)}
                    />
                    <div className="flex flex-grow flex-wrap justify-between items-center gap-4">
                        <div className={cn(
                            "flex items-center gap-2 md:gap-4 flex-1",
                            variant.subVariants?.length > 0 && "cursor-pointer"
                        )} onClick={() => variant.subVariants?.length > 0 && onToggle(variant.value)}>
                            <div>
                                <div className="font-medium">{variant.value}</div>
                                {variant.subVariants?.length > 0 && (
                                    <div className="text-sm text-gray-500">
                                        {variant.subVariants.length} variants {isExpanded ? '▼' : '▶'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4" onClick={e => e.stopPropagation()}>
                            <PriceInput
                                variantPath={variant.value}
                                value={subVariantDetails.price || ''}
                                onChange={(e) => handleInputChange('price', e.target.value)}
                            />
                            <StockDisplay value={totalStock} />
                        </div>
                    </div>
                </div>

                {/* Sub-variants section */}
                {variant.subVariants?.length > 0 && isExpanded && (
                    <div className="pl-8 space-y-2">
                        {variant.subVariants.map((subVariant, index) => {
                            const subVariantPath = `${variant.value}${`_${subVariant[1]}`}${subVariant[2] ? `_${subVariant[2]}` : ''}`;
                            const subDetails = subVariantDetails[subVariantPath];

                            return (
                                <div key={index} className="flex flex-wrap items-center gap-4 p-3 bg-white border rounded-lg">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <div className="flex flex-wrap items-center gap-4">
                                        <ImageUploadSection
                                            images={variantInputs[subVariantPath]?.images}
                                            onUpload={(e) => handleVariantImageUpload(e, subVariantPath)}
                                            onRemove={(index) => handleVariantImageRemove(index, subVariantPath)}
                                        />
                                        <span>{`${subVariant[1]} ${subVariant[2] ? `/ ${subVariant[2]}` : ''}`}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <PriceInput
                                            variantPath={subVariantPath}
                                            value={subDetails.price || ''}
                                            onChange={(e) => handleInputChange('price', e.target.value)}
                                        />
                                        <StockInput
                                            variantPath={subVariantPath}
                                            value={subDetails.stock || ''}
                                            onChange={(e) => handleInputChange('stock', e.target.value)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    });
    VariantGroupHeader.displayName = 'VariantGroupHeader';

    VariantGroupHeader.propTypes = {
        variant: PropTypes.object.isRequired,
        onToggle: PropTypes.func.isRequired,
        isExpanded: PropTypes.bool.isRequired
    };

    // Add function to handle expand/close all
    const handleExpandAll = () => {
        if (allExpanded) {
            // Close all variants
            setExpandedVariants(new Set());
        } else {
            // Expand all variants that have sub-variants
            const variantsToExpand = variantOptions[0]?.values
                .filter(value => variantOptions[1]?.values?.length > 0);
            setExpandedVariants(new Set(variantsToExpand));
        }
        setAllExpanded(!allExpanded);
    };

    // Memoized input handlers
    const handleVariantInputChange = useCallback((variantPath, field, value) => {
        setVariantInputs(prev => ({
            ...prev,
            [variantPath]: {
                ...prev[variantPath],
                [field]: value
            }
        }));
    }, []);

    // Memoized variant handlers
    const addSizeVariant = useCallback((colorId, sizeVariant) => {
        setVariants(prev => prev.map(colorVar => {
            if (colorVar.id === colorId) {
                return {
                    ...colorVar,
                    subVariants: [...(colorVar.subVariants || []), {
                        id: sizeVariant.id,
                        name: "Size",
                        value: sizeVariant.value,
                        subSubVariants: []
                    }]
                };
            }
            return colorVar;
        }));
    }, []);

    const addMaterialVariant = useCallback((colorId, sizeId, materialVariant) => {
        setVariants(prev => prev.map(colorVar => {
            if (colorVar.id === colorId) {
                return {
                    ...colorVar,
                    subVariants: colorVar.subVariants.map(sizeVar => {
                        if (sizeVar.id === sizeId) {
                            return {
                                ...sizeVar,
                                subSubVariants: [...(sizeVar.subSubVariants || []), {
                                    id: materialVariant.id,
                                    name: "Material",
                                    value: materialVariant.value
                                }]
                            };
                        }
                        return sizeVar;
                    })
                };
            }
            return colorVar;
        }));
    }, []);

    // Memoized input component to prevent re-renders
    const VariantInput = memo(({ variantPath, field, value, onChange }) => {
        const handleChange = useCallback((e) => {
            onChange(variantPath, field, e.target.value);
        }, [variantPath, field, onChange]);

        return (
            <input
                type="number"
                value={value || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
            />
        );
    });

    // Transform variants for API submission
    const transformVariantsForSubmission = useCallback(() => {
        return variants.map(colorVar => ({
            name: "Color",
            value: colorVar.value,
            price: Number(variantInputs[colorVar.value]?.price || 0),
            totalStock: colorVar.subVariants.reduce((total, sizeVar) =>
                total + Number(variantInputs[`${colorVar.value}_${sizeVar.value}`]?.stock || 0), 0),
            images: variantInputs[colorVar.value]?.images || [],
            subVariants: colorVar.subVariants.map(sizeVar => ({
                name: "Size",
                value: sizeVar.value,
                price: Number(variantInputs[`${colorVar.value}_${sizeVar.value}`]?.price || 0),
                stock: Number(variantInputs[`${colorVar.value}_${sizeVar.value}`]?.stock || 0),
                images: variantInputs[`${colorVar.value}_${sizeVar.value}`]?.images || [],
                subSubVariants: (sizeVar.subSubVariants || []).map(materialVar => ({
                    name: "Material",
                    value: materialVar.value,
                    price: Number(variantInputs[`${colorVar.value}_${sizeVar.value}_${materialVar.value}`]?.price || 0),
                    stock: Number(variantInputs[`${colorVar.value}_${sizeVar.value}_${materialVar.value}`]?.stock || 0),
                    sku: `SWT-${colorVar.value}-${sizeVar.value}-${materialVar.value}`.toUpperCase(),
                    images: variantInputs[`${colorVar.value}_${sizeVar.value}_${materialVar.value}`]?.images || []
                }))
            }))
        }));
    }, [variants, variantInputs]);

    // Memoized variant section component
    const VariantSection = memo(() => {
        const [showAddOption, setShowAddOption] = useState(false);
        const [editingVariantId, setEditingVariantId] = useState(null);
        const { 
            options, 
            deleteOption, 
            setOptions,
            variantCombinations,
            expandedVariants,
            tempInputs,
            updateVariantValue,
            toggleExpanded 
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
                                <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                <p className="mt-2 text-gray-500">Add a new variant, there are none yet!!</p>
                            </div>
                            <Button
                                onClick={() => setShowAddOption(true)}
                                className="mt-4 lg:mt-12 bg-[#05031F] flex items-center justify-center gap-0 text-white rounded-full px-3 py-3 text-[11px] md:text-sm lg:px-3 lg:py-5 hover:bg-[#05031F]/80 hover:scale-95 transition-all duration-300 ease-in-out hover:text-white w-full md:w-auto"
                            >
                                <Icon icon="simple-line-icons:plus" className="w-4 h-4 mr-2" />
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
                                    className="w-full flex items-center text-sm md:text-base justify-center gap-2 rounded-lg px-3 py-2 bg-[#FFFFFF]/90 border border-gray-300 text-gray-500 hover:bg-[#FFFFFF]/80 hover:border-gray-500 hover:text-gray-700 transition-all duration-300 ease-in-out"
                                >
                                    <Icon icon="simple-line-icons:plus" className="w-4 h-4" />
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

    // Separate the VariantSection into its own memoized component
    const MemoizedVariantSection = memo(VariantSection);

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
                        <Header headerTitle="Edit Product" showHeader={true} showNotification notificationData='Need help? Visit the seller university for detailed guides' notificationColor='#05031F' notificationBackgroundColor="#0BB24847" notificationIcon='bi:info-circle' />
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
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Enter product description"
                                        className="min-h-[226px] rounded-2xl py-4 border border-[#02020238]"
                                    />
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
                                            {/* Product Specifications */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className='text-base lg:text-lg font-cabin font-medium'>Product Specifications</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {selectedCategory && selectedSubCategory ? (
                                                        <ProductSpecifications
                                                            category={selectedCategory}
                                                            subcategory={selectedSubCategory}
                                                            onSpecsChange={handleSpecificationsChange}
                                                        />
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                                            <p className="mt-2 text-gray-500">
                                                                Select a category and subcategory to view specifications
                                                            </p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

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
                                                                <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F96]">Upload Up To 5 Square Images With Dimensions Min Of 1024 X 1024, Max: 3200 X 3200</p>
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
                                                                    <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col text-sm space-y-2 font-cabin text-[#05031F]/80 items-center justify-center cursor-pointer">
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
                                                        <div>
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
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Weight (Optional)</Label>
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
                                                <MemoizedVariantSection />
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

                                    <CollapsibleContent className="p-4 space-y-4">
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
                                            <RequiredLabel>SKU</RequiredLabel>
                                            <Input
                                                value={skuNumber}
                                                onChange={(e) => setSkuNumber(e.target.value)}
                                                placeholder="store keeping unit"
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <RequiredLabel>UPC</RequiredLabel>
                                            <Input
                                                value={upcNumber}
                                                onChange={(e) => setUpcNumber(e.target.value)}
                                                placeholder="universal product code"
                                                className="rounded-full"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <RequiredLabel>Brand Name</RequiredLabel>
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
                                        <div className="bg-[#05031F] text-white p-4 rounded-lg mt-6">
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
                            <Button variant="outline">Cancel</Button>
                            <Button onClick={handleSubmitProduct} className="bg-[#05031F]">
                                {
                                    isLoading ? 'Publishing...' : 'Publish Product'
                                }
                            </Button>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default AddProduct;