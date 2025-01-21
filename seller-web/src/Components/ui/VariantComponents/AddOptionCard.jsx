import React, { memo, useState, useCallback } from 'react';
import { Icon } from "@iconify/react";
import { useVariants } from '../../../Contexts/VariantContext';

const AddOptionCard = memo(({ onDone }) => {
    const [optionName, setOptionName] = useState('');
    const [optionValues, setOptionValues] = useState(['']);
    const { addOption } = useVariants();

    const handleValueChange = useCallback((index, value) => {
        setOptionValues(prev => {
            const newValues = [...prev];
            newValues[index] = value;
            // Add new input field if typing in last field and value isn't empty
            if (index === prev.length - 1 && value !== '') {
                newValues.push('');
            }
            return newValues;
        });
    }, []);

    const handleDeleteValue = useCallback((indexToDelete) => {
        setOptionValues(prev => prev.filter((_, index) => index !== indexToDelete));
    }, []);

    const handleDone = useCallback(() => {
        const validValues = optionValues.filter(value => value.trim() !== '');
        if (optionName && validValues.length > 0) {
            addOption({
                id: crypto.randomUUID(),
                name: optionName,
                values: validValues
            });
            onDone();
        }
    }, [optionName, optionValues, addOption, onDone]);

    return (
        <div className="p-6 border rounded-lg bg-white">
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-gray-600">Option name</label>
                    <input
                        type="text"
                        value={optionName}
                        onChange={(e) => setOptionName(e.target.value)}
                        placeholder="size, color, material, etc."
                        className="w-full mt-1 text-sm  p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-600">Option values</label>
                    {optionValues.map((value, index) => (
                        <div key={index} className="mt-2 flex items-center gap-2">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => handleValueChange(index, e.target.value)}
                                placeholder="Enter option value"
                                className="w-full text-sm md:flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {index < optionValues.length - 1 && (
                                <button
                                    onClick={() => handleDeleteValue(index)}
                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button
                    onClick={handleDone}
                    className="px-4 py-2 text-xs md:text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );
});

AddOptionCard.displayName = 'AddOptionCard';

export default AddOptionCard; 