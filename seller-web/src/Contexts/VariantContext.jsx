import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export const VariantContext = createContext();

export const VariantProvider = ({ children }) => {
    const [variants, setVariants] = useState([]);
    const [variantDetails, setVariantDetails] = useState({});
    const [draftValues, setDraftValues] = useState({});
    const draftRef = useRef({});
    const [inputValues, setInputValues] = useState({});

    const batchUpdate = useCallback((updates) => {
        setVariantDetails(prev => {
            const variantPath = Object.keys(updates)[0];
            // Ensure prev and prev[variantPath] exist
            if (!prev || !prev[variantPath]) {
                return {
                    ...prev,
                    [variantPath]: {
                        images: [],
                        price: 0,
                        stock: 0,
                        ...updates[variantPath]
                    }
                };
            }

            return {
                ...prev,
                [variantPath]: {
                    ...prev[variantPath],
                    price: updates[variantPath].price ? Number(updates[variantPath].price) : prev[variantPath].price,
                    stock: updates[variantPath].stock ? Number(updates[variantPath].stock) : prev[variantPath].stock,
                    images: updates[variantPath].images || prev[variantPath].images
                }
            };
        });
    }, []);

    const updateDraft = useCallback((variantPath, field, value) => {
        draftRef.current[variantPath] = {
            ...draftRef.current[variantPath],
            [field]: value
        };
    }, []);
    
    const updateVariantDetails = useCallback((variantPath, details) => {
        // Convert price and stock to numbers if they exist
        const normalizedDetails = {
            ...details,
            price: details.price ? Number(details.price) : details.price,
            stock: details.stock ? Number(details.stock) : details.stock
        };

        batchUpdate({
            [variantPath]: {
                ...variantDetails[variantPath],
                ...normalizedDetails
            }
        });
    }, [variantDetails, batchUpdate]);

    const commitDraft = useCallback((variantPath) => {
        if (draftRef.current[variantPath]) {
            const draftValues = draftRef.current[variantPath];
            console.log('draft values', draftValues); // For debugging
            
            updateVariantDetails(variantPath, {
                price: draftValues.price,
                stock: draftValues.stock
            });
            delete draftRef.current[variantPath];
        }
    }, [updateVariantDetails]);


    const addColorVariant = useCallback((colorVariant) => {
        setVariants(prev => {
            const existingIndex = prev.findIndex(v => v.id === colorVariant.id);
            if (existingIndex !== -1) {
                // Update existing variant
                return prev.map((variant, index) => 
                    index === existingIndex 
                        ? { ...variant, name: colorVariant.name, value: colorVariant.value }
                        : variant
                );
            } else {
                // Create new variant with unique ID
                return [...prev, {
                    id: colorVariant.id,
                    name: colorVariant.name,
                    value: colorVariant.value,
                    subVariants: []
                }];
            }
        });
    }, []);

    const addSizeVariant = useCallback((colorId, sizeVariant) => {
        setVariants(prev => prev.map(colorVar => {
            if (colorVar.id === colorId) {
                const existingSizeIndex = colorVar.subVariants.findIndex(
                    v => v.id === sizeVariant.id
                );
                
                return {
                    ...colorVar,
                    subVariants: existingSizeIndex !== -1
                        ? colorVar.subVariants.map((sizeVar, index) =>
                            index === existingSizeIndex
                                ? { ...sizeVar, name: sizeVariant.name, value: sizeVariant.value }
                                : sizeVar
                          )
                        : [...colorVar.subVariants, {
                            id: sizeVariant.id,
                            name: sizeVariant.name,
                            value: sizeVariant.value,
                            subSubVariants: []
                        }]
                };
            }
            return colorVar;
        }));
    }, []);

    const addMaterialVariant = useCallback((parentPath, materialVariant) => {
        const [colorValue, sizeValue] = parentPath.split('_');
        setVariants(prev => prev.map(colorVar => {
            if (colorVar.value === colorValue) {
                return {
                    ...colorVar,
                    subVariants: colorVar.subVariants.map(sizeVar => {
                        if (sizeVar.value === sizeValue) {
                            const existingMaterialIndex = sizeVar.subSubVariants.findIndex(
                                v => v.id === materialVariant.id
                            );

                            return {
                                ...sizeVar,
                                subSubVariants: existingMaterialIndex !== -1
                                    ? sizeVar.subSubVariants.map((materialVar, index) =>
                                        index === existingMaterialIndex
                                            ? { ...materialVar, name: materialVariant.name, value: materialVariant.value }
                                            : materialVar
                                      )
                                    : [...sizeVar.subSubVariants, {
                                        id: materialVariant.id,
                                        name: materialVariant.name,
                                        value: materialVariant.value
                                    }]
                            };
                        }
                        return sizeVar;
                    })
                };
            }
            return colorVar;
        }));
    }, []);

    const handlePriceChange = useCallback((variantPath, value) => {
        updateVariantDetails(variantPath, {
            price: value
        });
    }, [updateVariantDetails]);

    const handleStockChange = useCallback((variantPath, value) => {
        updateVariantDetails(variantPath, {
            stock: value
        });
    }, [updateVariantDetails]);

    const getTotalStock = useCallback((mainVariant) => {
        // Get all keys from both variantDetails and draftRef
        const allKeys = new Set([
            ...Object.keys(variantDetails),
            ...Object.keys(draftRef.current)
        ]);

        // Filter and sum all relevant variants
        return Array.from(allKeys).reduce((total, key) => {
            // Check if this key belongs to the main variant
            if (key.startsWith(mainVariant) && key !== mainVariant) {
                // Get stock from draft or committed state
                const draftStock = Number(draftRef.current[key]?.stock) || 0;
                const committedStock = Number(variantDetails[key]?.stock) || 0;
                
                // Use draft value if it exists, otherwise use committed value
                return total + (draftRef.current[key] ? draftStock : committedStock);
            }
            console.log('total', total);
            return total;
        }, 0);
    }, [variantDetails]);

    const processImages = async (images) => {
        return (images || []).map(img => ({
            data: img.data,
            contentType: img.contentType,
            isDefault: img.isDefault || false
        }));
    };

    const getVariantsForSubmission = async () => {
        return Promise.all(variants.map(async (colorVar) => ({
            name: colorVar.name,
            value: colorVar.value,
            price: Number(variantDetails[colorVar.value]?.price || 0),
            totalStock: getTotalStock(colorVar.value),
            images: await processImages(variantDetails[colorVar.value]?.images || []),
            subVariants: await Promise.all((colorVar.subVariants || []).map(async (sizeVar) => ({
                name: sizeVar.name,
                value: sizeVar.value,
                price: Number(variantDetails[`${colorVar.value}_${sizeVar.value}`]?.price || 0),
                stock: variantDetails[`${colorVar.value}_${sizeVar.value}`]?.stock || 0,
                images: await processImages(variantDetails[`${colorVar.value}_${sizeVar.value}`]?.images || []),
                subSubVariants: await Promise.all((sizeVar.subSubVariants || []).map(async (materialVar) => ({
                    name: materialVar.name,
                    value: materialVar.value,
                    price: Number(variantDetails[`${colorVar.value}_${sizeVar.value}_${materialVar.value}`]?.price || 0),
                    stock: Number(variantDetails[`${colorVar.value}_${sizeVar.value}_${materialVar.value}`]?.stock || 0),
                    sku: `${colorVar.value}-${sizeVar.value}-${materialVar.value}`.toUpperCase(),
                    images: await processImages(variantDetails[`${colorVar.value}_${sizeVar.value}_${materialVar.value}`]?.images || [])
                })))
            })))
        })));
    };

    const handleVariantInput = useCallback((variantPath, field, value) => {
        setInputValues(prev => ({
            ...prev,
            [variantPath]: {
                ...prev[variantPath],
                [field]: value
            }
        }));
    }, []);

    const syncVariantDetails = useCallback((variantPath) => {
        const values = inputValues[variantPath];
        if (values) {
            setVariantDetails(prev => ({
                ...prev,
                [variantPath]: {
                    ...prev[variantPath],
                    ...values
                }
            }));
        }
    }, [inputValues]);

    useEffect(() => {
        Object.entries(inputValues).forEach(([variantPath, values]) => {
            setVariantDetails(prev => ({
                ...prev,
                [variantPath]: {
                    ...prev[variantPath],
                    ...values
                }
            }));
        });
    }, [inputValues]);

    const getDraftValue = useCallback((variantPath, field) => 
        draftRef.current[variantPath]?.[field] ?? variantDetails[variantPath]?.[field],
    [variantDetails]);

    const value = {
        variants,
        setVariants,
        variantDetails,
        addColorVariant,
        addSizeVariant,
        addMaterialVariant,
        updateVariantDetails,
        getTotalStock,
        getVariantsForSubmission,
        handlePriceChange,
        handleStockChange,
        handleVariantInput,
        inputValues,
        updateDraft,
        commitDraft,
        getDraftValue,
        syncVariantDetails
    };

    return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
};

export const useVariantContext = () => {
    const context = useContext(VariantContext);
    if (!context) {
        throw new Error('useVariantContext must be used within a VariantProvider');
    }
    return context;
};
