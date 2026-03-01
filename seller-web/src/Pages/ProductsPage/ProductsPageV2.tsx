import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { useOutletContext, useNavigate } from "react-router-dom";
import { OutletContextType } from "@/types";
import { useState, useEffect } from 'react'
import { useIntercomVisibility } from '../../Hooks/useIntercomVisibility';
import { useDevice } from '@/Contexts/DeviceContext';
import PlusIcon from '@/assets/icons/PlusIcon';
import ProductAnalyticsSection from "@/Components/ui/ProductPageUi/ProductAnalyticsSection";
import DesktopProductTableSection from "@/Components/ui/ProductPageUi/DesktopProductTableSection";
import MobileProductTableSection from "@/Components/ui/ProductPageUi/MobileProductTableSection";
import DesktopProductBlipsTableSection from "@/Components/ui/ProductPageUi/DesktopProductBlipsTableSection";
import MobileProductBlipsTableSection from "@/Components/ui/ProductPageUi/MobileProductBlipsTableSection";
import CreateBlipModal from "@/Components/ui/ProductPageUi/CreateBlipModal";

export default function ProductsPageV2() {
  const { setHeaderName, setNavName } = useOutletContext<OutletContextType>()
  const navigate = useNavigate();
  const { isDesktop } = useDevice();
  const [activeTab, setActiveTab] = useState('products');
  const [isCreateBlipModalOpen, setIsCreateBlipModalOpen] = useState(false);

  useIntercomVisibility(true);

  useEffect(() => {
    setHeaderName('Products');
    setNavName('');
  }, [setHeaderName, setNavName]);

  const handleAddProductClick = () => {
    if (activeTab === "products") {
      navigate("/dashboard/add-products");
      return;
    }
    setIsCreateBlipModalOpen(true);
  };

  return (
    <div className="py-[18px] lg:py-[30px] space-y-[18px] lg:space-y-[30px] ">
      {/** product tab navigation section */}
      <div className="flex items-center gap-4 justify-between w-full ">
        <button onClick={() => setActiveTab('products')} className={`w-full h-[36px] rounded-[8px] flex items-center justify-center text-xs lg:text-sm font-lexend font-semibold outline-none focus:outline-none transition-all duration-300 ${activeTab === 'products' ? 'bg-[#0BB24840] text-[#0BB248] border-none hover:bg-green-500/40  ' : 'bg-transparent text-[#737375] hover:bg-gray-100'} border border-solid border-gray200 `} >
          Products
        </button>
        <button onClick={() => setActiveTab('product-blips')} className={`w-full h-[36px] rounded-[8px] flex items-center justify-center text-xs lg:text-sm font-lexend font-semibold outline-none focus:outline-none transition-all duration-300 ${activeTab === 'product-blips' ? 'bg-[#0BB24840] text-[#0BB248] border-none hover:bg-green-500/40  ' : 'bg-transparent text-[#737375] hover:bg-gray-100'} border border-solid border-gray-300 `} >
          Product Blips
        </button>
        <button 
          onClick={handleAddProductClick}
          className="w-full h-[36px] flex items-center justify-center px-2 lg:px-0 whitespace-nowrap gap-2 bg-[#0BB248] text-[#FFFFFF] rounded-[8px] text-xs lg:text-sm font-lexend font-semibold outline-none focus:outline-none hover:bg-[#0BB248]/70 transition-all duration-300"
        >
          <PlusIcon width={13} height={13} color="#fff" />
          {activeTab === "products" ? "Add Products" : "Create Blips"}
        </button>
      </div>

      {/** product analytics section */}
      <ProductAnalyticsSection />

      {/** product table section */}
      {activeTab === 'products' ? (
        isDesktop ? (
          <DesktopProductTableSection />
        ) : (
          <MobileProductTableSection />
        )
      ) : (
        isDesktop ? (
          <DesktopProductBlipsTableSection />
        ) : (
          <MobileProductBlipsTableSection />
        )
      )}

      <CreateBlipModal open={isCreateBlipModalOpen} onOpenChange={setIsCreateBlipModalOpen} />
    </div>
  )
}
