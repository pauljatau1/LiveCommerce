export interface VariantOption {
    id: string;
    name: string;
    values: string[];
}

export interface VariantImage {
    url: string;
    file?: File;
    contentType?: string;
    isDefault?: boolean;
}

export interface SubSubVariant {
    name: string;
    value: string;
    price: string | number;
    stock: number | string;
    sku?: string;
    images: VariantImage[];
}

export interface SubVariant {
    name: string;
    value: string;
    price?: string | number;
    stock?: number | string;
    images?: VariantImage[];
    subSubVariants?: SubSubVariant[];
}

export interface MainVariant {
    name: string;
    value: string;
    price?: string | number;
    totalStock?: number | string;
    images: VariantImage[];
    subVariants?: SubVariant[];
}

export interface VariantContextType {
    options: VariantOption[];
    setOptions: React.Dispatch<React.SetStateAction<VariantOption[]>>;
    variantStructure: MainVariant[];
    setVariantStructure: React.Dispatch<React.SetStateAction<MainVariant[]>>;
    addOption: (newOption: VariantOption) => void;
    updateOption: (updatedOption: VariantOption) => void;
    deleteOption: (optionId: string) => void;
    updateVariantValue: (variantPath: string, field: string, value: string | number | VariantImage[]) => void;
    calculateMinimumStock: (mainVariant: MainVariant) => number;
}
