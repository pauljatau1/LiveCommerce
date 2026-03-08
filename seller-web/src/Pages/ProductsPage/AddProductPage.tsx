import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DesktopAddProduct from '../AddProductsPage/DesktopAddProduct';
import MobileAddProduct from '../AddProductsPage/MobileAddProduct';

export default function AddProductPage() {
    // Type assertion for outlet context
    const { setHeaderName, setNavName } = useOutletContext<{ 
        setHeaderName: (name: string) => void; 
        setNavName: (name: string) => void; 
    }>();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setHeaderName('Products');
        setNavName('Add Product');
    }, [setHeaderName, setNavName]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Standard mobile breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="w-full h-full">
            {isMobile ? <MobileAddProduct /> : <DesktopAddProduct />}
        </div>
    );
}
