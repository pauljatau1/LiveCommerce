import { memo, useState, useCallback, useEffect } from 'react';
import { useVariants } from '../../../Contexts/VariantContext';
import { useNotification } from '@/Hooks/useNotification';
import { ChevronDown, ChevronRight, Upload, X, ImageIcon } from 'lucide-react';
import { MainVariant, SubVariant, SubSubVariant } from '../../../types/variants';

const VariantCombinations = memo(() => {
    const { variantStructure, updateVariantValue, calculateMinimumStock } = useVariants();
    const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
    const [stockWarnings, setStockWarnings] = useState<Map<string, string>>(new Map());
    const { showNotification } = useNotification();

    // Monitor variantStructure changes for image debugging (throttled)
    useEffect(() => {
        const logTimeout = setTimeout(() => {
            console.log('🔍 DESKTOP VariantCombinations - variantStructure changed', 
                variantStructure.map(v => ({ value: v.value, images: v.images, imageCount: v.images?.length || 0 }))
            );
        }, 100);

        return () => clearTimeout(logTimeout);
    }, [variantStructure]);

    const handleInputChange = useCallback((variantPath: string, field: string, value: string) => {
        updateVariantValue(variantPath, field, value);
    }, [updateVariantValue]);

    const handleTotalStockChange = useCallback((variantPath: string, value: string, minStock: number) => {
        // Allow empty string for full editability
        if (value === '') {
            updateVariantValue(variantPath, 'totalStock', '');
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
            const currentStock = typeof mainVariant.totalStock === 'string' 
                ? parseInt(mainVariant.totalStock) || 0 
                : mainVariant.totalStock || 0;
            
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

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, variantPath: string) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (7MB = 7 * 1024 * 1024 bytes)
            const MAX_FILE_SIZE = 7 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                showNotification('Image size must be less than 7MB', 'error', 'dismissible');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                updateVariantValue(variantPath, 'images', [{
                    url: reader.result as string,
                    contentType: file.type,
                    isDefault: true
                }]);
                showNotification('Variant image uploaded successfully', 'information', 'dismissible');
            };
            reader.readAsDataURL(file);
        }
    }, [updateVariantValue, showNotification]);

    const handleRemoveImage = useCallback((variantPath: string) => {
        updateVariantValue(variantPath, 'images', []);
    }, [updateVariantValue]);

    const ImageUploadButton = ({ variantPath, images = [] }: { variantPath: string, images?: any[] }) => {
        return (
            <div className="flex items-center gap-2">
                {images && images.length > 0 ? (
                <div className="relative group">
                    <img
                        src={images[0].url}
                        alt="Variant"
                        className="w-11 h-11 rounded-md object-cover border border-gray-200"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(variantPath);
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-full shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <label className="w-11 h-11 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-lg transition-colors" onClick={e => e.stopPropagation()}>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, variantPath)}
                    />
                    <ImageIcon className="w-5 h-5 text-gray-400 hover:text-[#0BB248]" />
                </label>
            )}
        </div>
        );
    };

    const toggleExpand = (variantId: string) => {
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

    const renderSubSubVariant = (mainVariant: MainVariant, subVariant: SubVariant, subSubVariant: SubSubVariant) => (
        <div
            key={`${mainVariant.value}-${subVariant.value}-${subSubVariant.value}`}
            className="flex items-center justify-between py-3 pl-12 border-t border-gray-100 bg-gray-50/50"
        >
            <div className="flex items-center gap-3">
                <ImageUploadButton
                    variantPath={`${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`}
                    images={subSubVariant.images || []}
                />
                <span className="text-sm text-gray-600">{subSubVariant.value}</span>
            </div>
            <div className="flex gap-4">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                    <input
                        type="number"
                        value={subSubVariant.price || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                            'price',
                            e.target.value
                        )}
                        placeholder="0.00"
                        className="w-28 pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                    />
                </div>
                <input
                    type="number"
                    value={subSubVariant.stock || ''}
                    onChange={(e) => updateVariantValue(
                        `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                        'stock',
                        e.target.value
                    )}
                    placeholder="Stock"
                    className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                />
            </div>
        </div>
    );

    const renderSubVariant = (mainVariant: MainVariant, subVariant: SubVariant) => (
        <div key={`${mainVariant.value}-${subVariant.value}`}>
            <div
                className="flex items-center justify-between py-3 pl-8 border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(`${mainVariant.value}-${subVariant.value}`)}
            >
                <div className="flex items-center gap-3">
                    <ImageUploadButton
                        variantPath={`${mainVariant.value}_${subVariant.value}`}
                        images={subVariant.images || []}
                    />
                    {expandedVariants.has(`${mainVariant.value}-${subVariant.value}`) ? (
                        <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">{subVariant.value}</span>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <input
                            type='number'
                            value={subVariant.price || ''}
                            onChange={(e) => handleInputChange(
                                `${mainVariant.value}_${subVariant.value}`,
                                'price',
                                e.target.value
                            )}
                            placeholder="0.00"
                            className="w-28 pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <input
                        type="number"
                        value={subVariant.stock || ''}
                        onChange={(e) => handleInputChange(
                            `${mainVariant.value}_${subVariant.value}`,
                            'stock',
                            e.target.value
                        )}
                        placeholder="Stock"
                        className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
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
        <div className="mt-6 flex flex-col h-full max-h-[600px]">
            <div className="flex justify-between mb-3 px-4 sticky top-0 bg-[#FAFAFB] z-10 py-2 border-b border-gray-100">
                <h3 className="font-medium text-xs 3xl:text-sm text-[#8492A6]">Variant Combinations</h3>
                <div className="flex gap-16 text-[#8492A6] text-xs 3xl:text-sm font-medium mr-8">
                    <span>Price</span>
                    <span>Quantity</span>
                </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-y-auto custom-scrollbar">
                {variantStructure.map(mainVariant => (
                    <div key={mainVariant.value} className="bg-white">
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleExpand(mainVariant.value)}
                        >
                            <div className="flex items-center gap-3">
                                <ImageUploadButton
                                    variantPath={mainVariant.value}
                                    images={mainVariant.images || []}
                                />
                                {expandedVariants.has(mainVariant.value) ? (
                                    <ChevronDown size={16} className="text-gray-400" />
                                ) : (
                                    <ChevronRight size={16} className="text-gray-400" />
                                )}
                                <span className="font-medium text-sm text-gray-900">{mainVariant.value}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                                    <input
                                        type='number'
                                        value={mainVariant.price || ''}
                                        onChange={(e) => handleInputChange(
                                            mainVariant.value,
                                            'price',
                                            e.target.value
                                        )}
                                        placeholder="0.00"
                                        className="w-28 pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={mainVariant.totalStock !== undefined ? mainVariant.totalStock : calculateMinimumStock(mainVariant)}
                                    onChange={(e) => handleTotalStockChange(
                                        mainVariant.value,
                                        e.target.value,
                                        calculateMinimumStock(mainVariant)
                                    )}
                                    placeholder="Stock"
                                    className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        
                        {stockWarnings.has(mainVariant.value) && (
                            <div className="px-4 pb-2 bg-red-50/50">
                                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                    {stockWarnings.get(mainVariant.value)}
                                </p>
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

VariantCombinations.displayName = 'VariantCombinations';

export default VariantCombinations;
