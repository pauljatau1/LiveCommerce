import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SideBarNav from "../../Components/ui/DashboardHomepageUi/SideBarNav";


const ProductsPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState(true);

    return (
        <div className="flex h-screen w-dvh ">
            {/* Sidebar */}
            <SideBarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            {/* Main Content */}
            <div className="pl-[20px] pr-[20px] md:pl-[42px] md:pr-[28px] pb-14 h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <h1>Products</h1>
            </div>
        </div>
    )
}

export default ProductsPage
