import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigation, useOutletContext } from "react-router-dom";
import Header from "../../Components/ui/Header/Header";
//import Loader from '../../Components/Loader';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../Components/ui/popover";
//import { productPageCardData } from "../../Utilities/data";
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { fetchSellerProducts, fetchSellerAuctionProducts } from "../../Redux/Slices/ProductSlice";
import ProductCard from "../../Components/ui/ProductPageUi/ProductCard";
import NotFound from "../../assets/not-found-icon2.png";
import LinearProgress from "@mui/material/LinearProgress";

import React from 'react';


const ProductsPage = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { products, auctionProducts, isLoading, isLoadingAuctions, deleteStatus } = useSelector((state) => state.product);
    const [isStockUpdated, setIsStockUpdated] = useState(false);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'auctions'

    useEffect(() => {
        setHeaderName('Products')
        setNavName('')
    }, [])

    useEffect(() => {
        if (activeTab === 'products') {
            dispatch(fetchSellerProducts());
        } else {
            dispatch(fetchSellerAuctionProducts());
        }
    }, [dispatch, isStockUpdated, activeTab]);

    // Memoize the products list based on active tab
    const displayedProducts = activeTab === 'products' ? products : auctionProducts;
    const isCurrentlyLoading = activeTab === 'products' ? isLoading : isLoadingAuctions;

    // Memoize the products list
    const memoizedProducts = React.useMemo(() => {
        return displayedProducts.map((item) => (
            <ProductCard key={item._id} item={item} setIsStockUpdated={setIsStockUpdated} isAuction={activeTab === 'auctions'} />
        ));
    }, [displayedProducts]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);



    return (
        <>
            {/*isLoading && <Loader />*/}
            {
                isCurrentlyLoading ? (
                    <div className="flex flex-col justify-center items-center h-[80dvh]">
                        <div className="w-1/4">
                            <LinearProgress color="success" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-6 w-full">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                        activeTab === 'products'
                                            ? 'bg-[#17171B] text-white'
                                            : 'bg-[#0BB24817] text-[#17171B] hover:bg-[#0BB24820]'
                                    }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => setActiveTab('auctions')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                        activeTab === 'auctions'
                                            ? 'bg-[#17171B] text-white'
                                            : 'bg-[#0BB24817] text-[#17171B] hover:bg-[#0BB24820]'
                                    }`}
                                >
                                    Offline Auctions
                                </button>
                            </div>
                            
                            <div className="flex items-center flex-wrap gap-4">
                                {displayedProducts.length > 0 && (
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-base font-cabin font-normal text-[#17171B]">Sort By:</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                            <div className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#17171B] bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
                                                <Icon icon="solar:calendar-outline" width="20" height="20" color="#17171B" />
                                                <p className="text-sm font-cabin font-normal text-[#17171B]">Newest</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#17171B] bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
                                                <Icon icon="iconamoon:clock-thin" width="20" height="20" color="#17171B" />
                                                <p className="text-sm font-cabin font-normal text-[#17171B]">Active</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#17171B] bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
                                                <Icon icon="solar:calendar-outline" width="20" height="20" color="#17171B" />
                                                <p className="text-sm font-cabin font-normal text-[#17171B]">Lowest-Highest</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <NavLink to="/dashboard/add-products" className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#FFFFFF] bg-[#17171B] rounded-[7.8px] py-3 px-4 hover:bg-[#17171B]/90 transition-all duration-500 ease-in-out">
                                    <Icon icon="tabler:plus" width="20" height="20" color="#FFFFFF" />
                                    <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Add Product</p>
                                </NavLink>
                            </div>
                        </div>
                        <div className="flex flex-col w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                            {/* Table Headers - Desktop */}
                            <div className="hidden lg:grid grid-cols-[80px_1fr_1fr_1fr_1fr_100px_100px] gap-4 px-6 py-4 border-b border-[#E5E7EB] bg-white">
                                <div className="text-sm font-medium text-[#05031F]">Image</div>
                                <div className="text-sm font-medium text-[#05031F]">Product Name</div>
                                <div className="text-sm font-medium text-[#05031F]">Category</div>
                                <div className="text-sm font-medium text-[#05031F]">
                                    {activeTab === 'auctions' ? 'Auction Status' : 'Upload Status'}
                                </div>
                                <div className="text-sm font-medium text-[#05031F]">
                                    {activeTab === 'auctions' ? 'Current Bid' : 'Price'}
                                </div>
                                <div className="text-sm font-medium text-[#05031F] text-center">
                                    {activeTab === 'auctions' ? 'Time Left' : 'Stock Status'}
                                </div>
                                <div className="text-sm font-medium text-[#05031F] text-center">Actions</div>
                            </div>

                            {/* Products List */}
                            <div className="divide-y divide-[#E5E7EB]">
                                {displayedProducts.length > 0 ? (
                                    memoizedProducts
                                ) : (
                                    <div className="flex flex-col h-[50dvh] items-center justify-center gap-4">
                                        <img src={NotFound} alt="not-found" className="w-[180px] md:w-[220px] h-[180px] md:h-[220px]" />
                                        <p className="text-base font-cabin font-normal text-[#05031F]">
                                            No {activeTab === 'auctions' ? 'auction' : ''} products found
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {
                            displayedProducts.length > 20 && (
                                <div className="flex items-center justify-center flex-wrap gap-4 mt-4  lg:mt-8 w-full">
                                    <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                        <Icon icon="gg:arrow-long-left" width="20" height="20" color="#FFFFFF" />
                                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Previous</p>
                                    </button>
                                    <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Next</p>
                                        <Icon icon="gg:arrow-long-right" width="20" height="20" color="#FFFFFF" />
                                    </button>
                                    <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4  whitespace-nowrap hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">20 per page</p>
                                        <Icon icon="simple-line-icons:arrow-down" width="10" height="10" color="#FFFFFF" />
                                    </button>
                                </div>
                            )
                        }
                    </>
                )
            }
        </>
    )
}

export default ProductsPage
