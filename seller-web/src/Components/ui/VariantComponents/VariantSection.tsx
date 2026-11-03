import { memo, useState, useCallback, useEffect, type MutableRefObject } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { useVariants } from '../../../Contexts/VariantContext';
import VariantOptions from './VariantOptions';
import VariantCard from './VariantCard';
import VariantCombinations from './VariantCombinations';
import VariantCombinationsMobile from './VariantCombinationsMobile';
import { Switch } from '../switch';
import { Label } from '../label';
import { Plus } from 'lucide-react';
import { VariantContextType } from '../../../types/variants';

interface VariantSectionProps {
    variantContextRef?: MutableRefObject<VariantContextType | null>;
    onReady?: (ctx: VariantContextType) => void;
}

const VariantSection = memo(({ variantContextRef, onReady }: VariantSectionProps) => {
    const variantContext = useVariants();
    const {
        options,
        deleteOption,
        setOptions,
        updateVariantValue,
        setVariantStructure
    } = variantContext;

    // Store the context in the ref for EditProduct to access
    useEffect(() => {
        if (variantContextRef) {
            variantContextRef.current = variantContext;
        }
        onReady?.(variantContext);
    }, [variantContext, variantContextRef, onReady]);

    const [isEnabled, setIsEnabled] = useState(options.length > 0);
    const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
    const [showAddOption, setShowAddOption] = useState(false);

    // Sync isEnabled with options length on mount or if options change externally
    useEffect(() => {
        if (options.length > 0) {
            setIsEnabled(true);
        }
    }, [options.length]);

    const handleToggle = useCallback((checked: boolean) => {
        setIsEnabled(checked);
        if (!checked) {
            // Clear all variants if disabled
            setOptions([]);
            setVariantStructure([]);
            setShowAddOption(false);
            setEditingVariantId(null);
        } else {
            // If enabling and no options, show add option form immediately
            if (options.length === 0) {
                setShowAddOption(true);
            }
        }
    }, [setOptions, setVariantStructure, options.length]);

    const handleDone = useCallback(() => {
        setShowAddOption(false);
        setEditingVariantId(null);
    }, []);

    const handleDeleteOption = useCallback((optionId: string) => {
        deleteOption(optionId);
    }, [deleteOption]);

    return (
        <Card className="relative border-none shadow-none bg-transparent p-0">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-bold text-[#344054] uppercase text-xs 3xl:text-sm ">Product Variants</CardTitle>
                        <Label htmlFor="variants-mode" className="font-medium text-[#272D30] text-xs 3xl:text-sm ">
                            Does this product have variations
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="variants-mode"
                            checked={isEnabled}
                            onCheckedChange={handleToggle}
                            className="data-[state=checked]:bg-[#0BB248]"
                        />
                    </div>
                </div>
            </CardHeader>

            {isEnabled && (
                <CardContent className="px-0 flex flex-col gap-6">
                    <div className="space-y-4">
                        {/* Show existing variant cards */}
                        {options.map(option => (
                            editingVariantId === option.id ? (
                                <VariantOptions
                                    key={option.id}
                                    onDone={() => setEditingVariantId(null)}
                                    editingVariant={option}
                                />
                            ) : (
                                <VariantCard
                                    key={option.id}
                                    variant={option}
                                    onEdit={() => setEditingVariantId(option.id)}
                                    onDelete={() => handleDeleteOption(option.id)}
                                />
                            )
                        ))}

                        {/* Show VariantOptions form when adding new option */}
                        {showAddOption && (
                            <VariantOptions onDone={handleDone} />
                        )}

                        {/* Show add another option button if not currently adding and limit not reached */}
                        {!showAddOption && options.length < 3 && (
                            <button
                                onClick={() => setShowAddOption(true)}
                                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-3 border-2 border-dashed border-gray-300 text-gray-500 text-sm hover:border-[#0BB248] hover:text-[#0BB248] hover:bg-green-50 transition-all duration-300 ease-in-out font-medium"
                            >
                                <Plus size={18} />
                                Add another option
                            </button>
                        )}

                        {/* Wrap combinations in a div */}
                        {options.length > 0 && (
                            <div className="mt-6">
                                <div className="hidden md:block">
                                    <VariantCombinations />
                                </div>
                                <div className="md:hidden">
                                    <VariantCombinationsMobile />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
});

VariantSection.displayName = 'VariantSection';

export default VariantSection;
