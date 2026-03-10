import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addProductSchema, AddProductFormValues } from '../../schemas/addProductSchema';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, resetResponse } from '../../Redux/Slices/ProductSlice';
import { useNotification } from '../../Hooks/useNotification';
import { BASE_URL } from '../../Constants/Server';
import axios from 'axios';
import { Select, Spin, Modal, ConfigProvider } from 'antd';
import CustomCircularProgress from '../../Components/ui/CustomCircularProgress';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import { X, Upload, Check, AlertCircle, Plus, Eye, Save } from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Input } from '../../Components/ui/input2';
import { Label } from '../../Components/ui/label';
import { Checkbox } from '../../Components/ui/checkbox';
import { Switch } from '../../Components/ui/switch';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@/assets/icons/CheckIcon';
import GlassImage from '@/Components/ui/GlassImageV2';
import EyeOpenIcon from '@/assets/icons/EyeOpenIcon';
import UploadIcon from '@/assets/icons/UploadIcon';
import { VariantsProvider } from '../../Contexts/VariantContext';
import VariantSection from '../../Components/ui/VariantComponents/VariantSection';
import { VariantContextType } from '../../types/variants';
import { Icon } from '@iconify/react';

const { Option } = Select;

// Helper function to detect links
const URL_PATTERNS = [
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
    /www\.[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
    /\b[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]*\.(com|org|net|edu|gov|mil|int|co|uk|ca|au|de|fr|jp|cn|in|br|ru|it|es|nl|se|no|dk|fi|pl|be|ch|at|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|ie|pt|gr|is|lu|mt|cy|tr|il|za|ng|ke|gh|ug|tz|mw|zm|zw|bw|sz|ls|na|ao|mz|mg|mu|sc|km|dj|so|er|et|sd|ly|eg|ma|tn|dz|mr|ml|bf|ne|td|cf|cm|gq|ga|cg|cd|st|gw|gn|sl|lr|ci|gh|tg|bj|sn|gm|cv|mr|eh)\b/gi,
];

const DesktopAddProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { isLoading, response } = useSelector((state: any) => state.product);

    // State for categories
    const [previewOpen, setPreviewOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // State for editor link warning
    const [linkWarning, setLinkWarning] = useState(false);
    const [detectedLinks, setDetectedLinks] = useState<string[]>([]);

    // State for image upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const variantContextRef = useRef<VariantContextType | null>(null);
    const [imageUploadLoading, setImageUploadLoading] = useState(false);

    // Form setup
    const { control, handleSubmit, watch, setValue, formState: { errors, isValid, } } = useForm<AddProductFormValues>({
        resolver: zodResolver(addProductSchema) as any,
        defaultValues: {
            status: 'active',
            weightUnit: 'kg',
            freeShipping: false,
            images: [],
            tags: [],
            condition: '',
            variants: []
        },
        mode: 'onChange'
    });

    const watchedValues = watch();

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const response = await axios.get(`${BASE_URL}/public/categories`);
                if (response.status === 200) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error(error);
                showNotification('Failed to fetch categories', 'error', 'dismissible');
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // Handle Category Change to filter SubCategories
    const handleCategoryChange = (categoryName: string) => {
        setValue('category', categoryName);
        setValue('subCategory', ''); // Reset subcategory
        const category = categories.find(cat => cat.name === categoryName);
        setSubCategories(category ? category.subCategories : []);
    };

    // Link detection in SunEditor
    const handleEditorChange = (content: string) => {
        setValue('description', content, { shouldValidate: true });

        // Simple link detection in HTML content
        const plainText = content.replace(/<[^>]*>/g, ' ');
        const foundLinks: string[] = [];

        URL_PATTERNS.forEach(pattern => {
            const matches = plainText.match(pattern);
            if (matches) {
                foundLinks.push(...matches);
            }
        });

        if (foundLinks.length > 0) {
            setLinkWarning(true);
            setDetectedLinks([...new Set(foundLinks)]);
            showNotification('Links are not allowed in description', 'warning', 'fixed');

            // Remove links logic could be complex with HTML editor, simplified for now:
            // Just warn user. Or we can strip them.
            // For now, let's just warn as per instruction "detect links added in the and block it".
            // Blocking could mean preventing submission or auto-removing.
            // Let's auto-remove after a delay or prevent further typing if possible.
            // Since SunEditor is a controlled component via onChange, we can strip it here.

            let cleanContent = content;
            // Very basic strip implementation - might need refinement
            // This part is tricky without breaking HTML structure. 
            // Better to rely on validation blocking submission if links exist.
        } else {
            setLinkWarning(false);
            setDetectedLinks([]);
        }
    };

    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentImages = watchedValues.images || [];
        const remainingSlots = 5 - currentImages.length;

        if (remainingSlots <= 0) {
            showNotification('Maximum 5 images allowed', 'warning', 'dismissible');
            return;
        }

        setImageUploadLoading(true);
        const newImages = [...currentImages];

        for (const file of files.slice(0, remainingSlots)) {
            // Check size (7MB limit)
            if (file.size > 7 * 1024 * 1024) {
                showNotification(`Image ${file.name} is too large (max 7MB)`, 'warning', 'dismissible');
                continue;
            }

            // Convert to base64 for preview
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise<void>((resolve) => {
                reader.onload = () => {
                    newImages.push({
                        url: reader.result as string,
                        file: file,
                        contentType: file.type,
                        isDefault: newImages.length === 0
                    });
                    resolve();
                };
            });
        }

        setValue('images', newImages, { shouldValidate: true });
        setImageUploadLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        const newImages = [...(watchedValues.images || [])];
        newImages.splice(index, 1);
        // Ensure one is default if list not empty
        if (newImages.length > 0 && !newImages.some(img => img.isDefault)) {
            newImages[0].isDefault = true;
        }
        setValue('images', newImages, { shouldValidate: true });
    };

    const setAsDefaultImage = (index: number) => {
        const newImages = (watchedValues.images || []).map((img, i) => ({
            ...img,
            isDefault: i === index
        }));
        setValue('images', newImages, { shouldValidate: true });
    };

    // Calculate completion percentage
    const calculateCompletion = () => {
        let completed = 0;
        let total = 7; // Title, Description, Category, Images, Price, Quantity, Weight

        if (watchedValues.title && watchedValues.title.length >= 3) completed++;
        if (watchedValues.description && watchedValues.description.length >= 10) completed++;
        if (watchedValues.category) completed++;
        if (watchedValues.images && watchedValues.images.length > 0) completed++;
        if (watchedValues.basePrice && watchedValues.basePrice > 0) completed++;
        if (watchedValues.quantity && watchedValues.quantity >= 1) completed++;
        if (watchedValues.weight && watchedValues.weight > 0) completed++;

        return Math.round((completed / total) * 100);
    };

    const completionPercentage = calculateCompletion();

    // Submit Handler
    const onSubmit = async (data: AddProductFormValues) => {
        if (linkWarning) {
            showNotification('Please remove links from description before submitting', 'error', 'dismissible');
            return;
        }

        try {
            // Prepare payload
            // Convert images to base64 (already done in upload for preview, but ensure format)
            // The thunk expects { data, contentType, isDefault } for images

            const processedImages = data.images?.map(img => {
                // If it's a data URL, strip the prefix
                const base64Data = img.url.includes(',') ? img.url.split(',')[1] : img.url;
                return {
                    data: base64Data,
                    contentType: img.contentType || 'image/jpeg',
                    isDefault: img.isDefault || false
                };
            });

            // Process variants
            const processVariantImages = (images: any[]) => {
                return (images || []).map((img: any) => {
                    const base64Data = img.url.includes(',') ? img.url.split(',')[1] : img.url;
                    return {
                        data: base64Data,
                        contentType: img.contentType || 'image/jpeg',
                        isDefault: img.isDefault || false
                    };
                });
            };

            const processedVariants = variantContextRef.current?.variantStructure?.map(mainVariant => {
                const mainVariantImages = processVariantImages(mainVariant.images);

                return {
                    name: mainVariant.name,
                    value: mainVariant.value,
                    price: parseFloat(mainVariant.price as string) || Number(data.basePrice),
                    totalStock: mainVariant.totalStock || (mainVariant.subVariants || []).reduce((total, subVar) =>
                        total + (parseInt(subVar.stock as string) || 0) +
                        (subVar.subSubVariants || []).reduce((subTotal, subSubVar) =>
                            subTotal + (parseInt(subSubVar.stock as string) || 0), 0
                        ), 0) || 1,
                    images: mainVariantImages,

                    subVariants: (mainVariant.subVariants || []).map(subVariant => {
                        const subVariantImages = processVariantImages(subVariant.images || []);

                        return {
                            name: subVariant.name,
                            value: subVariant.value,
                            price: parseFloat(subVariant.price as string) || parseFloat(mainVariant.price as string) || Number(data.basePrice),
                            stock: parseInt(subVariant.stock as string) || 0,
                            images: subVariantImages,
                            subSubVariants: (subVariant.subSubVariants || []).map(subSubVariant => {
                                const subSubVariantImages = processVariantImages(subSubVariant.images);

                                return {
                                    name: subSubVariant.name,
                                    value: subSubVariant.value,
                                    price: parseFloat(subSubVariant.price as string) || parseFloat(subVariant.price as string) || parseFloat(mainVariant.price as string) || Number(data.basePrice),
                                    stock: parseInt(subSubVariant.stock as string) || 0,
                                    sku: subSubVariant.sku || `SKU-${mainVariant.value}-${subVariant.value}-${subSubVariant.value}`.toUpperCase().replace(/\s+/g, '-'),
                                    images: subSubVariantImages
                                };
                            })
                        };
                    })
                };
            }) || [];

            // Convert weight to kg
            let weightInKg = Number(data.weight);
            if (data.weightUnit === 'g') weightInKg = data.weight / 1000;
            else if (data.weightUnit === 'lb') weightInKg = data.weight / 2.20462;
            else if (data.weightUnit === 'oz') weightInKg = data.weight / 35.274;

            const productData = {
                name: data.title,
                description: data.description,
                price: Number(data.basePrice),
                salePrice: Number(data.discountPrice || 0),
                weight: weightInKg,
                stock: Number(data.quantity),
                condition: data.condition,
                status: data.status,
                category: data.category,
                subCategory: data.subCategory,
                sku: `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, // Generate SKU
                brand: data.brand || '',
                images: processedImages,
                variants: processedVariants,
                shippingInfo: {
                    weight: { value: weightInKg, unit: 'kg' },
                    dimensions: {
                        length: Number(data.dimensions?.length || 10),
                        width: Number(data.dimensions?.width || 10),
                        height: Number(data.dimensions?.height || 10)
                    },
                    freeShipping: data.freeShipping || false,
                    shippingClass: 'standard'
                }
            };

            console.log('Submitting Product Data:', productData);
            //@ts-ignore - Dispatch expects ProductActionPayload, but createProduct returns ProductActionPayload & { response: string }
            await dispatch(createProduct(productData) as any).unwrap();

            // Success handling moved to useEffect watching 'response' state or handled by unwrap
            // Since productSlice sets response='success', we can rely on that or unwrap result.
            // Using unwrap allows catching rejection here.

        } catch (error) {
            console.error('Submission error:', error);
            // Notification is handled by the slice rejected case usually, but let's be safe
        }
    };

    useEffect(() => {
        if (response === 'success') {
            showNotification("Product added successfully!", "information", "dismissible");
            navigate("/dashboard/products");
            dispatch(resetResponse());
        }
    }, [response, navigate, dispatch, showNotification]);

    return (
        <div className="grid grid-cols-[1.5fr_1fr] gap-6 py-6 bg-gray-50 min-h-screen">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-6">

                {/* Status Selection */}
                <h4 className="text-sm font-bold text-gray-700">Choose your product visibility Status</h4>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setValue('status', 'active')}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 text-sm flex items-center justify-center gap-2 font-medium transition-colors",
                            watchedValues.status === 'active'
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watchedValues.status === 'active' ? "bg-green-500 border-green-500" : "border-gray-300")}>
                            <CheckIcon width={8} height={8} color='#FFFFFF' />
                        </div>
                        Active
                    </button>
                    <button
                        type="button"
                        onClick={() => setValue('status', 'draft')}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 text-sm flex items-center justify-center gap-2 font-medium transition-colors",
                            watchedValues.status === 'draft'
                                ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watchedValues.status === 'draft' ? "bg-yellow-500 border-yellow-500" : "border-gray-300")}>
                            <CheckIcon width={8} height={8} color='#FFFFFF' />
                        </div>
                        Save as Draft
                    </button>
                </div>

                {/* Product Title */}
                <div className="">
                    <Label className="mb-2 block text-sm 3xl:text-base text-[#344054] font-medium">Product title</Label>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} placeholder="Type in Product title" className="w-full" />
                        )}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                {/* Categories & Brand */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label className="mb-2 block text-sm text-[#344054] font-medium">Category</Label>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <ConfigProvider theme={{ token: { colorPrimary: '#10B981' } }}>
                                    <Select
                                        showSearch
                                        placeholder="Select Category"
                                        optionFilterProp="children"
                                        filterOption={(input, option) => {
                                            const normalize = (s: any) =>
                                                (s ?? '')
                                                    .toString()
                                                    .toLowerCase()
                                                    .replace(/\s+/g, '')
                                                    .replace(/[^a-z0-9]/g, '');
                                            const opt: any = option;
                                            const children = opt?.children;
                                            const valueStr = (opt?.value ?? '').toString();
                                            let textContent = '';
                                            if (typeof children === 'string') {
                                                textContent = children;
                                            } else if (Array.isArray(children)) {
                                                textContent = children
                                                    .map((c: any) => (typeof c === 'string' ? c : ''))
                                                    .join(' ');
                                            } else {
                                                textContent = valueStr;
                                            }
                                            const q = normalize(input);
                                            return (
                                                normalize(textContent).includes(q) ||
                                                normalize(valueStr).includes(q)
                                            );
                                        }}
                                        filterSort={(a, b) => {
                                            const toText = (opt: any) => {
                                                const children = opt?.children;
                                                if (typeof children === 'string') return children.toLowerCase();
                                                if (Array.isArray(children))
                                                    return children
                                                        .map((c: any) => (typeof c === 'string' ? c : ''))
                                                        .join(' ')
                                                        .toLowerCase();
                                                return (opt?.value ?? '').toString().toLowerCase();
                                            };
                                            return toText(a).localeCompare(toText(b));
                                        }}
                                        onChange={handleCategoryChange}
                                        value={field.value || undefined}
                                        className="w-full text-sm text-[#27272E]"
                                        size="large"
                                        loading={loadingCategories}
                                    >
                                        {categories.map(cat => (
                                            <Option key={cat._id} value={cat.name}>
                                                <div className='flex gap-2 items-center' >
                                                    <GlassImage src={cat.image.url} alt={cat.name} imageClassName="w-5 h-5 rounded-full" containerClassName="w-5 h-5 rounded-full" />
                                                    <p className='text-[13px] 3xl:text-sm '>{cat.name}</p>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </ConfigProvider>
                            )}
                        />
                        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                    </div>
                    <div>
                        <Label className="mb-2 block text-sm text-[#344054] font-medium">Sub Category</Label>
                        <Controller
                            name="subCategory"
                            control={control}
                            render={({ field }) => (
                                <ConfigProvider theme={{ token: { colorPrimary: '#10B981' } }}>
                                    <Select
                                        showSearch
                                        placeholder="Select Sub Category"
                                        optionFilterProp="children"
                                        onChange={field.onChange}
                                        value={field.value || undefined}
                                        className="w-full text-sm "
                                        size="large"
                                        disabled={!watchedValues.category}
                                    >
                                        {subCategories.map((sub: any) => (
                                            <Option key={sub.name} value={sub.name}>{sub.name}</Option>
                                        ))}
                                    </Select>
                                </ConfigProvider>
                            )}
                        />
                        {errors.subCategory && <p className="text-red-500 text-sm mt-1">{errors.subCategory.message}</p>}
                    </div>
                    <div>
                        <Label className="mb-2 block text-sm text-[#344054] font-medium">Brand Name</Label>
                        <Controller
                            name="brand"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Type Brand name" className="w-full placeholder:text-[13px] 3xl:text-sm text-[#27272E] tex-sm " />
                            )}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                        <Label className="font-medium text-[#344054] text-sm 3xl:text-base ">Product Description</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-[24px] text-xs font-semibold font-lexend rounded-full"
                            style={{
                                background: 'linear-gradient(#FAF5FF, #FAF5FF) padding-box, linear-gradient(to right, #00DBDE, #FC00FF) border-box',
                                border: '1px solid transparent'
                            }}
                        >
                            <span className="bg-gradient-to-r from-[#00DBDE] to-[#FC00FF] bg-clip-text text-transparent">
                                ✨ GENERATE WITH A.I?
                            </span>
                        </Button>
                    </div>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <SunEditor
                                setContents={field.value}
                                onChange={handleEditorChange}
                                setOptions={{
                                    height: '249px',
                                    minHeight: '249px',
                                    maxHeight: '249px',
                                    buttonList: [
                                        ['undo', 'redo'],
                                        ['font', 'fontSize', 'formatBlock'],
                                        ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                                        ['fontColor', 'hiliteColor'],
                                        ['removeFormat'],
                                        ['outdent', 'indent'],
                                        ['align', 'horizontalRule', 'list', 'lineHeight'],
                                        ['table', 'link', 'image', 'video'],
                                        ['fullScreen', 'showBlocks', 'codeView'],
                                    ]
                                }}
                            />
                        )}
                    />
                    {linkWarning && (
                        <div className="absolute top-16 right-4 bg-red-100 text-red-600 px-3 py-1 rounded text-sm flex items-center gap-2">
                            <AlertCircle size={14} />
                            Links detected! Please remove them.
                        </div>
                    )}
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                {/* Tags 
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <Label className="mb-2 block font-medium">Tag</Label>
                    <Controller
                        name="tags"
                        control={control}
                        render={({ field }) => (
                            <Select
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder="Pick/Type a Tag"
                                onChange={field.onChange}
                                value={field.value}
                                size="large"
                            />
                        )}
                    />
                </div>*/}

                {/* Shipping & Pricing */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#344054] mb-4 uppercase text-xs 3xl:text-sm">Shipping & Pricing</h3>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <div>
                            <Label className="mb-2 block text-[#344054] font-medium">Base Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold border-r pr-2">₦ NGN</span>
                                <Controller
                                    name="basePrice"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            {...field}
                                            className="pl-20"
                                            placeholder="0.00"
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                    )}
                                />
                            </div>
                            {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice.message}</p>}
                        </div>

                        <div>
                            <Label className="mb-2 block text-[#344054] font-medium">Discount Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold border-r pr-2">₦ NGN</span>
                                <Controller
                                    name="discountPrice"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            {...field}
                                            className="pl-20"
                                            placeholder="0.00"
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block text-[#344054] font-medium">Quantity Available</Label>
                            <Controller
                                name="quantity"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        placeholder="Input number"
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
                                )}
                            />
                            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label className="mb-2 block text-[#344054] font-medium">Product Weight</Label>
                            <div className="flex items-center">
                                <Controller
                                    name="weight"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            {...field}
                                            className="rounded-r-none h-[35.6px] border-r-0"
                                            placeholder="0"
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                    )}
                                />
                                <Controller
                                    name="weightUnit"
                                    control={control}
                                    render={({ field }) => (
                                        <ConfigProvider theme={{ token: { colorPrimary: '#10B981' } }}>

                                            <Select
                                                className="bg-gray-100 border-2 border-[#02020238] rounded-r-lg rounded-l-none px-3 py-2 text-xs font-medium focus:outline-none"
                                                {...field}
                                            >
                                                <option value="kg">KG</option>
                                                <option value="g">G</option>
                                                <option value="lb">LB</option>
                                                <option value="oz">OZ</option>
                                            </Select>
                                        </ConfigProvider>
                                    )}
                                />
                            </div>
                            {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>}
                        </div>

                        <div>
                            <Label className="mb-2 block font-medium">Product Condition</Label>
                            <Controller
                                name="condition"
                                control={control}
                                render={({ field }) => (
                                    <ConfigProvider theme={{ token: { colorPrimary: '#10B981' } }}>

                                        <Select
                                            placeholder="Select Condition"
                                            onChange={field.onChange}
                                            value={field.value || undefined}
                                            className="w-full text-sm"
                                            size="large"
                                        >
                                            <Option value="new">Brand New</Option>
                                            <Option value="fairly-used">Fairly Used</Option>
                                            <Option value="refurbished">Refurbished</Option>
                                        </Select>
                                    </ConfigProvider>
                                )}
                            />
                            {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <div>
                            <Label className="mb-2 block font-medium">Length (cm)</Label>
                            <Controller
                                name="dimensions.length"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        placeholder="10"
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block font-medium">Width (cm)</Label>
                            <Controller
                                name="dimensions.width"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        placeholder="10"
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block font-medium">Height (cm)</Label>
                            <Controller
                                name="dimensions.height"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        placeholder="10"
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50 flex justify-between items-start gap-3">
                        <div>
                            <label htmlFor="free-shipping" className="font-bold text-sm text-[#344054] block mb-1">FREE SHIPPING?</label>
                            <p className="text-xs text-[#0BB248] ">If CHECKED, overrides any calculated shipping, this means you cover the cost of the shipping.</p>
                        </div>
                        <Controller
                            name="freeShipping"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="free-shipping"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className='data-[state=checked]:bg-[#14AE5C] border-[#14AE5C]'
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Variants Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <VariantsProvider>
                        <VariantSection variantContextRef={variantContextRef} />
                    </VariantsProvider>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-4">
                    {calculateCompletion() < 100 ? (
                        <Button variant="outline" className="w-full py-6 text-sm border text-[#344054] border-[#D0D5DD] " onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="flex-1 h-[38px] text-sm text-[#0BB248] font-semibold border-[#0BB248] hover:bg-green-50 hover:text-[#0BB248] gap-2"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <EyeOpenIcon color='#0BB248' /> Preview
                            </Button>
                            <Button
                                className="flex-1 h-[38px] text-sm bg-[#0BB248] hover:bg-[#099A3F] text-white gap-2"
                                onClick={handleSubmit(onSubmit)}
                                disabled={isLoading}
                            >
                                <UploadIcon color='#fff' /> {isLoading ? 'Publishing...' : 'Publish Product'}
                            </Button>
                        </>
                    )}
                </div>

            </div>

            {/* Right Column */}
            <div className="w-[500px] border border-[#C6C6C6] rounded-xl py-[32px] px-[16px] flex flex-col gap-6">

                {/* Product Photos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
                    <div className="flex justify-between items-center mb-6">
                        <Label className="font-bold text-[#686A6C]">Product Photo</Label>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                            {watchedValues.images?.length || 0}/5
                        </span>
                    </div>

                    <div className="grid grid-cols-2 items-center gap-4">
                        {/* Upload Button */}
                        {(watchedValues.images?.length || 0) < 5 && (watchedValues.images?.length || 0) !== 0 && (
                            <div
                                className="aspect-square w-[96px] h-[96px] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Plus size={24} className="text-gray-500" />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                            </div>
                        )}

                        {/* Image Previews */}
                        {watchedValues.images?.map((img, index) => (
                            <div key={index} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-200">
                                <img src={img.url} alt={`Product ${index}`} className="w-full h-full object-cover" />

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X size={16} />
                                    </button>
                                    {!img.isDefault && (
                                        <button
                                            onClick={() => setAsDefaultImage(index)}
                                            className="px-3 py-1 bg-white text-xs font-bold rounded-full hover:bg-gray-100"
                                        >
                                            Set Main
                                        </button>
                                    )}
                                </div>

                                {img.isDefault && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                        MAIN
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {(watchedValues.images?.length || 0) === 0 && (
                        <div className='flex flex-col items-center mt-9 justify-center'>
                            <div
                                className="aspect-square w-[96px] h-[96px] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Plus size={24} className="text-gray-500" />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                            </div>
                            <div className="mt-10 text-center">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Product Photos</h3>
                                <p className="text-gray-500 text-sm max-w-[200px] mx-auto">
                                    You can Upload Up To 5 Square Images. Min Of 1024 X 1024, Max: 3200 X 3200
                                </p>
                            </div>
                        </div>
                    )}

                    {errors.images && <p className="text-red-500 text-sm mt-4 text-center">{errors.images.message}</p>}
                </div>

                {/* Pre-Publish Checklist */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#686A6C]">Pre-Publish Checklist</h3>
                        <span className="text-xs text-gray-400">
                            {completionPercentage === 100 ? '4/4' : `${Math.round(completionPercentage / 25)}/4`}
                        </span>
                    </div>

                    <p className="text-xs 3xl:text-sm text-[#272D30] mb-6">
                        {completionPercentage === 100
                            ? "Your product content is complete."
                            : "Your product content is incomplete. Please add more details"}
                    </p>

                    <div className="flex items-center gap-6">
                        {/* Circular Progress */}
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <CustomCircularProgress
                                percentage={completionPercentage}
                                size={120}
                                strokeWidth={20}
                                trackStrokeWidth={8}
                                color="#00A353"
                                trackColor="#888787"
                            />
                        </div>

                        {/* List */}
                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.title && watchedValues.title.length >= 3 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.title && watchedValues.title.length >= 3 ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Product Title - {watchedValues.title && watchedValues.title.length >= 3 ? "COMPLETE" : "Needs details"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.description && watchedValues.description.length >= 10 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.description && watchedValues.description.length >= 10 ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Product Description - {watchedValues.description && watchedValues.description.length >= 10 ? "COMPLETE" : "Too short"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.category ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.category ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Product Category - {watchedValues.category ? "COMPLETE" : "Missing"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", (watchedValues.images?.length || 0) > 0 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={(watchedValues.images?.length || 0) > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Product Photos - {(watchedValues.images?.length || 0) > 0 ? `${watchedValues.images?.length}/5` : "None"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.basePrice && watchedValues.basePrice > 0 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.basePrice && watchedValues.basePrice > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Price - {watchedValues.basePrice && watchedValues.basePrice > 0 ? "COMPLETE" : "Missing"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.quantity && watchedValues.quantity >= 1 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.quantity && watchedValues.quantity >= 1 ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Quantity - {watchedValues.quantity && watchedValues.quantity >= 1 ? "COMPLETE" : "Missing"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.weight && watchedValues.weight > 0 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.weight && watchedValues.weight > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                                    Weight - {watchedValues.weight && watchedValues.weight > 0 ? "COMPLETE" : "Missing"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            {/* Preview Modal */}
            <Dialog
                open={previewOpen}
                onOpenChange={() => setPreviewOpen(false)}
            >
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar  " >
                    <div className="grid grid-cols-[1.2fr_1fr] gap-6">
                        <div className="bg-white rounded-xl p-4 ">
                            <div className="w-full h-36 rounded-lg flex items-center gap-[24px] overflow-hidden mb-4">
                                {watchedValues.images?.[0]?.url && (
                                    <GlassImage
                                        src={watchedValues.images[0].url}
                                        alt="Cover"
                                        imageClassName="w-[61px] h-[61px] object-cover"
                                        containerClassName='w-[61px] h-[61px] object-cover'
                                    />
                                )}
                                <div className="w-full flex items-center justify-between">
                                    <div className='space-y-2 '>

                                        <p className={cn(
                                            "px-2 py-1 w-fit rounded text-xs font-semibold",
                                            watchedValues.status === 'active'
                                                ? "bg-[#DEFFEE] text-[#66CB9F] "
                                                : "bg-yellow-100 text-yellow-700"
                                        )}>
                                            {watchedValues.status?.toUpperCase()}
                                        </p>
                                        <h2 className="text-lg max-w-[250px] line-clamp-1 font-semibold text-gray-900">{watchedValues.title || 'Untitled Product'}</h2>
                                    </div>
                                    <div className='flex items-center' >
                                        <div className='space-y-2'>
                                            {watchedValues.quantity ? (
                                                <p className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                    {watchedValues.quantity} Available
                                                </p>
                                            ) : null}
                                            <p className="px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
                                                    .format(Number(watchedValues.basePrice || 0))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!!watchedValues.tags?.length && (
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {watchedValues.tags.map((t, i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">#{t}</span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Category</h3>
                                <p className="text-sm text-[#718096] ">
                                    {watchedValues.category || '—'}{watchedValues.subCategory ? ` - ${watchedValues.subCategory}` : ''}
                                </p>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Product Description</h3>
                                <div
                                    className="prose prose-sm max-w-none text-[#718096] mt-1"
                                    dangerouslySetInnerHTML={{ __html: watchedValues.description || '' }}
                                />
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Brand Name</h3>
                                <p className="text-sm text-gray-700">{watchedValues.brand || '—'}</p>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Inventory & Shipping</h3>
                                <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-gray-700">
                                    <div>Quantity: <span className="font-medium">{watchedValues.quantity ?? '—'}</span></div>
                                    <div className='w-fit bg-[#E4ECF7] text-[#505780] px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold'>Weight: <span className="font-medium flex"><Icon icon="mdi:weight-kg" className="w-4 h-4" />{watchedValues.weight ?? '—'} {watchedValues.weightUnit}</span></div>
                                    <div>Dimensions:
                                        <span className="font-medium">
                                            {' '}
                                            {watchedValues.dimensions?.length || 0} × {watchedValues.dimensions?.width || 0} × {watchedValues.dimensions?.height || 0} cm
                                        </span>
                                    </div>
                                    <div>Free Shipping:
                                        <span className={cn("ml-1 font-medium",
                                            watchedValues.freeShipping ? "text-emerald-600" : "text-gray-600"
                                        )}>
                                            {watchedValues.freeShipping ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                                {watchedValues.freeShipping && (
                                    <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1 inline-flex items-center">
                                        Free Shipping to be covered by seller.
                                    </div>
                                )}
                            </div>

                            {!!variantContextRef.current?.variantStructure?.length && (
                                <div className="mt-4">
                                    <h3 className="font-semibold text-gray-900 text-sm">Variants</h3>
                                    <div className="mt-1 space-y-1 text-sm text-gray-700">
                                        {variantContextRef.current?.variantStructure.map((mv, idx) => (
                                            <div key={idx} className="border rounded p-2">
                                                <div className="font-medium">{mv.name}: {mv.value}</div>
                                                {!!mv.subVariants?.length && (
                                                    <div className="ml-2 text-gray-600">
                                                        {mv.subVariants.map((sv, j) => (
                                                            <div key={j}>
                                                                {sv.name}: {sv.value}
                                                                {!!sv.subSubVariants?.length && (
                                                                    <div className="ml-2 text-gray-500">
                                                                        {sv.subSubVariants.map((ssv, k) => (
                                                                            <div key={k}>{ssv.name}: {ssv.value}</div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <Button
                                    className="w-full h-11 bg-[#0BB248] hover:bg-[#0AA043] text-white font-semibold"
                                    onClick={() => handleSubmit(onSubmit)()}
                                >
                                    Publish
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-10 mt-2"
                                    onClick={() => setPreviewOpen(false)}
                                >
                                    Back to Editing
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-base font-semibold text-[#686A6C] mb-3">Preview</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {(watchedValues.images || []).map((img, i) => (
                                    <div key={i} className="w-full aspect-square  overflow-hidden">
                                        <GlassImage src={img.url} alt={`Preview ${i + 1}`} imageClassName="w-full h-full border border-solid rounded-lg border-[#D1D5DB] object-cover" containerClassName='w-full h-full object-cover' />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DesktopAddProduct;
