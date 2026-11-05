import { useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
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
    // A draft from the Listing Agent ("Edit all details") prefills the form
    const draft = (useLocation().state as any)?.listingDraft;

    useEffect(() => {
        setHeaderName('Products');
        setNavName('Add Product');
    }, [setHeaderName, setNavName]);

    return (
        <div className="w-full h-full">
            {isMobile ? <MobileAddProduct initialProduct={draft} /> : <DesktopAddProduct initialProduct={draft} />}
        </div>
    );
}
