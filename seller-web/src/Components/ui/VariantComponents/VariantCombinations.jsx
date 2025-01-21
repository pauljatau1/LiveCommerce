import React, { memo, useState, useCallback } from 'react';
import { Icon } from "@iconify/react";
import { useVariants } from '../../../Contexts/VariantContext';

const VariantCombinations = memo(() => {
    const { variantStructure, updateVariantValue } = useVariants();
    const [expandedVariants, setExpandedVariants] = useState(new Set());

    const handleInputChange = useCallback((variantPath, field, value) => {
        updateVariantValue(variantPath, field, value);
    }, [updateVariantValue]);

    const handleImageUpload = useCallback(async (e, variantPath) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateVariantValue(variantPath, 'images', [{
                    url: reader.result,
                    type: file.type,
                    isDefault: true
                }]);
            };
            reader.readAsDataURL(file);
        }
    }, [updateVariantValue]);

    const handleRemoveImage = useCallback((variantPath) => {
        updateVariantValue(variantPath, 'images', []);
    }, [updateVariantValue]);

    const ImageUploadButton = ({ variantPath, images = [] }) => (
        <div className="flex items-center gap-2">
            {images && images.length > 0 ? (
                <div className="relative group">
                    <img 
                        src={images[0].url} 
                        alt="Variant" 
                        className="w-8 h-8 rounded-md object-cover"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(variantPath);
                        }}
                        className="absolute -top-1 -right-1 hidden group-hover:flex bg-red-500 text-white rounded-full p-0.5"
                    >
                        <Icon icon="solar:close-circle-bold" className="w-3 h-3" />
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
                    <Icon 
                        icon="solar:gallery-add-bold" 
                        className="w-6 h-6 text-gray-400 hover:text-gray-600"
                    />
                </label>
            )}
        </div>
    );

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
            className="flex items-center justify-between py-2 pl-16 border-t"
        >
            <span className="text-sm text-gray-600">{subSubVariant.value}</span>
            <div className="flex gap-4">
                <input
                    type="text"
                    value={subSubVariant.price || ''}
                    onChange={(e) => handleInputChange(
                        `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                        'price',
                        e.target.value
                    )}
                    placeholder="Price"
                    className="w-24 px-3 py-1 border rounded"
                />
                <input
                    type="text"
                    value={subSubVariant.stock || ''}
                    onChange={(e) => handleInputChange(
                        `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                        'stock',
                        e.target.value
                    )}
                    placeholder="Stock"
                    className="w-24 px-3 py-1 border rounded"
                />
            </div>
        </div>
    );

    const renderSubVariant = (mainVariant, subVariant) => (
        <div key={`${mainVariant.value}-${subVariant.value}`}>
            <div 
                className="flex items-center justify-between py-2 pl-8 border-t cursor-pointer"
                onClick={() => toggleExpand(`${mainVariant.value}-${subVariant.value}`)}
            >
                <div className="flex items-center gap-2">
                    <ImageUploadButton 
                        variantPath={`${mainVariant.value}_${subVariant.value}`}
                        images={subVariant.images}
                    />
                    <Icon 
                        icon={expandedVariants.has(`${mainVariant.value}-${subVariant.value}`) ? "solar:alt-arrow-down-bold" : "solar:alt-arrow-right-bold"} 
                        className="w-4 h-4"
                    />
                    <span>{subVariant.value}</span>
                </div>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={subVariant.price || ''}
                        onChange={(e) => handleInputChange(
                            `${mainVariant.value}_${subVariant.value}`,
                            'price',
                            e.target.value
                        )}
                        placeholder="Price"
                        className="w-24 px-3 py-1 border rounded"
                        onClick={e => e.stopPropagation()}
                    />
                    <input
                        type="text"
                        value={subVariant.stock || ''}
                        onChange={(e) => handleInputChange(
                            `${mainVariant.value}_${subVariant.value}`,
                            'stock',
                            e.target.value
                        )}
                        placeholder="Stock"
                        className="w-24 px-3 py-1 border rounded"
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
                <div className="flex gap-8">
                    <span>Price</span>
                    <span>Available</span>
                </div>
            </div>
            <div className="border rounded-lg">
                {variantStructure.map(mainVariant => (
                    <div key={mainVariant.value}>
                        <div 
                            className="flex items-center justify-between p-4 cursor-pointer"
                            onClick={() => toggleExpand(mainVariant.value)}
                        >
                            <div className="flex items-center gap-2">
                                <ImageUploadButton 
                                    variantPath={mainVariant.value}
                                    images={mainVariant.images}
                                />
                                <Icon 
                                    icon={expandedVariants.has(mainVariant.value) ? "solar:alt-arrow-down-bold" : "solar:alt-arrow-right-bold"} 
                                    className="w-4 h-4"
                                />
                                <span>{mainVariant.value}</span>
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={mainVariant.price || ''}
                                    onChange={(e) => handleInputChange(
                                        mainVariant.value,
                                        'price',
                                        e.target.value
                                    )}
                                    placeholder="Price"
                                    className="w-24 px-3 py-1 border rounded"
                                    onClick={e => e.stopPropagation()}
                                />
                                <input
                                    type="text"
                                    value={mainVariant.stock || ''}
                                    onChange={(e) => handleInputChange(
                                        mainVariant.value,
                                        'stock',
                                        e.target.value
                                    )}
                                    placeholder="Stock"
                                    className="w-24 px-3 py-1 border rounded"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>
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