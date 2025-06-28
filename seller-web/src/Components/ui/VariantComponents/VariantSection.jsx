import { memo, useState, useCallback, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { useVariants } from '../../../Contexts/VariantContext';
import VariantOptions from './VariantOptions';
import VariantCard from './VariantCard';
import VariantCombinations from './VariantCombinations';
import VariantCombinationsMobile from './VariantCombinationsMobile';
import AddOptionCard from './AddOptionCard';
import PropTypes from 'prop-types';

const VariantSection = memo(({ variantContextRef }) => {
    const variantContext = useVariants();

    // Store the context in the ref for EditProduct to access
    useEffect(() => {
        if (variantContextRef) {
            variantContextRef.current = variantContext;
        }
    }, [variantContext, variantContextRef]);

    const [showAddOption, setShowAddOption] = useState(false);
    const [editingVariantId, setEditingVariantId] = useState(null);
    const {
        options,
        deleteOption,
        setOptions,
        updateVariantValue,
    } = useVariants();

    const handleDone = useCallback(() => {
        setShowAddOption(false);
        setEditingVariantId(null);
    }, []);

    const handleDeleteOption = useCallback((optionId) => {
        const optionIndex = options.findIndex(opt => opt.id === optionId);

        // If deleting a subvariant (size), remove both size and material cards
        if (optionIndex === 1) {
            // Remove both size and material options
            setOptions(prev => prev.slice(0, 1)); // Keep only the first option (color)
            deleteOption(optionId); // Also call deleteOption to update variant combinations
        } else {
            deleteOption(optionId);
        }
        updateVariantValue(optionId, null, null);
    }, [deleteOption, updateVariantValue, options, setOptions]);

    return (
        <Card className="relative">
            <CardHeader>
                <CardTitle>Variants (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col min-h-[400px]">
                {options.length === 0 && !showAddOption ? (
                    // Initial empty state
                    <>
                        <div className="text-center py-8">
                            <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="mt-2 text-gray-500">Add a new variant, there are none yet!!</p>
                        </div>
                        <Button
                            onClick={() => setShowAddOption(true)}
                            className="mt-4 lg:mt-12 bg-[#17171B]/90 flex items-center justify-center gap-0 text-white rounded-full px-3 py-3 text-[11px] md:text-sm lg:px-3 lg:py-5 hover:bg-[#17171B]/80 hover:scale-95 transition-all duration-300 ease-in-out hover:text-white w-full md:w-auto"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 1024 1024"
                                className="w-4 h-4 mr-2"
                            >
                                <path
                                    fill="currentColor"
                                    d="M512 0C229.232 0 0 229.232 0 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512C1024 229.232 794.784 0 512 0m0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01M736 480H544V288c0-17.664-14.336-32-32-32s-32 14.336-32 32v192H288c-17.664 0-32 14.336-32 32s14.336 32 32 32h192v192c0 17.664 14.336 32 32 32s32-14.336 32-32V544h192c17.664 0 32-14.336 32-32s-14.336-32-32-32"
                                />
                            </svg>
                            Add options like size or color
                        </Button>
                    </>
                ) : (
                    <div className="space-y-4 h-full">
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

                        {/* Show AddOptionCard when adding new option */}
                        {showAddOption && (
                            <AddOptionCard onDone={handleDone} />
                        )}

                        {/* Show add another option button if not currently adding */}
                        {!showAddOption && options.length < 3 && (
                            <button
                                onClick={() => setShowAddOption(true)}
                                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 bg-[#FFFFFF]/90 border border-gray-300 text-gray-500 hover:bg-[#FFFFFF]/80 hover:border-gray-500 hover:text-gray-700 transition-all duration-300 ease-in-out"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1024 1024"
                                    className="w-4 h-4 mr-2"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M512 0C229.232 0 0 229.232 0 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512C1024 229.232 794.784 0 512 0m0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01M736 480H544V288c0-17.664-14.336-32-32-32s-32 14.336-32 32v192H288c-17.664 0-32 14.336-32 32s14.336 32 32 32h192v192c0 17.664 14.336 32 32 32s32-14.336 32-32V544h192c17.664 0 32-14.336 32-32s-14.336-32-32-32"
                                    />
                                </svg>
                                Add another option
                            </button>
                        )}

                        {/* Wrap combinations in a div with fixed height */}
                        {options.length > 0 && (
                            <div className="h-full max-h-[600px]">
                                <div className="hidden md:block">
                                    <VariantCombinations />
                                </div>
                                <div className="md:hidden">
                                    <VariantCombinationsMobile />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

VariantSection.displayName = 'VariantSection';

VariantSection.propTypes = {
    variantContextRef: PropTypes.shape({
        current: PropTypes.object
    })
};

export default VariantSection; 