import { Seller } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useEffect, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/Components/ui/tooltip";
import ShieldIcon from "@/assets/icons/ShieldIcon";
import PhoneIcon from "@/assets/icons/PhoneIcon";
import LocationIcon from "@/assets/icons/LocationIcon";
import ProductIcon from "@/assets/icons/ProductIcon";
import BankIcon from "@/assets/icons/BankIcon";
import PickupAddressVerificationModal from "@/Components/shared/PickupAddressVerificationModal";
import PhoneOtpVerificationModal from "@/Components/ui/Header/PhoneOtpVerificationModal";

interface IDashboardTopBannerV2Props {
    sellerDetails: Seller;
}

export default function DashboardTopBannerV2({ sellerDetails }: IDashboardTopBannerV2Props) {
    const navigate = useNavigate();
    const { seller } = useAuthContext();
    const [showPickupAddressModal, setShowPickupAddressModal] = useState(false);
    const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);

    const isPickupAddressRequired = () => {
        if (sellerDetails?.accountType) {
            if (sellerDetails?.accountType === 'individual') {
                return sellerDetails?.hasFilledAddress === false;
            } else {
                return sellerDetails?.hasFilledBusinessAddress === false;
            }
        } else {
            return true;
        }
    }

    useEffect(() => {
        if (isPickupAddressRequired()) {
            setShowPickupAddressModal(true);
        }
    }, [isPickupAddressRequired()]);

    // Do not render the banner if all conditions are met
    if (
        !sellerDetails?.emailVerified &&
        !isPickupAddressRequired() &&
        sellerDetails?.hasProducts !== false &&
        sellerDetails?.hasMoreThan10Blips !== false
    ) {
        return null;
    }

    return (
        <section className="mb-6 " >
            <>
                <div className=" w-full bg-[#EBECD5] rounded-[8px] p-[8px] flex items-center gap-[10px] ">
                    <div className=" h-[22px] w-[22px] lg:h-[24px] lg:w-[24px] p-[6px] flex items-center justify-center bg-[#0BB2481A] rounded-full ">
                        <ShieldIcon color="#14AE5C" width={12} height={12} />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ">
                        {
                            isPickupAddressRequired() && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 whitespace-nowrap ">
                                            <div className="flex items-center cursor-help gap-2 p-[8px] border border-[#272D30] h-[28px] rounded-[12px] ">
                                                <LocationIcon color="#272D30" width={12} height={12} />
                                                <p className="text-xs font-lexend font-semibold text-[#272D30]">
                                                    Add Pick Up Information
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setShowPickupAddressModal(true)}
                                                className="text-xs font-lexend font-semibold text-[#FFFFFF] bg-[#16783A] rounded-[8px] p-[8px] hover:bg-[#16783A]/80 transition-all duration-300 "
                                            >
                                                Add Now
                                            </button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                                        <div className="p-2">
                                            <p className="font-medium text-sm text-gray-900 mb-1">
                                                Pickup Address Required
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Add your pickup address to enable order fulfillment.
                                                This allows customers to place orders and helps us
                                                calculate accurate shipping costs for your products.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                        {
                            !seller?.isPhoneVerified && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 whitespace-nowrap ">
                                            <div className="flex items-center cursor-help gap-2 p-[8px] border border-[#272D30] h-[28px] rounded-[12px] ">
                                                <PhoneIcon color="#272D30" width={12} height={12} />
                                                <p className="text-xs font-lexend font-semibold text-[#272D30]">
                                                    Add Phone Number
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setShowPhoneOtpModal(true)}
                                                className="text-xs font-lexend font-semibold text-[#FFFFFF] bg-[#16783A] rounded-[8px] p-[8px] hover:bg-[#16783A]/80 transition-all duration-300 "
                                            >
                                                Add Now
                                            </button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                                        <div className="p-2">
                                            <p className="font-medium text-sm text-gray-900 mb-1">
                                                Phone Number Required
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Add your phone number to get real time updates on order status and other important notifications.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                        {
                            !seller?.hasProducts && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 whitespace-nowrap ">
                                            <div className="flex items-center cursor-help gap-2 p-[8px] border border-[#272D30] h-[28px] rounded-[12px] ">
                                                <ProductIcon color="#272D30" width={12} height={12} />
                                                <p className="text-xs font-lexend font-semibold text-[#272D30]">
                                                    Add Your First Product
                                                </p>
                                            </div>
                                            <button onClick={() => navigate("/dashboard/add-products")} className="text-xs font-lexend font-semibold text-[#FFFFFF] bg-[#16783A] rounded-[8px] p-[8px] hover:bg-[#16783A]/80 transition-all duration-300 ">Add Now</button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                                        <div className="p-2">
                                            <p className="font-medium text-sm text-gray-900 mb-1">
                                                Start Selling Today
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Add your first product to start your selling journey on Auqli. Upload product images, set prices, and reach thousands of potential customers instantly.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                        {
                            !seller?.bankDetails?.accountNumber && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 whitespace-nowrap ">
                                            <div className="flex items-center cursor-help gap-2 p-[8px] border border-[#272D30] h-[28px] rounded-[12px] ">
                                                <BankIcon color="#272D30" width={12} height={12} />
                                                <p className="text-xs font-lexend font-semibold text-[#272D30]">
                                                    Add Bank Details
                                                </p>
                                            </div>
                                            <button onClick={() => navigate("/dashboard/kyc-verification/bank")} className="text-xs font-lexend font-semibold text-[#FFFFFF] bg-[#16783A] rounded-[8px] p-[8px] hover:bg-[#16783A]/80 transition-all duration-300 ">Add Now</button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                                        <div className="p-2">
                                            <p className="font-medium text-sm text-gray-900 mb-1">
                                                Bank Details Required
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Add your bank details to start receiving payments from your sales. This includes your account number, bank name, and account name.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                        {
                            !seller?.hasMoreThan10Blips && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 whitespace-nowrap ">
                                            <div className="flex items-center cursor-help gap-2 p-[8px] border border-[#272D30] h-[28px] rounded-[12px] ">
                                                <BankIcon color="#272D30" width={12} height={12} />
                                                <p className="text-xs font-lexend font-semibold text-[#272D30]">
                                                    Create More Blips
                                                </p>
                                            </div>
                                            <button onClick={() => navigate("/dashboard/blips")} className="text-xs font-lexend font-semibold text-[#FFFFFF] bg-[#16783A] rounded-[8px] p-[8px] hover:bg-[#16783A]/80 transition-all duration-300 ">Add Now</button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                                        <div className="p-2">
                                            <p className="font-medium text-sm text-gray-900 mb-1">
                                                Create More Blips
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Create more blips to showcase your products and increase visibility. Blips help you connect with your audience, drive sales, and build your brand presence on Auqli.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                    </div>
                </div>
            </>
            <PickupAddressVerificationModal
                isOpen={showPickupAddressModal}
                onClose={() => setShowPickupAddressModal(false)}
                isPending={!isPickupAddressRequired()}
            />
            <PhoneOtpVerificationModal
                open={showPhoneOtpModal}
                onOpenChange={setShowPhoneOtpModal}
            />
        </section>
    )
}
