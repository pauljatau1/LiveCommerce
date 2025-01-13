import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export const VariantContext = createContext();

export const VariantProvider = ({ children }) => {
    const [variants, setVariants] = useState([]);
    const [variantDetails, setVariantDetails] = useState({});
    const [draftValues, setDraftValues] = useState({});
    const draftRef = useRef({});
    const [inputValues, setInputValues] = useState({});

    const batchUpdate = useCallback((updates) => {
        setVariantDetails(prev => ({
            ...prev,
            ...updates
        }));
    }, []);

    const updateDraft = useCallback((variantPath, field, value) => {
        draftRef.current[variantPath] = {
            ...draftRef.current[variantPath],
            [field]: value
        };
    }, []);

    const commitDraft = useCallback((variantPath) => {
        if (draftRef.current[variantPath]) {
            batchUpdate({
                [variantPath]: {
                    ...variantDetails[variantPath],
                    ...draftRef.current[variantPath]
                }
            });
            delete draftRef.current[variantPath];
        }
    }, [variantDetails, batchUpdate]);

    const updateVariantDetails = useCallback((variantPath, details) => {
        batchUpdate({
            [variantPath]: {
                ...variantDetails[variantPath],
                ...details
            }
        });
    }, [variantDetails, batchUpdate]);

    const addColorVariant = useCallback((colorVariant) => {
        setVariants(prev => {
            const exists = prev.some(v => v.value === colorVariant.value);
            if (!exists) {
                return [...prev, {
                    name: colorVariant.name,
                    value: colorVariant.value,
                    subVariants: []
                }];
            }
            return prev;
        });
    }, []);

    const addSizeVariant = useCallback((colorValue, sizeVariant) => {
        setVariants(prev => prev.map(colorVar => {
            if (colorVar.value === colorValue) {
                return {
                    ...colorVar,
                    subVariants: [
                        ...colorVar.subVariants,
                        {
                            name: sizeVariant.name,
                            value: sizeVariant.value,
                            subSubVariants: []
                        }
                    ]
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
                            return {
                                ...sizeVar,
                                subSubVariants: [
                                    ...sizeVar.subSubVariants,
                                    {
                                        name: materialVariant.name,
                                        value: materialVariant.value
                                    }
                                ]
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

    const getTotalStock = useCallback((variantValue) => {
        const relevantKeys = Object.keys(variantDetails).filter(key => 
            key.startsWith(`${variantValue}_`) && key.split('_').length === 3
        );

        return relevantKeys.reduce((total, key) => {
            return total + (Number(variantDetails[key]?.stock) || 0);
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

    const value = {
        variants,
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
        getDraftValue: (variantPath, field) => 
            draftRef.current[variantPath]?.[field] ?? variantDetails[variantPath]?.[field],
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
