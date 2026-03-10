import { memo, useState, useCallback } from 'react';
import { useVariants } from '../../../Contexts/VariantContext';
import { VariantOption } from '../../../types/variants';

import { Edit2, Trash2, X, Check } from 'lucide-react';
import { Tooltip } from 'antd';

interface VariantCardProps {
    variant: VariantOption;
    onEdit: () => void;
    onDelete: () => void;
}

const VariantCard = memo(({ variant, onEdit, onDelete }: VariantCardProps) => {
    const { deleteOption } = useVariants();
    const [isEditing, setIsEditing] = useState(false);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    }, [onDelete]);

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{variant.name}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {variant.values.length} values
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip title="Edit this variant option">
                        <button
                            onClick={onEdit}
                            className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-[#0BB248] hover:bg-green-50 rounded-full transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete this variant option">
                        <button
                            onClick={handleDelete}
                            className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </Tooltip>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {variant.values.map((value, index) => (
                    <span
                        key={index}
                        className="px-3 py-1 bg-gray-50 text-gray-700 rounded-md text-sm border border-gray-100"
                    >
                        {value}
                    </span>
                ))}
            </div>
        </div>
    );
});

VariantCard.displayName = 'VariantCard';

export default VariantCard;
