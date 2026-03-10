import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import DesktopAddProduct from '../AddProductsPage/DesktopAddProduct';
import MobileAddProduct from '../AddProductsPage/MobileAddProduct';
import { useDevice } from '@/Contexts/DeviceContext';

export default function AddProductPage() {
    // Type assertion for outlet context
    const { setHeaderName, setNavName } = useOutletContext<{ 
        setHeaderName: (name: string) => void; 
        setNavName: (name: string) => void; 
    }>();

    const { isMobile } = useDevice();

    useEffect(() => {
        setHeaderName('Products');
        setNavName('Add Product');
    }, [setHeaderName, setNavName]);

    return (
        <div className="w-full h-full">
            {isMobile ? <MobileAddProduct /> : <DesktopAddProduct />}
        </div>
    );
}
