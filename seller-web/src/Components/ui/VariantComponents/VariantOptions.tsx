import { memo, useState, useCallback } from 'react';
import { useVariants } from '../../../Contexts/VariantContext';
import { VariantOption } from '../../../types/variants';
import { HelpCircle, Trash2 } from 'lucide-react';
import { Tooltip } from 'antd';
import ObjectID from 'bson-objectid';

interface VariantOptionsProps {
    onDone: () => void;
    editingVariant?: VariantOption;
}

const VariantOptions = memo(({ onDone, editingVariant }: VariantOptionsProps) => {
    const { addOption, updateOption, deleteOption, options, setOptions, setVariantStructure } = useVariants();
    const [optionName, setOptionName] = useState(editingVariant?.name || '');
    const [optionValues, setOptionValues] = useState<string[]>(
        editingVariant ? [...editingVariant.values, ''] : ['']
    );

    const handleDone = useCallback(() => {
        const validValues = optionValues.filter(value => value.trim() !== '');
        if (optionName && validValues.length > 0) {
            const optionData: VariantOption = {
                id: editingVariant?.id || ObjectID().toHexString(),
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
                        subVariants: mainVariant?.subVariants?.map(subVariant => ({
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
        <div className="border rounded-lg p-6 bg-white shadow-sm h-auto relative">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm text-gray-900">
                        {editingVariant ? `Edit ${editingVariant.name}` : 'Add New Option'}
                    </h3>
                    <div className="flex items-center gap-4">
                        {editingVariant && (
                            <button 
                                onClick={handleDelete}
                                className="w-11 h-11 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-full"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button 
                            onClick={handleDone} 
                            className="min-h-11 px-4 rounded-lg text-sm font-semibold text-[#0BB248] hover:text-[#099238] transition-colors border border-[#0BB248]/30 hover:border-[#0BB248] hover:bg-green-50"
                        >
                            Done
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Option Name</label>
                        <Tooltip title="Enter the name of the variant option (e.g., Color, Size)">
                            <HelpCircle size={14} className="text-[#0BB248] cursor-help" />
                        </Tooltip>
                    </div>
                    <input
                        type="text"
                        value={optionName}
                        onChange={(e) => setOptionName(e.target.value)}
                        placeholder="Option name (e.g., Color, Size)"
                        className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Option Values</label>
                        <Tooltip title="Enter the values for this option. New fields appear automatically.">
                            <HelpCircle size={14} className="text-[#0BB248] cursor-help" />
                        </Tooltip>
                    </div>
                    <div className="space-y-3">
                        {optionValues.map((value, index) => (
                            <div key={index} className="flex items-center gap-2 group">
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
                                    className="flex-1 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248]/20 focus:border-[#0BB248] transition-all"
                                />
                                {index < optionValues.length - 1 && (
                                    <button
                                        onClick={() => {
                                            const newValues = [...optionValues];
                                            newValues.splice(index, 1);
                                            setOptionValues(newValues);
                                        }}
                                        className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

VariantOptions.displayName = 'VariantOptions';

export default VariantOptions;
