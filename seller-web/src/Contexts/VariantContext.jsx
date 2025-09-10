import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const VariantContext = createContext();

export const VariantsProvider = ({ children }) => {
    const [options, setOptions] = useState([]);
    const [variantStructure, setVariantStructure] = useState([]);

    const addOption = useCallback((newOption) => {
        setOptions(prev => [...prev, newOption]);
        
        // Use functional updates to access current state instead of depending on it
        setOptions(currentOptions => {
            if (currentOptions.length === 1) { // This will be 1 because we just added the new option
                // First option becomes main variants
                setVariantStructure(
                    newOption.values.map(value => ({
                        name: newOption.name,
                        value,
                        price: '',
                        totalStock: 1,
                        images: [],
                        subVariants: []
                    }))
                );
            } else if (currentOptions.length === 2) {
                // Second option becomes subvariants for each main variant
                setVariantStructure(prev => 
                    prev.map(mainVariant => {
                        const calculatedStock = newOption.values.length;
                        return {
                            ...mainVariant,
                            totalStock: calculatedStock,
                            subVariants: newOption.values.map(value => ({
                                name: newOption.name,
                                value,
                                price: '',
                                stock: 1,
                                images: [],
                                subSubVariants: []
                            }))
                        };
                    })
                );
            } else if (currentOptions.length === 3) {
                // Third option becomes sub-subvariants for each subvariant
                setVariantStructure(prev => 
                    prev.map(mainVariant => {
                        const calculatedStock = mainVariant.subVariants.length * newOption.values.length;
                        return {
                            ...mainVariant,
                            totalStock: calculatedStock,
                            subVariants: mainVariant.subVariants.map(subVariant => ({
                                ...subVariant,
                                subSubVariants: newOption.values.map(value => ({
                                    name: newOption.name,
                                    value,
                                    price: '',
                                    stock: 1,
                                    sku: `SKU-${mainVariant.value}-${subVariant.value}-${value}`.toUpperCase(),
                                    images: []
                                }))
                            }))
                        };
                    })
                );
            }
            
            return currentOptions; // Return the current options unchanged
        });
    }, []); // Remove dependency on options

    const updateOption = useCallback((updatedOption) => {
        setOptions(prevOptions => {
            const optionIndex = prevOptions.findIndex(opt => opt.id === updatedOption.id);
            
            if (optionIndex === 0) { // Main variant (e.g., color)
                // Use functional update to access current variant structure
                setVariantStructure(currentVariantStructure => {
                    const existingStructure = [...currentVariantStructure];
                    const templateMain = existingStructure[0];
                    
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
                        // If no existing variant, create new one by cloning template sub-structures
                        let clonedSubVariants = [];
                        if (templateMain && Array.isArray(templateMain.subVariants) && templateMain.subVariants.length > 0) {
                            clonedSubVariants = templateMain.subVariants.map(templateSub => ({
                                name: templateSub.name,
                                value: templateSub.value,
                                price: '',
                                stock: 1,
                                images: [],
                                subSubVariants: Array.isArray(templateSub.subSubVariants) && templateSub.subSubVariants.length > 0
                                    ? templateSub.subSubVariants.map(templateSSV => ({
                                        name: templateSSV.name,
                                        value: templateSSV.value,
                                        price: '',
                                        stock: 1,
                                        sku: `SKU-${newValue}-${templateSub.value}-${templateSSV.value}`.toUpperCase(),
                                        images: []
                                    }))
                                    : []
                            }));
                        }
                        return {
                            name: updatedOption.name,
                            value: newValue,
                            price: '',
                            totalStock: clonedSubVariants.length || 1,
                            images: [],
                            subVariants: clonedSubVariants
                        };
                    });

                    return newStructure;
                });
            } else if (optionIndex === 1) { // Sub variant (e.g., size)
                setVariantStructure(prev => prev.map(mainVar => {
                    // Find a template subVariant (first available) to clone its sub-sub variants if needed
                    const templateSubVar = mainVar.subVariants && mainVar.subVariants.length > 0
                        ? mainVar.subVariants[0]
                        : null;
                    return {
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
                            // Clone sub-sub variants from template if present
                            const clonedSubSubVariants = templateSubVar && Array.isArray(templateSubVar.subSubVariants) && templateSubVar.subSubVariants.length > 0
                                ? templateSubVar.subSubVariants.map(templateSSV => ({
                                    name: templateSSV.name,
                                    value: templateSSV.value,
                                    price: '',
                                    stock: 1,
                                    sku: `SKU-${mainVar.value}-${newValue}-${templateSSV.value}`.toUpperCase(),
                                    images: []
                                }))
                                : [];
                            return {
                                name: updatedOption.name,
                                value: newValue,
                                price: '',
                                stock: 1,
                                images: [],
                                subSubVariants: clonedSubSubVariants
                            };
                        })
                    };
                }));
            } else if (optionIndex === 2) { // Sub-sub variant (e.g., material)
                // Update all subVariants' subSubVariants to align with updated values
                setVariantStructure(prev => prev.map(mainVar => ({
                    ...mainVar,
                    subVariants: mainVar.subVariants.map(subVar => ({
                        ...subVar,
                        subSubVariants: updatedOption.values.map(newValue => {
                            const existingSSV = subVar.subSubVariants.find(ssv => ssv.value === newValue);
                            if (existingSSV) {
                                return {
                                    ...existingSSV,
                                    name: updatedOption.name,
                                    value: newValue
                                };
                            }
                            return {
                                name: updatedOption.name,
                                value: newValue,
                                price: '',
                                stock: 1,
                                sku: `SKU-${mainVar.value}-${subVar.value}-${newValue}`.toUpperCase(),
                                images: []
                            };
                        })
                    }))
                })));
            }

            // Update options array
            const newOptions = [...prevOptions];
            newOptions[optionIndex] = updatedOption;
            return newOptions;
        });
    }, []); // Remove dependency on variantStructure

    const deleteOption = useCallback((optionId) => {
        setOptions(currentOptions => {
            const optionIndex = currentOptions.findIndex(opt => opt.id === optionId);
            
            if (optionIndex === 0) {
                // If deleting main variant (color), reset everything
                setVariantStructure([]);
                return [];
            } else if (optionIndex === 1) {
                // If deleting subvariant (size), remove both size and material options
                setVariantStructure(prev => 
                    prev.map(mainVariant => ({
                        ...mainVariant,
                        subVariants: [] // Clear all subvariants and their sub-subvariants
                    }))
                );
                return currentOptions.slice(0, 1);
            } else if (optionIndex === 2) {
                // If deleting sub-subvariant (material)
                setVariantStructure(prev => 
                    prev.map(mainVariant => ({
                        ...mainVariant,
                        subVariants: mainVariant.subVariants.map(subVar => ({
                            ...subVar,
                            subSubVariants: [] // Clear only sub-subvariants
                        }))
                    }))
                );
                return currentOptions.slice(0, 2);
            }
            
            return currentOptions;
        });
    }, []); // Remove dependency on options

    const updateVariantValue = useCallback((variantPath, field, value) => {
        if (field === 'images') {
            console.log('🔧 VariantContext updateVariantValue called for IMAGES:', {
                variantPath,
                field,
                value,
                valueLength: Array.isArray(value) ? value.length : 'not array'
            });
        }
        
        setVariantStructure(prev => {
            if (field === 'images') {
                console.log('📊 VariantContext current variantStructure before image update:', prev);
            }
            const [mainValue, subValue, subSubValue] = variantPath.split('_');
            
            const newStructure = prev.map(mainVariant => {
                if (mainVariant.value === mainValue) {
                    if (!subValue) {
                        // Updating main variant
                        if (field === 'images') {
                            console.log('🖼️ VariantContext updating MAIN variant images:', {
                                mainVariant: mainVariant.value,
                                oldImages: mainVariant.images,
                                newValue: value,
                                finalImages: Array.isArray(value) ? value : [value]
                            });
                            const updatedVariant = { 
                                ...mainVariant, 
                                images: Array.isArray(value) ? value : [value] 
                            };
                            console.log('✅ VariantContext MAIN variant after update:', updatedVariant);
                            return updatedVariant;
                        }
                        return { ...mainVariant, [field]: value };
                    }
                    
                    const updatedMainVariant = {
                        ...mainVariant,
                        subVariants: mainVariant.subVariants.map(subVariant => {
                            if (subVariant.value === subValue) {
                                if (!subSubValue) {
                                    // Updating sub variant
                                    if (field === 'images') {
                                        return { 
                                            ...subVariant, 
                                            images: Array.isArray(value) ? value : [value] 
                                        };
                                    }
                                    return { ...subVariant, [field]: value };
                                }
                                // Updating sub-sub variant
                                return {
                                    ...subVariant,
                                    subSubVariants: subVariant.subSubVariants.map(subSubVariant => {
                                        if (subSubVariant.value === subSubValue) {
                                            if (field === 'images') {
                                                return { 
                                                    ...subSubVariant, 
                                                    images: Array.isArray(value) ? value : [value] 
                                                };
                                            }
                                            return { ...subSubVariant, [field]: value };
                                        }
                                        return subSubVariant;
                                    })
                                };
                            }
                            return subVariant;
                        })
                    };
                    
                    // Auto-update main variant totalStock when subvariant stock changes
                    if (field === 'stock' && (subValue || subSubValue)) {
                        const calculatedStock = updatedMainVariant.subVariants.reduce((total, subVar) => 
                            total + (parseInt(subVar.stock) || 0) +
                            subVar.subSubVariants.reduce((subTotal, subSubVar) => 
                                subTotal + (parseInt(subSubVar.stock) || 0), 0
                            ), 0) || 1;
                        
                        // Always update mainVariant totalStock when subvariant stock changes
                        updatedMainVariant.totalStock = calculatedStock;
                    }
                    
                    return updatedMainVariant;
                }
                return mainVariant;
            });
            
            if (field === 'images') {
                console.log('📊 VariantContext updated variantStructure after image update:', newStructure);
            }
            return newStructure;
        });
    }, []);

    // Helper function to calculate minimum required stock for a main variant
    const calculateMinimumStock = useCallback((mainVariant) => {
        return mainVariant.subVariants.reduce((total, subVar) => 
            total + (parseInt(subVar.stock) || 0) +
            subVar.subSubVariants.reduce((subTotal, subSubVar) => 
                subTotal + (parseInt(subSubVar.stock) || 0), 0
            ), 0) || 1;
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        options,
        setOptions,
        variantStructure,
        setVariantStructure,
        addOption,
        updateOption,
        deleteOption,
        updateVariantValue,
        calculateMinimumStock
    }), [
        options,
        variantStructure,
        addOption,
        updateOption,
        deleteOption,
        updateVariantValue,
        calculateMinimumStock
    ]);

    return (
        <VariantContext.Provider value={contextValue}>
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
