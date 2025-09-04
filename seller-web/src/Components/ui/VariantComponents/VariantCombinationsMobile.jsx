import { memo, useState, useCallback, useEffect } from 'react';
import { useVariants } from '../../../Contexts/VariantContext';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const VariantCombinationsMobile = memo(() => {
    const [expandedVariants, setExpandedVariants] = useState(new Set());
    const { variantStructure, updateVariantValue, calculateMinimumStock } = useVariants();
    const [stockWarnings, setStockWarnings] = useState(new Map());

    // Monitor variantStructure changes for image debugging (throttled)
    useEffect(() => {
        const logTimeout = setTimeout(() => {
            console.log('🔍 MOBILE VariantCombinations - variantStructure changed, checking images:', 
                variantStructure.map(v => ({ value: v.value, images: v.images, imageCount: v.images?.length || 0 }))
            );
        }, 100); // Throttle logging to reduce console spam

        return () => clearTimeout(logTimeout);
    }, [variantStructure]);

    const handleImageUpload = useCallback(async (e, variantPath) => {
        console.log('🔄 MOBILE handleImageUpload called with variantPath:', variantPath);
        const file = e.target.files[0];
        if (file) {
            console.log('📁 MOBILE File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
            // Check file size (7MB = 7 * 1024 * 1024 bytes)
            const MAX_FILE_SIZE = 7 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                console.log('❌ MOBILE File too large:', file.size);
                toast.error('Image size must be less than 7MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                console.log('📸 MOBILE image reader.result length:', reader.result?.length);
                console.log('📸 MOBILE About to call updateVariantValue with variantPath:', variantPath);
                console.log('📸 MOBILE Image object being passed:', {
                    url: reader.result?.substring(0, 50) + '...',
                    contentType: file.type,
                    isDefault: true
                });
                updateVariantValue(variantPath, 'images', [{
                    url: reader.result,
                    contentType: file.type,
                    isDefault: true
                }]);
                console.log('✅ MOBILE updateVariantValue called for images');
                toast.success('Variant image uploaded successfully');
            };
            reader.readAsDataURL(file);
        } else {
            console.log('❌ MOBILE No file selected');
        }
    }, [updateVariantValue]);

    const handleRemoveImage = useCallback((variantPath) => {
        console.log('🗑️ MOBILE handleRemoveImage called with variantPath:', variantPath);
        updateVariantValue(variantPath, 'images', []);
        console.log('✅ MOBILE Remove image updateVariantValue called');
    }, [updateVariantValue]);

    const handleTotalStockChange = useCallback((variantPath, value, minStock) => {
        // Allow empty string for full editability
        if (value === '') {
            updateVariantValue(variantPath, 'totalStock', '');
            // Show warning even when empty
            setStockWarnings(prev => new Map(prev.set(variantPath, `Total stock cannot be less than sub-variant total stock of ${minStock}`)));
            return;
        }
        
        // Only allow numeric values
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue !== value) {
            return; // Don't update if non-numeric characters were entered
        }
        
        const numValue = parseInt(numericValue) || 0;
        
        if (numValue < minStock) {
            setStockWarnings(prev => new Map(prev.set(variantPath, `Total stock cannot be less than sub-variant total stock of ${minStock}`)));
        } else {
            setStockWarnings(prev => {
                const newMap = new Map(prev);
                newMap.delete(variantPath);
                return newMap;
            });
        }
        
        updateVariantValue(variantPath, 'totalStock', numericValue);
    }, [updateVariantValue]);

    // Monitor variant structure changes and update warnings accordingly
    useEffect(() => {
        variantStructure.forEach(mainVariant => {
            const minStock = calculateMinimumStock(mainVariant);
            const currentStock = parseInt(mainVariant.totalStock) || 0;
            
            if (mainVariant.totalStock !== undefined && 
                (mainVariant.totalStock === '' || currentStock < minStock)) {
                setStockWarnings(prev => new Map(prev.set(mainVariant.value, `Total stock cannot be less than sub-variant total stock of ${minStock}`)));
            } else {
                setStockWarnings(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(mainVariant.value);
                    return newMap;
                });
            }
        });
    }, [variantStructure, calculateMinimumStock]);

    const ImageUploadButton = ({ variantPath, images = [] }) => {
        console.log('🎨 MOBILE ImageUploadButton render - variantPath:', variantPath, 'images:', images, 'images.length:', images?.length);
        return (
            <div className="flex items-center gap-2">
                {images && images.length > 0 ? (
                <div className="relative">
                    <img
                        src={images[0].url}
                        alt="Variant"
                        className="w-10 h-10 rounded-md object-cover"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(variantPath);
                        }}
                        className="absolute -top-1 -right-1 flex bg-white text-white rounded-full p-0.5"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-4 h-4"
                            fill="#17171B"
                        >
                            <path
                                fillRule="evenodd"
                                d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10M8.97 8.97a.75.75 0 0 1 1.06 0L12 10.94l1.97-1.97a.75.75 0 0 1 1.06 1.06L13.06 12l1.97 1.97a.75.75 0 0 1-1.06 1.06L12 13.06l-1.97 1.97a.75.75 0 0 1-1.06-1.06L10.94 12l-1.97-1.97a.75.75 0 0 1 0-1.06"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, variantPath)}
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-gray-400 hover:text-gray-600"
                    >
                        <path
                            fill="currentColor"
                            d="M22 12.698c-.002 1.47-.013 2.718-.096 3.743c-.097 1.19-.296 2.184-.74 3.009a4.2 4.2 0 0 1-.73.983c-.833.833-1.893 1.21-3.237 1.39C15.884 22 14.2 22 12.053 22h-.106c-2.148 0-3.83 0-5.144-.177c-1.343-.18-2.404-.557-3.236-1.39c-.738-.738-1.12-1.656-1.322-2.795c-.2-1.12-.236-2.512-.243-4.241Q1.999 12.737 2 12v-.054c0-2.148 0-3.83.177-5.144c.18-1.343.557-2.404 1.39-3.236s1.893-1.21 3.236-1.39c1.168-.157 2.67-.175 4.499-.177a.697.697 0 1 1 0 1.396c-1.855.002-3.234.018-4.313.163c-1.189.16-1.906.464-2.436.994S3.72 5.8 3.56 6.99C3.397 8.2 3.395 9.788 3.395 12v.784l.932-.814a2.14 2.14 0 0 1 2.922.097l3.99 3.99a1.86 1.86 0 0 0 2.385.207l.278-.195a2.79 2.79 0 0 1 3.471.209l2.633 2.37c.265-.557.423-1.288.507-2.32c.079-.972.09-2.152.091-3.63a.698.698 0 0 1 1.396 0"
                        />
                        <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M17.5 11c-2.121 0-3.182 0-3.841-.659S13 8.621 13 6.5s0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11m.75-6.5a.75.75 0 0 0-1.5 0v1.25H15.5a.75.75 0 0 0 0 1.5h1.25V8.5a.75.75 0 0 0 1.5 0V7.25h1.25a.75.75 0 0 0 0-1.5h-1.25z"
                            clipRule="evenodd"
                        />
                    </svg>
                </label>
            )}
        </div>
        );
    };

    ImageUploadButton.propTypes = {
        variantPath: PropTypes.string.isRequired,
        images: PropTypes.array.isRequired
    };

    const toggleExpand = (variantId) => {
        setExpandedVariants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(variantId)) {
                newSet.delete(variantId);
            } else {
                newSet.add(variantId);
            }
            return newSet;
        });
    };

    const renderSubSubVariant = (mainVariant, subVariant, subSubVariant) => (
        <div
            key={`${mainVariant.value}-${subVariant.value}-${subSubVariant.value}`}
            className="border-t"
        >
            <div className="p-3 pl-12 bg-gray-50 flex items-center gap-2">
                <ImageUploadButton
                    variantPath={`${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`}
                    images={subSubVariant.images || []}
                />
                <span className="text-sm text-gray-600">{subSubVariant.value}</span>
            </div>
            <div className="mt-2 space-y-2 p-3 pl-12">
                <input
                    type="number"
                    value={subSubVariant.price || ''}
                    onChange={(e) => updateVariantValue(
                        `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                        'price',
                        e.target.value
                    )}
                    placeholder="₦0.00"
                    className="w-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2 border rounded"
                />
                <input
                    type="number"
                    value={subSubVariant.stock || ''}
                    onChange={(e) => updateVariantValue(
                        `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                        'stock',
                        e.target.value
                    )}
                    placeholder="Stock"
                    className="w-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2 border rounded"
                />
            </div>
        </div>
    );

    const renderSubVariant = (mainVariant, subVariant) => (
        <div key={`${mainVariant.value}-${subVariant.value}`}>
            <div
                className="border-t"
                onClick={() => toggleExpand(`${mainVariant.value}-${subVariant.value}`)}
            >
                <div className="p-3 pl-6 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageUploadButton
                            variantPath={`${mainVariant.value}_${subVariant.value}`}
                            images={subVariant.images || []}
                        />
                        {expandedVariants.has(`${mainVariant.value}-${subVariant.value}`) ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-4 h-4"
                            >
                                <path
                                    fill="currentColor"
                                    d="m12.37 15.835l6.43-6.63C19.201 8.79 18.958 8 18.43 8H5.57c-.528 0-.771.79-.37 1.205l6.43 6.63c.213.22.527.22.74 0"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-4 h-4"
                            >
                                <path
                                    fill="currentColor"
                                    d="M15.835 11.63L9.205 5.2C8.79 4.799 8 5.042 8 5.57v12.86c0 .528.79.771 1.205.37l6.63-6.43a.5.5 0 0 0 0-.74"
                                />
                            </svg>
                        )}
                        <span className="text-sm">{subVariant.value}</span>
                    </div>
                </div>
                <div className="p-3 pl-6 space-y-2">
                    <input
                        type="number"
                        value={subVariant.price || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}`,
                            'price',
                            e.target.value
                        )}
                        placeholder="₦0.00"
                        className="w-full text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2 border rounded"
                        onClick={e => e.stopPropagation()}
                    />
                    <input
                        type="number"
                        value={subVariant.stock || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}`,
                            'stock',
                            e.target.value
                        )}
                        placeholder="Stock"
                        className="w-full text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2 border rounded"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            </div>
            {expandedVariants.has(`${mainVariant.value}-${subVariant.value}`) &&
                subVariant.subSubVariants?.map(subSubVariant =>
                    renderSubSubVariant(mainVariant, subVariant, subSubVariant)
                )
            }
        </div>
    );

    return (
        <div className="mt-6">
            <div className="flex justify-between mb-2 px-4">
                <h3 className="font-medium">Variant Combinations</h3>
                <div className="hidden md:flex gap-4 text-sm text-gray-600">
                    <span>Price</span>
                    <span>Available</span>
                </div>
            </div>
            <div className="border rounded-lg divide-y">
                {variantStructure.map(mainVariant => (
                    <div key={mainVariant.value}>
                        <div
                            onClick={() => toggleExpand(mainVariant.value)}
                        >
                            <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ImageUploadButton
                                        variantPath={mainVariant.value}
                                        images={mainVariant.images || []}
                                    />
                                    {expandedVariants.has(mainVariant.value) ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="m12.37 15.835l6.43-6.63C19.201 8.79 18.958 8 18.43 8H5.57c-.528 0-.771.79-.37 1.205l6.43 6.63c.213.22.527.22.74 0"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M15.835 11.63L9.205 5.2C8.79 4.799 8 5.042 8 5.57v12.86c0 .528.79.771 1.205.37l6.63-6.43a.5.5 0 0 0 0-.74"
                                            />
                                        </svg>
                                    )}
                                    <span>{mainVariant.value}</span>
                                </div>
                            </div>
                            <div className="px-3 pb-3 space-y-2">
                                <input
                                    type="number"
                                    value={mainVariant.price || ''}
                                    onChange={(e) => updateVariantValue(
                                        mainVariant.value,
                                        'price',
                                        e.target.value
                                    )}
                                    placeholder="₦0.00"
                                    className="w-full px-3 py-1.5 border rounded"
                                    onClick={e => e.stopPropagation()}
                                />

                                <input
                                    type="text"
                                    value={mainVariant.totalStock !== undefined ? mainVariant.totalStock : calculateMinimumStock(mainVariant)}
                                    onChange={(e) => handleTotalStockChange(
                                        mainVariant.value,
                                        e.target.value,
                                        calculateMinimumStock(mainVariant)
                                    )}
                                    placeholder="Stock"
                                    className="w-full px-3 py-1.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2 border rounded"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        
                        {stockWarnings.has(mainVariant.value) && (
                            <div className="px-3 pb-2">
                                <p className="text-red-500 text-xs lg:text-sm font-medium">{stockWarnings.get(mainVariant.value)}</p>
                            </div>
                        )}
                        
                        {expandedVariants.has(mainVariant.value) &&
                            mainVariant.subVariants?.map(subVariant =>
                                renderSubVariant(mainVariant, subVariant)
                            )
                        }
                    </div>
                ))}
            </div>
        </div>
    );
});

VariantCombinationsMobile.displayName = 'VariantCombinationsMobile';

export default VariantCombinationsMobile; 