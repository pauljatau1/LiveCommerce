import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/Components/ui/tooltip";

//import EmailVerificationModal from "@/Components/EmailVerificationModal";
import PickupAddressVerificationModal from "@/Components/PickupAddressVerificationModal";
import PropTypes from "prop-types";
import { useAuthContext } from "@/Hooks/useAuthContext";

export default function DashboardTopBanner({ sellerDetails }) {
  //const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPickupAddressModal, setShowPickupAddressModal] = useState(false);

  const isPickupAddressRequired =
    sellerDetails?.accountType === "individual"
      ? sellerDetails?.hasFilledAddress === false
      : sellerDetails?.hasFilledBusinessAddress === false;

  const [searchParams] = useSearchParams();
  const { fetchSellerDetails } = useAuthContext();

  useEffect(() => {
    if (isPickupAddressRequired) {
      setShowPickupAddressModal(true);
    }
  }, [isPickupAddressRequired]);


  const navigate = useNavigate();

  // Listen for verification completed event
  useEffect(() => {
    const handleVerificationCompleted = () => {
      console.log(
        "Verification completed event received, refreshing seller data..."
      );
      fetchSellerDetails();
    };

    window.addEventListener(
      "seller-verification-completed",
      handleVerificationCompleted
    );

    return () => {
      window.removeEventListener(
        "seller-verification-completed",
        handleVerificationCompleted
      );
    };
  }, []);

  // Do not render the banner if all conditions are met
  if (
    sellerDetails?.emailVerified &&
    !isPickupAddressRequired &&
    sellerDetails?.hasProducts !== false &&
    sellerDetails?.hasMoreThan10Blips !== false
  ) {
    return null;
  }

  return (
    <>
      <div className="hidden lg:flex mb-6">
        <div className="w-full bg-[#ECECD5] rounded-xl p-[8px] ">
          <div className="flex items-center overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon
                    icon="solar:shield-warning-bold"
                    className="h-5 w-5 text-green-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Email Verification */}
              {/*This feature has been paused till further notice
              {sellerDetails?.emailVerified === false && (
                <Tooltip>
                  
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-help gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                        <Icon
                          icon="material-symbols-light:mail-sharp"
                          className="h-4 w-4 text-green-500"
                        />
                        <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D] ">
                          E-mail not verified
                        </span>
                      </div>
                      <button
                        onClick={() => setShowEmailVerificationModal(true)}
                        className="px-4 py-1.5 bg-green-600 whitespace-nowrap text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                    <div className="p-2">
                      <p className="font-medium text-sm text-gray-900 mb-1">
                        Email Verification Required
                      </p>
                      <p className="text-xs text-gray-600">
                        Verify your email to secure your account, receive order
                        notifications, and enable password recovery. This helps
                        protect your business and ensures you never miss
                        important updates.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )*/}

              {/* KYC Verification 
                    {sellerDetails?.isVerified === false && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                          <Icon icon="solar:shield-check-bold" className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">You have pending KYC support</span>
                        </div>
                        <button
                          className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Complete Now
                        </button>
                      </div>
                    )} */}

              {/* Address Verification */}
              {isPickupAddressRequired && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-help gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                        <Icon
                          icon="solar:map-point-bold"
                          className="h-4 w-4 text-green-500"
                        />
                        <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">
                          Pickup address required
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPickupAddressModal(true)}
                        className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Address
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
              )}

              {/* Products Required */}
              {sellerDetails?.hasProducts === false && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-help gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                        <Icon
                          icon="solar:bag-bold"
                          className="h-4 w-4 text-green-500"
                        />
                        <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">
                          Add your first product
                        </span>
                      </div>
                      <button
                        onClick={() => navigate("/dashboard/products")}
                        className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Product
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                    <div className="p-2">
                      <p className="font-medium text-sm text-gray-900 mb-1">
                        Start Selling Today
                      </p>
                      <p className="text-xs text-gray-600">
                        Add your first product to start your selling journey on
                        Auqli. Upload product images, set prices, and reach
                        thousands of potential customers instantly.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Blips Required */}
              {sellerDetails?.hasMoreThan10Blips === false && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 cursor-help py-1.5 bg-white rounded-lg border border-gray-200">
                        <Icon
                          icon="solar:video-frame-bold"
                          className="h-4 w-4 text-green-500"
                        />
                        <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">
                          Create more blips
                        </span>
                      </div>
                      <button
                        onClick={() => navigate("/dashboard/products")}
                        className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Create Blips
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                    <div className="p-2">
                      <p className="font-medium text-sm text-gray-900 mb-1">
                        Boost Your Visibility
                      </p>
                      <p className="text-xs text-gray-600">
                        Create engaging blips to showcase your products and
                        increase visibility. Blips help you connect with your
                        audience, drive sales, and build your brand presence on
                        Auqli.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal; This feature has been paused till further notice
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        userEmail={sellerDetails?.email || ""}
      />
      */}

      {/* Pickup Address Verification Modal */}
      <PickupAddressVerificationModal
        isOpen={showPickupAddressModal}
        onClose={() => setShowPickupAddressModal(false)}
      />
    </>
  );
}

DashboardTopBanner.propTypes = {
  sellerDetails: PropTypes.object,
};
