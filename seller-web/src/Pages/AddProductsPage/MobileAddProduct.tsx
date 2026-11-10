import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addProductSchema, AddProductFormValues } from '../../schemas/addProductSchema';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, resetResponse, updateProduct } from '../../Redux/Slices/ProductSlice';
import { useNotification } from '../../Hooks/useNotification';
import { BASE_URL } from '../../Constants/Server';
import axios from 'axios';
import { Select, ConfigProvider } from 'antd';
import CustomCircularProgress from '../../Components/ui/CustomCircularProgress';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import { X, Check, AlertCircle, Plus, ArrowUp } from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Input } from '../../Components/ui/input2';
import { Label } from '../../Components/ui/label';
import { Checkbox } from '../../Components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@/assets/icons/CheckIcon';
import GlassImage from '@/Components/ui/GlassImageV2';
import EyeOpenIcon from '@/assets/icons/EyeOpenIcon';
import UploadIcon from '@/assets/icons/UploadIcon';
import { VariantsProvider } from '../../Contexts/VariantContext';
import VariantSection from '../../Components/ui/VariantComponents/VariantSection';
import { VariantContextType } from '../../types/variants';

const { Option } = Select;

const URL_PATTERNS = [
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
    /www\.[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
    /\b[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]*\.(com|org|net|edu|gov|mil|int|co|uk|ca|au|de|fr|jp|cn|in|br|ru|it|es|nl|se|no|dk|fi|pl|be|ch|at|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|ie|pt|gr|is|lu|mt|cy|tr|il|za|ng|ke|gh|ug|tz|mw|zm|zw|bw|sz|ls|na|ao|mz|mg|mu|sc|km|dj|so|er|et|sd|ly|eg|ma|tn|dz|mr|ml|bf|ne|td|cf|cm|gq|ga|cg|cd|st|gw|gn|sl|lr|ci|gh|tg|bj|sn|gm|cv|mr|eh)\b/gi,
];

const normalizeSearchText = (s: any) =>
    (s ?? '')
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

type ProductFormMode = 'add' | 'edit';

type MobileAddProductProps = {
    mode?: ProductFormMode;
    productId?: string;
    initialProduct?: any;
};

const MobileAddProduct = ({ mode = 'add', productId, initialProduct }: MobileAddProductProps) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { isLoading, response } = useSelector((state: any) => state.product);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const [linkWarning, setLinkWarning] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const variantContextRef = useRef<VariantContextType | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [variantCtx, setVariantCtx] = useState<VariantContextType | null>(null);
    const prefilledProductIdRef = useRef<string | null>(null);
    const prefilledVariantsIdRef = useRef<string | null>(null);

    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AddProductFormValues>({
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

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await axios.get(`${BASE_URL}/public/categories`);
                if (res.status === 200) setCategories(res.data);
            } catch (error) {
                console.error(error);
                showNotification('Failed to fetch categories', 'error', 'dismissible');
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        // Also prefill from a Listing Agent draft handed over via "Edit all details"
        const fromDraft = mode !== 'edit' && Boolean(initialProduct?.fromDraft);
        if (mode !== 'edit' && !fromDraft) return;
        const id = initialProduct?._id || initialProduct?.id || (fromDraft ? 'listing-draft' : null);
        if (!id) return;
        if (prefilledProductIdRef.current === id) return;

        const rawImages = Array.isArray(initialProduct?.images) ? initialProduct.images : [];
        const normalizedImages = rawImages.map((img: any, idx: number) => ({
            url: img?.url || img?.data || '',
            contentType: img?.contentType || 'image/jpeg',
            isDefault: typeof img?.isDefault === 'boolean' ? img.isDefault : idx === 0
        }));

        const weightValue =
            typeof initialProduct?.shippingInfo?.weight?.value === 'number'
                ? initialProduct.shippingInfo.weight.value
                : typeof initialProduct?.weight === 'number'
                    ? initialProduct.weight
                    : undefined;

        reset({
            status: initialProduct?.status || 'active',
            title: initialProduct?.name || '',
            description: initialProduct?.description || '',
            category: initialProduct?.category || '',
            subCategory: initialProduct?.subCategory || '',
            brand: initialProduct?.brand || '',
            basePrice: typeof initialProduct?.price === 'number' ? initialProduct.price : undefined,
            discountPrice: typeof initialProduct?.salePrice === 'number' ? initialProduct.salePrice : undefined,
            quantity: typeof initialProduct?.stock === 'number' ? initialProduct.stock : undefined,
            weight: typeof weightValue === 'number' ? weightValue : undefined,
            weightUnit: initialProduct?.shippingInfo?.weight?.unit || 'kg',
            freeShipping: Boolean(initialProduct?.shippingInfo?.freeShipping),
            images: normalizedImages,
            tags: Array.isArray(initialProduct?.tags) ? initialProduct.tags : [],
            condition: initialProduct?.condition || '',
            variants: []
        });

        prefilledProductIdRef.current = id;
    }, [initialProduct, mode, reset]);

    useEffect(() => {
        if (mode !== 'edit' && !initialProduct?.fromDraft) return;
        if (!initialProduct?.category) return;
        if (!categories.length) return;
        const category = categories.find((cat: any) => cat.name === initialProduct.category);
        setSubCategories(category ? category.subCategories : []);
    }, [categories, initialProduct, mode]);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCategoryChange = (categoryName: string) => {
        setValue('category', categoryName);
        setValue('subCategory', '');
        const category = categories.find(cat => cat.name === categoryName);
        setSubCategories(category ? category.subCategories : []);
    };

    const handleEditorChange = (content: string) => {
        setValue('description', content, { shouldValidate: true });

        const plainText = content.replace(/<[^>]*>/g, ' ');
        const foundLinks: string[] = [];
        URL_PATTERNS.forEach(pattern => {
            const matches = plainText.match(pattern);
            if (matches) foundLinks.push(...matches);
        });

        if (foundLinks.length > 0) {
            setLinkWarning(true);
            showNotification('Links are not allowed in description', 'warning', 'fixed');
        } else {
            setLinkWarning(false);
        }
    };

    const calculateCompletion = useCallback(() => {
        let completed = 0;
        const total = 7;

        if (watchedValues.title && watchedValues.title.length >= 3) completed++;
        if (watchedValues.description && watchedValues.description.length >= 10) completed++;
        if (watchedValues.category) completed++;
        if (watchedValues.images && watchedValues.images.length > 0) completed++;
        if (watchedValues.basePrice && watchedValues.basePrice > 0) completed++;
        if (watchedValues.quantity && watchedValues.quantity >= 1) completed++;
        if (watchedValues.weight && watchedValues.weight > 0) completed++;

        return Math.round((completed / total) * 100);
    }, [watchedValues]);

    const completionPercentage = calculateCompletion();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentImages = watchedValues.images || [];
        const remainingSlots = 5 - currentImages.length;
        if (remainingSlots <= 0) {
            showNotification('Maximum 5 images allowed', 'warning', 'dismissible');
            return;
        }

        const newImages = [...currentImages];
        for (const file of files.slice(0, remainingSlots)) {
            if (file.size > 7 * 1024 * 1024) {
                showNotification(`Image ${file.name} is too large (max 7MB)`, 'warning', 'dismissible');
                continue;
            }

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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        const newImages = [...(watchedValues.images || [])];
        newImages.splice(index, 1);
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

    const mapToVariantImage = useCallback((img: any, idx: number) => {
        return {
            url: img?.url || img?.data || '',
            contentType: img?.contentType || 'image/jpeg',
            isDefault: typeof img?.isDefault === 'boolean' ? img.isDefault : idx === 0
        };
    }, []);

    useEffect(() => {
        if (mode !== 'edit') return;
        const id = initialProduct?._id || initialProduct?.id;
        if (!id) return;
        if (!variantCtx) return;
        if (prefilledVariantsIdRef.current === id) return;

        const rawVariants = Array.isArray(initialProduct?.variants) ? initialProduct.variants : [];
        if (!rawVariants.length) {
            variantCtx.setOptions([]);
            variantCtx.setVariantStructure([]);
            prefilledVariantsIdRef.current = id;
            return;
        }

        const option1Name = rawVariants?.[0]?.name || 'Option 1';
        const option2Name = rawVariants?.[0]?.subVariants?.[0]?.name;
        const option3Name = rawVariants?.[0]?.subVariants?.[0]?.subSubVariants?.[0]?.name;

        const option1Values = Array.from(new Set(rawVariants.map((v: any) => v?.value).filter(Boolean)));
        const option2Values = Array.from(
            new Set(
                rawVariants
                    .flatMap((v: any) => (Array.isArray(v?.subVariants) ? v.subVariants : []))
                    .map((sv: any) => sv?.value)
                    .filter(Boolean)
            )
        );
        const option3Values = Array.from(
            new Set(
                rawVariants
                    .flatMap((v: any) => (Array.isArray(v?.subVariants) ? v.subVariants : []))
                    .flatMap((sv: any) => (Array.isArray(sv?.subSubVariants) ? sv.subSubVariants : []))
                    .map((ssv: any) => ssv?.value)
                    .filter(Boolean)
            )
        );

        const options = [
            option1Values.length ? { id: 'option-1', name: option1Name, values: option1Values } : null,
            option2Name && option2Values.length ? { id: 'option-2', name: option2Name, values: option2Values } : null,
            option3Name && option3Values.length ? { id: 'option-3', name: option3Name, values: option3Values } : null,
        ].filter(Boolean) as any[];

        const variantStructure = rawVariants.map((mv: any) => ({
            name: mv?.name || option1Name,
            value: mv?.value || '',
            price: typeof mv?.price === 'number' ? mv.price : String(mv?.price ?? ''),
            totalStock: typeof mv?.totalStock === 'number' ? mv.totalStock : String(mv?.totalStock ?? ''),
            images: Array.isArray(mv?.images) ? mv.images.map(mapToVariantImage) : [],
            subVariants: Array.isArray(mv?.subVariants)
                ? mv.subVariants.map((sv: any) => ({
                    name: sv?.name || option2Name || 'Option 2',
                    value: sv?.value || '',
                    price: typeof sv?.price === 'number' ? sv.price : String(sv?.price ?? ''),
                    stock: typeof sv?.stock === 'number' ? sv.stock : String(sv?.stock ?? ''),
                    images: Array.isArray(sv?.images) ? sv.images.map(mapToVariantImage) : [],
                    subSubVariants: Array.isArray(sv?.subSubVariants)
                        ? sv.subSubVariants.map((ssv: any) => ({
                            name: ssv?.name || option3Name || 'Option 3',
                            value: ssv?.value || '',
                            price: typeof ssv?.price === 'number' ? ssv.price : String(ssv?.price ?? ''),
                            stock: typeof ssv?.stock === 'number' ? ssv.stock : String(ssv?.stock ?? ''),
                            sku: ssv?.sku,
                            images: Array.isArray(ssv?.images) ? ssv.images.map(mapToVariantImage) : []
                        }))
                        : []
                }))
                : []
        }));

        variantCtx.setOptions(options);
        variantCtx.setVariantStructure(variantStructure);
        prefilledVariantsIdRef.current = id;
    }, [initialProduct, mapToVariantImage, mode, variantCtx]);

    const onSubmit = async (data: AddProductFormValues) => {
        if (linkWarning) {
            showNotification('Please remove links from description before submitting', 'error', 'dismissible');
            return;
        }

        try {
            const processedImages = data.images?.map(img => {
                const base64Data = img.url.includes(',') ? img.url.split(',')[1] : img.url;
                return {
                    data: base64Data,
                    contentType: img.contentType || 'image/jpeg',
                    isDefault: img.isDefault || false
                };
            });

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

            let weightInKg = Number(data.weight);
            if (data.weightUnit === 'g') weightInKg = data.weight / 1000;
            else if (data.weightUnit === 'lb') weightInKg = data.weight / 2.20462;
            else if (data.weightUnit === 'oz') weightInKg = data.weight / 35.274;

            const resolvedProductId = productId || initialProduct?._id || initialProduct?.id;
            const resolvedSku =
                mode === 'edit'
                    ? (initialProduct?.sku || initialProduct?.SKU || '')
                    : `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const resolvedUpc = mode === 'edit' ? initialProduct?.upc : undefined;

            const productData = {
                ...(initialProduct?.fromDraft ? {
                    draftProof: initialProduct.draftProof,
                    fabric: initialProduct.fabric || '',
                    localStyle: initialProduct.localStyle || '',
                    colourVariants: initialProduct.colourVariants || [],
                    colourQuantities: Number(data.quantity) === Number(initialProduct.stock) ? initialProduct.colourQuantities || [] : [],
                } : {}),
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
                sku: resolvedSku,
                ...(resolvedUpc ? { upc: resolvedUpc } : {}),
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

            if (mode === 'edit' && resolvedProductId) {
                // @ts-ignore
                await dispatch(updateProduct({ productId: resolvedProductId, formData: productData }) as any).unwrap();
            } else {
                // @ts-ignore
                await dispatch(createProduct(productData) as any).unwrap();
            }
        } catch (error) {
            console.error('Submission error:', error);
        }
    };

    useEffect(() => {
        if (response === 'success') {
            showNotification(mode === 'edit' ? "Product updated successfully!" : "Product added successfully!", "information", "dismissible");
            navigate("/dashboard/products");
            dispatch(resetResponse());
        }
    }, [dispatch, mode, navigate, response, showNotification]);

    const categoryFilterOption = useCallback((input: string, option: any) => {
        const opt: any = option;
        const children = opt?.children;
        const valueStr = (opt?.value ?? '').toString();
        let textContent = '';
        if (typeof children === 'string') textContent = children;
        else if (Array.isArray(children)) textContent = children.map((c: any) => (typeof c === 'string' ? c : '')).join(' ');
        else textContent = valueStr;
        const q = normalizeSearchText(input);
        return normalizeSearchText(textContent).includes(q) || normalizeSearchText(valueStr).includes(q);
    }, []);

    const subCategoryOptions = useMemo(() => subCategories.map((sub: any) => sub?.name).filter(Boolean), [subCategories]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-5 overflow-x-hidden">
            <div className="flex flex-col gap-5 pb-24">
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase">Choose your product visibility status</h4>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            aria-label="Set status to active"
                            onClick={() => setValue('status', 'active')}
                            className={cn(
                                "flex-1 h-11 rounded-lg border-2 text-sm flex items-center justify-center gap-2 font-medium transition-colors",
                                watchedValues.status === 'active'
                                    ? "border-[#0BB248] bg-green-50 text-[#0BB248]"
                                    : "border-gray-200 bg-white text-gray-500"
                            )}
                        >
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watchedValues.status === 'active' ? "bg-[#0BB248] border-[#0BB248]" : "border-gray-300")}>
                                <CheckIcon width={8} height={8} color='#FFFFFF' />
                            </div>
                            Active
                        </button>
                        <button
                            type="button"
                            aria-label="Set status to draft"
                            onClick={() => setValue('status', 'draft')}
                            className={cn(
                                "flex-1 h-11 rounded-lg border-2 text-sm flex items-center justify-center gap-2 font-medium transition-colors",
                                watchedValues.status === 'draft'
                                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                    : "border-gray-200 bg-white text-gray-500"
                            )}
                        >
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watchedValues.status === 'draft' ? "bg-yellow-500 border-yellow-500" : "border-gray-300")}>
                                <CheckIcon width={8} height={8} color='#FFFFFF' />
                            </div>
                            Save as Drafts
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <Label className="mb-2 block text-sm text-[#344054] font-medium">Product title</Label>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} aria-label="Product title" placeholder="Type in Product title" className="w-full" />
                        )}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}

                    <div className="mt-4 space-y-4">
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
                                            filterOption={categoryFilterOption}
                                            onChange={handleCategoryChange}
                                            value={field.value || undefined}
                                            className="w-full text-sm"
                                            size="large"
                                            loading={loadingCategories}
                                        >
                                            {categories.map(cat => (
                                                <Option key={cat._id} value={cat.name}>
                                                    <div className='flex gap-2 items-center'>
                                                        <GlassImage src={cat.image?.url || "/logo-single.png"} alt={cat.name} imageClassName="w-5 h-5 rounded-full" containerClassName="w-5 h-5 rounded-full" />
                                                        <p className='text-[13px]'>{cat.name}</p>
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
                                            filterOption={(input, option) => {
                                                const valueStr = ((option as any)?.value ?? '').toString();
                                                return normalizeSearchText(valueStr).includes(normalizeSearchText(input));
                                            }}
                                            onChange={field.onChange}
                                            value={field.value || undefined}
                                            className="w-full text-sm"
                                            size="large"
                                            disabled={!watchedValues.category}
                                        >
                                            {subCategoryOptions.map((name) => (
                                                <Option key={name} value={name}>{name}</Option>
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
                                    <Input {...field} aria-label="Brand name" placeholder="Type Brand name" className="w-full" />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium text-[#344054] text-sm">Product Description</Label>
                        {/* POSTPONED FEATURE <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Generate description with AI"
                            className="h-8 px-3 text-[9px] font-semibold rounded-full"
                            style={{
                                background: 'linear-gradient(#FAF5FF, #FAF5FF) padding-box, linear-gradient(to right, #00DBDE, #FC00FF) border-box',
                                border: '1px solid transparent'
                            }}
                        >
                            <span className="bg-gradient-to-r from-[#00DBDE] to-[#FC00FF] bg-clip-text text-transparent">
                                ✨ GENERATE WITH A.I?
                            </span>
                        </Button>*/}
                    </div>

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <SunEditor
                                setContents={field.value}
                                onChange={handleEditorChange}
                                setOptions={{
                                    height: '220px',
                                    minHeight: '220px',
                                    maxHeight: '220px',
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
                        <div role="alert" className="absolute top-14 right-4 bg-red-100 text-red-600 px-3 py-1 rounded text-xs flex items-center gap-2">
                            <AlertCircle size={14} />
                            Links detected! Please remove them.
                        </div>
                    )}
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <Label className="font-bold text-[#686A6C]">Product Photo</Label>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                            {watchedValues.images?.length || 0}/5
                        </span>
                    </div>

                    {(watchedValues.images?.length || 0) === 0 ? (
                        <div className="bg-[#F3FAF6] rounded-xl p-6 flex flex-col items-center justify-center">
                            <div
                                role="button"
                                aria-label="Upload product photos"
                                tabIndex={0}
                                className="w-24 h-24 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                                }}
                            >
                                <Plus size={22} className="text-gray-600" />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                            </div>
                            <h3 className="mt-5 text-base font-bold text-gray-900">Upload Product Photos</h3>
                            <p className="mt-1 text-center text-xs text-gray-500 max-w-[260px]">
                                You can Upload Up To 5 Square Images. Min Of 1024 X 1024, Max: 3200 X 3200
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#F87171] rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-3">
                                {(watchedValues.images?.length || 0) < 5 && (
                                    <div
                                        role="button"
                                        aria-label="Add more product photos"
                                        tabIndex={0}
                                        className="aspect-square w-full bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                                        }}
                                    >
                                        <Plus size={22} className="text-gray-600" />
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

                                {watchedValues.images?.map((img, index) => (
                                    <div key={index} className={cn("aspect-square w-full rounded-xl overflow-hidden relative border border-gray-200", (watchedValues.images?.length || 0) === 3 && index === 2 ? "col-span-2" : "")}>
                                        <img src={img.url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            aria-label={`Remove image ${index + 1}`}
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 left-2 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center"
                                        >
                                            <X size={18} className="text-red-500" />
                                        </button>
                                        {!img.isDefault && (
                                            <button
                                                type="button"
                                                aria-label={`Set image ${index + 1} as main`}
                                                onClick={() => setAsDefaultImage(index)}
                                                className="absolute bottom-2 right-2 px-3 py-2 rounded-full bg-white/90 text-xs font-bold"
                                            >
                                                Set Main
                                            </button>
                                        )}
                                        {img.isDefault && (
                                            <div className="absolute top-2 right-2 bg-[#0BB248] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                MAIN
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-red-500 font-medium">
                                Attention: You have to upload up to 5 Product Photos
                            </p>
                        </div>
                    )}

                    {errors.images && <p className="text-red-500 text-sm mt-3">{errors.images.message}</p>}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#344054] mb-4 uppercase text-xs">Shipping & Pricing</h3>

                    <div className="grid grid-cols-2 gap-4">
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
                                            aria-label="Base price"
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
                                            aria-label="Discount price"
                                            className="pl-20"
                                            placeholder="0.00"
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div>
                            <Label className="mb-2 block text-[#344054] font-medium">Quantity Available</Label>
                            <Controller
                                name="quantity"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        aria-label="Quantity available"
                                        placeholder="Input number"
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
                                )}
                            />
                            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
                        </div>

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
                                            aria-label="Product weight"
                                            className="rounded-r-none border-r-0"
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
                                                value={field.value}
                                                onChange={field.onChange}
                                                className="w-[110px] bg-gray-100 border border-gray-200 rounded-r-lg rounded-l-none"
                                                size="large"
                                            >
                                                <Option value="kg">KG</Option>
                                                <Option value="g">G</Option>
                                                <Option value="lb">LB</Option>
                                                <Option value="oz">OZ</Option>
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
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#344054] mb-4 uppercase text-xs">Product Dimensions</h3>
                    <div className="grid grid-cols-3 gap-3">
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

                    <div className="mt-4 border rounded-lg p-4 bg-gray-50 flex justify-between items-start gap-3">
                        <div>
                            <label htmlFor="free-shipping" className="font-bold text-sm text-[#344054] block mb-1">FREE SHIPPING?</label>
                            <p className="text-xs text-[#0BB248]">If CHECKED, overrides any calculated shipping, this means you cover the cost of the shipping.</p>
                        </div>
                        <Controller
                            name="freeShipping"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="free-shipping"
                                    aria-label="Free shipping"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className='data-[state=checked]:bg-[#14AE5C] border-[#14AE5C]'
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <VariantsProvider>
                        <VariantSection variantContextRef={variantContextRef} onReady={setVariantCtx} />
                    </VariantsProvider>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#686A6C]">Pre-Publish Checklist</h3>
                        <span className="text-xs text-gray-400">
                            {completionPercentage === 100 ? '4/4' : `${Math.round(completionPercentage / 25)}/4`}
                        </span>
                    </div>

                    <p className="text-xs text-[#272D30] mb-4">
                        {completionPercentage === 100
                            ? "Your product content is complete."
                            : "Your product content is incomplete. Please add more details"}
                    </p>

                    <div className="flex flex-col pt-6 items-center gap-4">
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

                        <div className="flex flex-col gap-3 mt-3 text-sm">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.title && watchedValues.title.length >= 3 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.title && watchedValues.title.length >= 3 ? "text-green-600 text-xs font-medium" : "text-xs text-gray-500"}>
                                    Product Title - {watchedValues.title && watchedValues.title.length >= 3 ? "COMPLETE" : "Needs details"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.description && watchedValues.description.length >= 10 ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.description && watchedValues.description.length >= 10 ? "text-green-600 text-xs font-medium" : "text-xs text-gray-500"}>
                                    Product Description - {watchedValues.description && watchedValues.description.length >= 10 ? "COMPLETE" : "Too short"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", watchedValues.category ? "bg-[#08915640] text-[#089156]" : "bg-gray-100 text-gray-400")}>
                                    <Check size={10} />
                                </div>
                                <span className={watchedValues.category ? "text-green-600 text-xs font-medium" : "text-xs text-gray-500"}>
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed z-30 left-0 right-0 bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                {completionPercentage < 100 ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 text-sm border text-[#344054] border-[#D0D5DD]"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-11 text-sm text-[#0BB248] font-semibold border-[#0BB248] hover:bg-green-50 hover:text-[#0BB248] gap-2"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <EyeOpenIcon color='#0BB248' /> Preview
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 h-11 text-sm bg-[#0BB248] hover:bg-[#099A3F] text-white gap-2"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            <UploadIcon color='#fff' /> {isLoading ? (mode === 'edit' ? 'Updating...' : 'Publishing...') : (mode === 'edit' ? 'Update' : 'Publish')}
                        </Button>
                    </div>
                )}
            </div>

            {showBackToTop && (
                <button
                    type="button"
                    aria-label="Back to top"
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-4 w-11 h-11 rounded-full bg-[#344054] text-white shadow-lg flex items-center justify-center"
                >
                    <ArrowUp size={18} />
                </button>
            )}

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-[95vw] max-h-[80vh] overflow-y-auto custom-scrollbar rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#686A6C]">Preview</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white rounded-xl p-3">
                            <div className="relative w-full h-28 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-4">
                                {watchedValues.images?.[0]?.url && (
                                    <img
                                        src={watchedValues.images[0].url}
                                        alt="Cover"
                                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                                    />
                                )}
                                <div className="relative z-10 flex items-center gap-2">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-semibold",
                                        watchedValues.status === 'active'
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {watchedValues.status?.toUpperCase()}
                                    </span>
                                    {watchedValues.quantity ? (
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                            {watchedValues.quantity} Available
                                        </span>
                                    ) : null}
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
                                            .format(Number(watchedValues.basePrice || 0))}
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-base font-semibold text-gray-900">{watchedValues.title || 'Untitled Product'}</h2>

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Category</h3>
                                <p className="text-sm text-[#718096]">
                                    {watchedValues.category || '—'}{watchedValues.subCategory ? ` - ${watchedValues.subCategory}` : ''}
                                </p>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Product Description</h3>
                                <div
                                    className="prose prose-sm max-w-none text-gray-700 mt-1"
                                    dangerouslySetInnerHTML={{ __html: watchedValues.description || '' }}
                                />
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Brand Name</h3>
                                <p className="text-sm text-gray-700">{watchedValues.brand || '—'}</p>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-start gap-2">
                                    <div className={cn("w-4 h-4 rounded-sm border mt-0.5 flex items-center justify-center", watchedValues.freeShipping ? "bg-[#0BB248] border-[#0BB248] text-white" : "border-gray-300")}>
                                        {watchedValues.freeShipping ? <Check size={12} /> : null}
                                    </div>
                                    <p className="text-xs text-gray-700">Free Shipping to be covered by seller.</p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full h-11 mt-6 bg-[#0BB248] hover:bg-[#0AA043] text-white font-semibold"
                                onClick={() => handleSubmit(onSubmit)()}
                            >
                                {mode === 'edit' ? 'Update' : 'Publish'}
                            </Button>
                        </div>

                        <div className="bg-white rounded-xl p-3">
                            <div className="grid grid-cols-2 gap-3">
                                {(watchedValues.images || []).map((img, i) => (
                                    <div key={i} className="w-full aspect-square overflow-hidden">
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

export default MobileAddProduct;
