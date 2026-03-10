import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext, useParams } from 'react-router-dom';
import DesktopAddProduct from '../AddProductsPage/DesktopAddProduct';
import MobileAddProduct from '../AddProductsPage/MobileAddProduct';
import { getProductDetailsById } from '../../Redux/Slices/ProductSlice';
import { Icon } from '@iconify/react';
import { useDevice } from '@/Contexts/DeviceContext';

export default function EditProductPage() {
    const { setHeaderName, setNavName } = useOutletContext<{
        setHeaderName: (name: string) => void;
        setNavName: (name: string) => void;
    }>();

    const dispatch = useDispatch();
    const { id } = useParams();
    const { product, isLoading, isProductDetailsFetched } = useSelector((state: any) => state.product);

    const { isMobile } = useDevice();

    useEffect(() => {
        setHeaderName('Products');
        setNavName('Edit Product');
    }, [setHeaderName, setNavName]);

    useEffect(() => {
        if (!id) return;
        dispatch((getProductDetailsById as any)(id));
    }, [dispatch, id]);

    if (!id) return null;

    const resolvedProductId = product?._id || product?.id;
    const isFetchingProduct = Boolean(isLoading && !isProductDetailsFetched && resolvedProductId !== id);

    if (isFetchingProduct) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <Icon icon="eos-icons:loading" className="w-8 h-8 text-[#0BB248]" />
                    <p className="text-sm text-gray-600">Loading product…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {isMobile ? (
                <MobileAddProduct mode="edit" productId={id} initialProduct={product} />
            ) : (
                <DesktopAddProduct mode="edit" productId={id} initialProduct={product} />
            )}
        </div>
    );
}
