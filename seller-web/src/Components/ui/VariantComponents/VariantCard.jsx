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
        <div className="border rounded-lg p-4 bg-white shadow-sm h-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">{variant.name}</h3>
                <div className="flex gap-2 w-[72px] justify-end ">
                    {isEditing ? (
                        <button 
                            onClick={handleSave}
                            className="p-1 hover:bg-gray-100 rounded w-8 h-8 flex items-center justify-center"
                        >
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4 flex-shrink-0" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="p-1 hover:bg-gray-100 rounded w-8 h-8 flex items-center justify-center"
                        >
                            <Icon icon="solar:pen-2-linear" className="w-4 h-4 flex-shrink-0" />
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="p-1 hover:bg-gray-100 rounded w-8 h-8 flex items-center justify-center"
                    >
                        <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4 flex-shrink-0" />
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {isEditing ? (
                    editedValues.map((value, index) => (
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
                    ))
                ) : (
                    variant.values.map((value, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {value}
                        </span>
                    ))
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