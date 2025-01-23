import React, { memo, useState, useCallback } from 'react';
import { Icon } from "@iconify/react";
import { useVariants } from '../../../Contexts/VariantContext';
import { Button } from '../button';

const VariantOptions = memo(({ onDone, editingVariant }) => {
    const { addOption, updateOption } = useVariants();
    const [optionName, setOptionName] = useState(editingVariant?.name || '');
    const [optionValues, setOptionValues] = useState(
        editingVariant ? [...editingVariant.values, ''] : ['']
    );
    
    const { 
        deleteOption, 
        options,
        variantStructure, 
        setVariantStructure,
        setOptions
    } = useVariants();

    const handleDone = useCallback(() => {
        const validValues = optionValues.filter(value => value.trim() !== '');
        if (optionName && validValues.length > 0) {
            const optionData = {
                id: editingVariant?.id || crypto.randomUUID(),
                name: optionName,
                values: validValues
            };

            if (editingVariant) {
                updateOption(optionData);
            } else {
                addOption(optionData);
            }
            onDone();
        }
    }, [optionName, optionValues, editingVariant, addOption, updateOption, onDone]);

    const handleDelete = useCallback(() => {
        if (editingVariant) {
            const optionIndex = options.findIndex(opt => opt.id === editingVariant.id);
            
            // Delete this option and all subsequent options
            setOptions(prev => prev.slice(0, optionIndex));
            
            if (optionIndex === 0) {
                // If deleting main variant, reset everything
                setVariantStructure([]);
            } else if (optionIndex === 1) {
                // If deleting subvariants, remove both subvariants and sub-subvariants
                setVariantStructure(prev => 
                    prev.map(mainVariant => ({
                        ...mainVariant,
                        subVariants: []
                    }))
                );
            } else if (optionIndex === 2) {
                // If deleting sub-subvariants
                setVariantStructure(prev => 
                    prev.map(mainVariant => ({
                        ...mainVariant,
                        subVariants: mainVariant.subVariants.map(subVariant => ({
                            ...subVariant,
                            subSubVariants: []
                        }))
                    }))
                );
            }
            onDone();
        }
    }, [editingVariant, options, setOptions, setVariantStructure, onDone]);

    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm h-auto">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Add {editingVariant ? editingVariant.name : 'Option'}</h3>
                    <button onClick={onDone} className="text-sm text-blue-600 hover:text-blue-700">
                        Done
                    </button>
                </div>
                <div>
                    <label className="text-sm text-gray-600">Option Name</label>
                    <input
                        type="text"
                        value={optionName}
                        onChange={(e) => setOptionName(e.target.value)}
                        placeholder="Option name (e.g., Color, Size)"
                        className="w-full mt-1 text-sm md:text-base p-2 border border-gray-300 rounded-lg"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-600">Option Values</label>
                    {optionValues.map((value, index) => (
                        <div key={index} className="mt-2 flex items-center gap-2">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => {
                                    const newValues = [...optionValues];
                                    newValues[index] = e.target.value;
                                    if (index === optionValues.length - 1 && e.target.value) {
                                        newValues.push('');
                                    }
                                    setOptionValues(newValues);
                                }}
                                placeholder="Option value"
                                className="flex-1 p-2 border border-gray-300 rounded-lg"
                            />
                            {index < optionValues.length - 1 && (
                                <button
                                    onClick={() => {
                                        const newValues = [...optionValues];
                                        newValues.splice(index, 1);
                                        setOptionValues(newValues);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

VariantOptions.displayName = 'VariantOptions';

export default VariantOptions; 