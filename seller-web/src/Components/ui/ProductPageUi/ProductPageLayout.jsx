import { Outlet } from 'react-router-dom';
import ScrollToTop from '../../../Utilities/ScrollToTop';


const ProductPageLayout = () => {
    return (
        <>
            <ScrollToTop />
            <main>
                <Outlet />
            </main>
        </>
    );
}

export default ProductPageLayout
