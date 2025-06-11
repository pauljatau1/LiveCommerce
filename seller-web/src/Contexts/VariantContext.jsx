import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const VariantContext = createContext();

export const VariantsProvider = ({ children }) => {
    const [options, setOptions] = useState([]);
    const [variantStructure, setVariantStructure] = useState([]);

    const addOption = useCallback((newOption) => {
        setOptions(prev => [...prev, newOption]);
        
        if (options.length === 0) {
            // First option becomes main variants
            setVariantStructure(
                newOption.values.map(value => ({
                    name: newOption.name,
                    value,
                    price: '',
                    totalStock: '',
                    images: [],
                    subVariants: []
                }))
            );
        } else if (options.length === 1) {
            // Second option becomes subvariants for each main variant
            setVariantStructure(prev => 
                prev.map(mainVariant => ({
                    ...mainVariant,
                    subVariants: newOption.values.map(value => ({
                        name: newOption.name,
                        value,
                        price: '',
                        stock: '',
                        images: [],
                        subSubVariants: []
                    }))
                }))
            );
        } else if (options.length === 2) {
            // Third option becomes sub-subvariants for each subvariant
            setVariantStructure(prev => 
                prev.map(mainVariant => ({
                    ...mainVariant,
                    subVariants: mainVariant.subVariants.map(subVariant => ({
                        ...subVariant,
                        subSubVariants: newOption.values.map(value => ({
                            name: newOption.name,
                            value,
                            price: '',
                            stock: '',
                            sku: `SKU-${mainVariant.value}-${subVariant.value}-${value}`.toUpperCase(),
                            images: []
                        }))
                    }))
                }))
            );
        }
    }, [options]);

    const updateOption = useCallback((updatedOption) => {
        setOptions(prevOptions => {
            const optionIndex = prevOptions.findIndex(opt => opt.id === updatedOption.id);
            
            if (optionIndex === 0) { // Main variant (color)
                // Get existing variant structure
                const existingStructure = [...variantStructure];
                
                // Create new structure preserving sub and sub-sub variants
                const newStructure = updatedOption.values.map(newValue => {
                    // Find existing main variant with same value to preserve its structure
                    const existingVariant = existingStructure.find(v => v.value === newValue);
                    if (existingVariant) {
                        return {
                            ...existingVariant,
                            name: updatedOption.name,
                            value: newValue
                        };
                    }
                    // If no existing variant, create new one with empty sub-structures
                    return {
                        name: updatedOption.name,
                        value: newValue,
                        price: '',
                        images: [],
                        subVariants: []
                    };
                });

                setVariantStructure(newStructure);
            } else if (optionIndex === 1) { // Sub variant (size)
                setVariantStructure(prev => prev.map(mainVar => ({
                    ...mainVar,
                    subVariants: updatedOption.values.map(newValue => {
                        // Find existing sub variant to preserve its sub-sub variants
                        const existingSubVar = mainVar.subVariants.find(sv => sv.value === newValue);
                        if (existingSubVar) {
                            return {
                                ...existingSubVar,
                                name: updatedOption.name,
                                value: newValue
                            };
                        }
                        return {
                            name: updatedOption.name,
                            value: newValue,
                            price: '',
                            images: [],
                            subSubVariants: []
                        };
                    })
                })));
            }

            // Update options array
            const newOptions = [...prevOptions];
            newOptions[optionIndex] = updatedOption;
            return newOptions;
        });
    }, [variantStructure]);

    const deleteOption = useCallback((optionId) => {
        const optionIndex = options.findIndex(opt => opt.id === optionId);
        
        if (optionIndex === 0) {
            // If deleting main variant (color), reset everything
            setOptions([]);
            setVariantStructure([]);
        } else if (optionIndex === 1) {
            // If deleting subvariant (size), remove both size and material options
            setOptions(prev => prev.slice(0, 1));
            setVariantStructure(prev => 
                prev.map(mainVariant => ({
                    ...mainVariant,
                    subVariants: [] // Clear all subvariants and their sub-subvariants
                }))
            );
        } else if (optionIndex === 2) {
            // If deleting sub-subvariant (material)
            setOptions(prev => prev.slice(0, 2));
            setVariantStructure(prev => 
                prev.map(mainVariant => ({
                    ...mainVariant,
                    subVariants: mainVariant.subVariants.map(subVar => ({
                        ...subVar,
                        subSubVariants: [] // Clear only sub-subvariants
                    }))
                }))
            );
        }
    }, [options]);

    const updateVariantValue = useCallback((variantPath, field, value) => {
        setVariantStructure(prev => {
            const [mainValue, subValue, subSubValue] = variantPath.split('_');
            return prev.map(mainVariant => {
                if (mainVariant.value === mainValue) {
                    if (!subValue) {
                        return { ...mainVariant, [field]: value };
                    }
                    return {
                        ...mainVariant,
                        subVariants: mainVariant.subVariants.map(subVariant => {
                            if (subVariant.value === subValue) {
                                if (!subSubValue) {
                                    return { ...subVariant, [field]: value };
                                }
                                return {
                                    ...subVariant,
                                    subSubVariants: subVariant.subSubVariants.map(subSubVariant => 
                                        subSubVariant.value === subSubValue
                                            ? { ...subSubVariant, [field]: value }
                                            : subSubVariant
                                    )
                                };
                            }
                            return subVariant;
                        })
                    };
                }
                return mainVariant;
            });
        });
    }, []);

    return (
        <VariantContext.Provider value={{
            options,
            setOptions,
            variantStructure,
            setVariantStructure,
            addOption,
            updateOption,
            deleteOption,
            updateVariantValue
        }}>
            {children}
        </VariantContext.Provider>
    );
};

VariantsProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useVariants = () => {
    const context = useContext(VariantContext);
    if (!context) {
        throw new Error('useVariants must be used within a VariantProvider');
    }
    return context;
};

export default VariantContext;
