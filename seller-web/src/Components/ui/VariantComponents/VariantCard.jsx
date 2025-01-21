import React, { memo, useState, useCallback } from 'react';
import { Icon } from "@iconify/react";
import { useVariants } from '../../../Contexts/VariantContext';
import PropTypes from 'prop-types';

const VariantCard = memo(({ variant }) => {
    const { options, updateOption, deleteOption } = useVariants();
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState(variant.values);

    const handleSave = useCallback(() => {
        updateOption({
            ...variant,
            values: editedValues.filter(v => v.trim() !== '')
        });
        setIsEditing(false);
    }, [variant, editedValues, updateOption]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        const optionIndex = options.findIndex(opt => opt.id === variant.id);
        deleteOption(variant.id);
    }, [variant.id, options, deleteOption]);

    return (
        <div className="p-2 sm:p-4 border rounded-lg bg-white space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm sm:text-base">{variant.name}</h3>
                <div className="flex items-center gap-1 sm:gap-2">
                    {isEditing ? (
                        <button 
                            onClick={handleSave}
                            className="p-1 sm:p-2 hover:bg-gray-50 rounded-lg"
                        >
                            <Icon icon="solar:check-circle-bold" className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="p-1 sm:p-2 hover:bg-gray-50 rounded-lg"
                        >
                            <Icon icon="solar:pen-bold" className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="p-1 sm:p-2 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                        <Icon icon="solar:trash-bin-trash-bold" className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
            <div className="mt-2">
                {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                        {editedValues.map((value, index) => (
                            <input
                                key={index}
                                value={value}
                                onChange={(e) => {
                                    const newValues = [...editedValues];
                                    newValues[index] = e.target.value;
                                    setEditedValues(newValues);
                                }}
                                className="border p-1 text-sm  rounded w-full sm:w-auto mb-1"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                        {variant.values.map((value, index) => (
                            <span 
                                key={index} 
                                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full text-xs sm:text-sm"
                            >
                                {value}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

VariantCard.displayName = 'VariantCard';

VariantCard.propTypes = {
    variant: PropTypes.object.isRequired
};

export default VariantCard; 