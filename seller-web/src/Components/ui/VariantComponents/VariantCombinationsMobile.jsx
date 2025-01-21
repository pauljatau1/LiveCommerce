import React, { memo, useState } from 'react';
import { Icon } from "@iconify/react";
import { useVariants } from '../../../Contexts/VariantContext';

const VariantCombinationsMobile = memo(() => {
    const [expandedVariants, setExpandedVariants] = useState(new Set());
    const { variantStructure, updateVariantValue } = useVariants();

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
            <div className="p-3 pl-12 bg-gray-50">
                <span className="text-sm text-gray-600">{subSubVariant.value}</span>
                <div className="mt-2 space-y-2">
                    <input
                        type="text"
                        value={subSubVariant.price || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                            'price',
                            e.target.value
                        )}
                        placeholder="Price"
                        className="w-full px-3 py-1.5 border rounded"
                    />
                    <input
                        type="text"
                        value={subSubVariant.stock || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}_${subSubVariant.value}`,
                            'stock',
                            e.target.value
                        )}
                        placeholder="Stock"
                        className="w-full px-3 py-1.5 border rounded"
                    />
                </div>
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
                        <Icon 
                            icon={expandedVariants.has(`${mainVariant.value}-${subVariant.value}`) ? "solar:alt-arrow-down-bold" : "solar:alt-arrow-right-bold"} 
                            className="w-4 h-4"
                        />
                        <span className="text-sm">{subVariant.value}</span>
                    </div>
                </div>
                <div className="p-3 pl-6 space-y-2">
                    <input
                        type="text"
                        value={subVariant.price || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}`,
                            'price',
                            e.target.value
                        )}
                        placeholder="Price"
                        className="w-full text-sm px-3 py-1.5 border rounded"
                        onClick={e => e.stopPropagation()}
                    />
                    <input
                        type="text"
                        value={subVariant.stock || ''}
                        onChange={(e) => updateVariantValue(
                            `${mainVariant.value}_${subVariant.value}`,
                            'stock',
                            e.target.value
                        )}
                        placeholder="Stock"
                        className="w-full text-sm px-3 py-1.5 border rounded"
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
                                    <Icon 
                                        icon={expandedVariants.has(mainVariant.value) ? "solar:alt-arrow-down-bold" : "solar:alt-arrow-right-bold"} 
                                        className="w-4 h-4"
                                    />
                                    <span>{mainVariant.value}</span>
                                </div>
                            </div>
                            <div className="px-3 pb-3 space-y-2">
                                <input
                                    type="text"
                                    value={mainVariant.price || ''}
                                    onChange={(e) => updateVariantValue(
                                        mainVariant.value,
                                        'price',
                                        e.target.value
                                    )}
                                    placeholder="Price"
                                    className="w-full px-3 py-1.5 border rounded"
                                    onClick={e => e.stopPropagation()}
                                />
                                <input
                                    type="text"
                                    value={mainVariant.stock || ''}
                                    onChange={(e) => updateVariantValue(
                                        mainVariant.value,
                                        'stock',
                                        e.target.value
                                    )}
                                    placeholder="Stock"
                                    className="w-full px-3 py-1.5 border rounded"
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

VariantCombinationsMobile.displayName = 'VariantCombinationsMobile';

export default VariantCombinationsMobile; 