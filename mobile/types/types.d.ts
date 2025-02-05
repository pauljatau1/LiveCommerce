import { TextInputProps, TouchableOpacityProps } from "react-native";


declare interface ButtonProps extends TouchableOpacityProps {
    title?: string;
    bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
    textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
    IconLeft?: React.ComponentType<any>;
    IconRight?: React.ComponentType<any>;
    className?: string;
    textStyle?: string;
    disabled?:boolean,
    loading?:boolean,
}

type SelectedCategory = {
    name: string;
    subCategories: {
        name: string;
    }[];
};

export type SelectedCategoriesRequest = {
    selectedCategories: SelectedCategory[];
};

export type Category = {
    id: string;
    title: string;
    image: string;
};

export type SubCategory = {
    id: string;
    title: string;
};



export type ProductCardProps = {
  id:string,
  imageUrl: ImageSourcePropType;
  title: string;
  price: string;
  profileImage: ImageSourcePropType;
  category: string;
  location: string;
  sellerName: string;
  sellerRating: number;
  isTopSeller: boolean;
  isOnline: boolean;
  isLive: boolean;
  isVerified: boolean;
    showNike: boolean;
  onAddToCart: () => void;
};
