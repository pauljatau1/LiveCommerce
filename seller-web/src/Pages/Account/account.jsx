import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Mail, MapPin, Calendar, Phone, ShoppingBag, Users, Heart, Zap, Tv, MessageSquare, CheckCircle2, Radio, Camera, Edit, ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import { UserSquareIcon } from "lucide-react";
import LinearProgress from "@mui/material/LinearProgress";
import { BASE_URL, BASE_URL_V2, AUQLI_STORE_BASE_URL } from "@/Constants/Server";
import { format } from "date-fns";
import ShopTab from "./components/ShopTab";
import BlipsTab from "./components/BlipsTab";
import ShowsTab from "./components/ShowsTab";
import ReviewsTab from "./components/ReviewsTab";
import { useOutletContext, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/Components/ui/dialog";
//import EmailVerificationModal from "../../Components/EmailVerificationModal";
import PickupAddressVerificationModal from "../../Components/PickupAddressVerificationModal";
import { Icon } from "@iconify/react";
import { trackEvent } from "@/util/analytics";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";
import { useAuthContext } from "@/Hooks/useAuthContextV2";

export default function AccountPage() {
  const { seller } = useAuthContext();
  const { setHeaderName, setNavName } = useOutletContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [followersPagination, setFollowersPagination] = useState({
    current: 1,
    total: 1,
    hasMore: false
  });
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  //const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPickupAddressModal, setShowPickupAddressModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);

  const fetchProfile = () => {
    setProfile(seller);

      // Fetch review stats
      if (seller?._id) {
        fetchReviewStats(seller._id);
      }
  };

  const isPickupAddressRequired = profile?.accountType === 'individual' ? profile?.hasFilledAddress === false : profile?.hasFilledBusinessAddress === false;

  useEffect(() => {
    setHeaderName("Account");
    setNavName("");
    // Check if the URL has parameters
    const queryParams = new URLSearchParams(window.location.search);
    
    // Check for verification parameter
    {/*This feature has been paused till further notice
    if (queryParams.get('openVerification') === 'true') {
      if (profile?.emailVerified === false) {
        setShowEmailVerificationModal(true);
      } else if (isPickupAddressRequired) {
        setShowPickupAddressModal(true);
      }
    }*/}
    
    // Check for followers parameter
    if (queryParams.get('openFollowers') === 'true') {
      // Open followers dialog and fetch followers
      setFollowersDialogOpen(true);
      fetchFollowers();
      // Remove the query parameter from the URL without refreshing
      navigate('/dashboard/account', { replace: true });
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchReviewStats = async (sellerId) => {
    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) return;

      const response = await fetch(`${BASE_URL}/seller/${sellerId}/product-reviews?page=1&limit=1`, {
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      
      if (data.stats) {
        setReviewStats({
          averageRating: data.stats.averageRating || 0,
          totalReviews: data.stats.totalReviews || 0
        });
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const fetchFollowers = async (page = 1) => {
    setFollowersLoading(true);
    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) return;

      const response = await fetch(`${BASE_URL}/seller/followers?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }

      const data = await response.json();
      
      if (page === 1) {
        setFollowers(data.followers || []);
      } else {
        setFollowers(prev => [...prev, ...(data.followers || [])]);
      }
      
      setFollowersPagination({
        current: Number(data.pagination?.current) || 1,
        total: data.pagination?.pages || 1,
        hasMore: data.pagination?.hasMore || false
      });
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast.error("Failed to load followers");
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setFollowingLoading(true);
    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) return;

      const response = await fetch(`${BASE_URL}/seller/following/buyers`, {
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }

      const data = await response.json();
      setFollowing(data || []);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast.error("Failed to load following");
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleFollowersClick = () => {
    setFollowersDialogOpen(true);
    fetchFollowers();
  };

  const handleFollowingClick = () => {
    setFollowingDialogOpen(true);
    fetchFollowing();
  };

  const loadMoreFollowers = () => {
    if (followersPagination.hasMore && !followersLoading) {
      fetchFollowers(followersPagination.current + 1);
    }
  };

  const handleAvatarUpload = async (event) => {
    // Get the selected file; if none, do nothing
    const file = event.target.files[0];
    if (!file) return;

    // Preserve the current avatar to allow reverting on failure
    const previousAvatar = profile?.storeAvatar ? { ...profile?.storeAvatar } : null;

    // Create a temporary local preview URL for instant UI feedback
    const localPreviewUrl = URL.createObjectURL(file);

    // Optimistically show the new image immediately in the UI by updating profile state
    // We only set the url field so existing consumers continue to work unchanged
    setProfile((prev) => ({
      ...prev,
      storeAvatar: {
        ...(prev?.storeAvatar || {}),
        url: localPreviewUrl,
      },
    }));

    // Show loading toast for background upload
    const loadingToast = toast.loading('Uploading profile picture...');

    // Prepare form payload
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      // Execute upload request
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      const response = await fetch(`${BASE_URL_V2}/sellers/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData?.data}`,
        },
        body: formData,
      });

      // Handle non-2xx responses as failures
      if (!response.ok) throw new Error('Failed to upload avatar');

      toast.dismiss(loadingToast);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      // On failure, revert profile avatar back to the previous value
      setProfile((prev) => ({
        ...prev,
        storeAvatar: previousAvatar || null,
      }));

      // Clean up the temporary object URL since it's no longer needed
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

      toast.dismiss(loadingToast);
      toast.error('Failed to update profile picture');
      console.error('Error uploading avatar:', error);
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const previousBanner = profile?.storeBanner ? { ...profile?.storeBanner } : null;

    // Create a temporary local preview URL for instant UI feedback
    const localPreviewUrl = URL.createObjectURL(file);

    // Optimistically show the new image immediately in the UI by updating profile state
    // We only set the url field so existing consumers continue to work unchanged
    setProfile((prev) => ({
      ...prev,
      storeBanner: {
        ...(prev?.storeBanner || {}),
        url: localPreviewUrl,
      },
    }));

    // Show loading toast
    const loadingToast = toast.loading('Uploading cover image...');

    const formData = new FormData();
    formData.append('banner', file);

    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      const response = await fetch(`${BASE_URL_V2}/sellers/profile/banner`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload banner');

      toast.dismiss(loadingToast);
      toast.success('Cover image updated successfully!');
    } catch (error) {
      // On failure, revert profile banner back to the previous value
      setProfile((prev) => ({
        ...prev,
        storeBanner: previousBanner || null,
      }));

      // Clean up the temporary object URL since it's no longer needed
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

      toast.dismiss(loadingToast);
      toast.error('Failed to update cover image');
      console.error('Error uploading banner:', error);
    }
  };

  /**
   * Handles the deletion of the seller's profile avatar
   * Makes a DELETE request to the profile avatar endpoint and updates the UI accordingly
   */
  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    
    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BASE_URL_V2}/sellers/profile/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile avatar');
      }

      // Update the profile state to remove the avatar
      setProfile((prev) => ({
        ...prev,
        storeAvatar: null,
      }));

      // Close the modal
      setShowAvatarModal(false);
      
      toast.success('Profile picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete profile picture');
    } finally {
      setIsDeletingAvatar(false);
    }
  };





  const handleCopyProfileLink = () => {
    if (profile?._id) {
      const profileUrl = `${AUQLI_STORE_BASE_URL}/seller/${profile?._id}`;
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          toast.success("Profile link copied to clipboard");
          trackEvent("Seller Copied Profile Link", {
            "seller id": profile?._id,
            "seller store name": profile?.storeName,
          });
        })
        .catch((error) => {
          console.error("Failed to copy link:", error);
          toast.error("Failed to copy link to clipboard");
        });
    }
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Verification Modal */}

      {/*This feature has been paused till further notice
      <EmailVerificationModal 
        isOpen={showEmailVerificationModal} 
        onClose={() => {
          setShowEmailVerificationModal(false);
          {/* trackEvent("Seller Skipped Onboarding Verification", {
            "seller id": profile?._id,
            "seller email": profile?.email,
            "seller store name": profile?.storeName,
            "seller first name": profile?.firstName,
            "seller last name": profile?.lastName,
            "seller phone number": profile?.phoneNumber,
            "Signup Date": profile?.createdAt,
            "Verification Status": profile?.isVerified ? "Verified" : "Not Verified",
          }); 
        }}
        userEmail={profile?.businessEmail || profile?.email || ''}
      />*/}
      
      {/* Pickup Address Verification Modal */}
      {profile && (
          <PickupAddressVerificationModal
          isOpen={showPickupAddressModal}
          onClose={() => {
            setShowPickupAddressModal(false);
            {/* trackEvent("Seller Skipped Onboarding Verification", {
              "seller id": profile?._id,
              "seller email": profile?.email,
              "seller store name": profile?.storeName,
              "seller first name": profile?.firstName,
              "seller last name": profile?.lastName,  
              "seller phone number": profile?.phoneNumber,
              "Signup Date": profile?.createdAt,
              "Verification Status": profile?.isVerified ? "Verified" : "Not Verified",
            }); */}

          }}
        />
      )}
      
      {/* Verification Banners - Show based on account status */}
      {profile && (
        <>
          { isPickupAddressRequired && (
            // Address verification banner
            <div className="bg-orange-50 mt-6 sm:mt-10 border-l-4 border-orange-500 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
              <div className="flex items-start flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:map-point-bold" className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-orange-800">Pickup address required</h3>
                </div>
                <div className="flex-1 text-orange-700 text-xs sm:text-sm lg:ml-2">
                  Add your pickup address to start listing products and complete your seller profile setup.
                </div>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 font-medium py-1 sm:py-2 px-4 sm:px-5 text-white rounded-md shadow whitespace-nowrap text-xs sm:text-sm"
                  onClick={() => setShowPickupAddressModal(true)}
                >
                  Add Address
                </Button>
              </div>
            </div>
          ) 
          /* : !profile?.isVerified && (
            <>
              {profile?.accountPending ? (
                // Account under review banner
                <div className="bg-blue-50 mt-6 sm:mt-10 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
                  <div className="flex items-start flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:clock-circle-bold" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold text-blue-800">Your account is under review</h3>
                    </div>
                    <div className="flex-1 text-blue-700 text-xs sm:text-sm lg:ml-2">
                      Your verification information has been submitted and is currently being reviewed. You&apos;ll be notified when your account is either approved or declined.
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 font-medium py-1 sm:py-2 px-4 sm:px-5 text-white rounded-md shadow whitespace-nowrap text-xs sm:text-sm"
                      onClick={handleShowVerificationDialog}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ) : (
                // Account needs verification banner
                <div className="bg-amber-50 mt-6 sm:mt-10 border-l-4 border-amber-500 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
                  <div className="flex items-start flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold text-amber-800">Your account is not verified</h3>
                    </div>
                    <div className="flex-1 text-amber-700 text-xs sm:text-sm lg:ml-2">
                      Complete your KYC verification to unlock all seller features including seemless withdrawals.
                    </div>
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700 font-medium py-1 sm:py-2 px-4 sm:px-5 text-white rounded-md shadow whitespace-nowrap text-xs sm:text-sm"
                      onClick={() => {
                        // TODO: Navigate to verification page
                        console.log('Navigate to verification page');
                      }}
                    >
                      Complete Verification
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) */}
        </>
      )}

      

      {/* Cover Image Section */}
      <div className="relative h-24 sm:h-36 w-full overflow-hidden mt-2 sm:mt-4 rounded-lg">
        <input
          type="file"
          id="banner-upload"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
        <label htmlFor="banner-upload" className="absolute bg-gray-500 inset-0 z-10 cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          <img
            src={profile?.storeBanner?.url || "https://a.storyblok.com/f/191576/768x432/ba499c40d2/nice-backgrounds-cover.webp"}
            alt="Cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute right-3 top-3 p-1.5 sm:right-4 sm:top-4 sm:p-2 bg-black/50 rounded-full opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Camera className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
          </div>
        </label>
      </div>

      {/* Profile Content */}
      <div className="mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative -mt-10 sm:-mt-16 mb-4 sm:mb-8">
          <div className="relative mb-4 sm:mb-8 w-fit z-20">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div 
              className="cursor-pointer block relative group"
              onClick={() => setShowAvatarModal(true)}
            >
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 border-4 border-background rounded-full ring-2 sm:ring-4 ring-green-600/20">
                <AvatarImage src={profile?.storeAvatar?.url || "/placeholder.svg"} />
                <AvatarFallback className="font-bold text-gray-500 text-lg sm:text-xl md:text-2xl">
                  {`${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`}
                </AvatarFallback>
              </Avatar>
              <div className="absolute right-0 bottom-0 p-1 sm:p-1.5 md:p-2 bg-black/50 rounded-full opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Pencil className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-4 md:w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Rest of the content */}
          <div className="space-y-3 sm:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2 lg:gap-0">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{profile?.storeName || `${profile?.firstName} ${profile?.lastName}`}</h1>
                  {profile?.isVerified && (
                    <Badge
                      variant="secondary"
                      className="font-medium bg-green-600/10 text-green-600 px-1.5 sm:px-3 py-0.5 sm:py-1 flex items-center gap-1 rounded-full text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Contact info */}
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto hover:bg-transparent hover:text-green-600 truncate max-w-full"
                    title={profile?.businessEmail || profile?.email}
                  >
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">
                      {profile?.businessEmail || profile?.email}
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent hover:text-green-600">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
                    {profile?.businessAddress ?
                      `${profile?.businessAddress?.city}, ${profile?.businessAddress?.country}` :
                      profile?.warehouseAddress ?
                      `${profile?.warehouseAddress?.city}, ${profile?.warehouseAddress?.country}` :
                      profile?.sellerAddress ?
                      `${profile?.sellerAddress?.city}, ${profile?.sellerAddress?.country}` :
                      'Address not available'
                    }
                  </Button>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="flex items-center sm:border-l sm:pl-4">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0 text-green-600" />
                      Joined 
                    </span>
                    <span className="flex items-center sm:border-l sm:pl-4">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0 text-green-600" />
                      {profile?.businessNumber || profile?.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0 self-start">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                       
                        size="sm"
                        className="hover:bg-green-600/10 hover:text-green-600 text-blue-600 border border-blue-600 bg-blue-50 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleCopyProfileLink}
                      >
                        <Link2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Copy Profile Link
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Share this link with buyers to find your profile in the app</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-green-600/10 hover:text-green-600 border border-gray-800 text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => navigate('/dashboard/settings')}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-xs sm:text-sm max-w-3xl mb-4 sm:mb-6">
              <p className="leading-relaxed text-sm sm:text-base">
                {profile?.aboutStore || "No store description available"}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {[
                { 
                  label: "Streams", 
                  value: profile?.streamCount || 0, 
                  icon: Radio, 
                  color: "text-blue-500",
                  onClick: () => navigate('/dashboard/live-streams/live-stream')
                },
                { 
                  label: "Orders", 
                  value: profile?.totalOrders || 0, 
                  icon: ShoppingBag, 
                  color: "text-green-500",
                  onClick: () => navigate('/dashboard/orders') 
                },
                { 
                  label: "Following", 
                  value: profile?.followingCount || 0, 
                  icon: Users, 
                  color: "text-purple-500",
                  onClick: handleFollowingClick
                },
                { 
                  label: "Followers", 
                  value: profile?.followersCount || 0, 
                  icon: Heart, 
                  color: "text-rose-500",
                  onClick: handleFollowersClick
                },
                {
                  label: "Store Rating",
                  value: (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span>{reviewStats.averageRating.toFixed(1) || "0.0"}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, index) => (
                          <svg
                            key={index}
                            className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${
                              index < Math.floor(reviewStats.averageRating || 0.0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                            />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({reviewStats.totalReviews || "0"})
                      </span>
                    </div>
                  ),
                  icon: MessageSquare,
                  color: "text-yellow-500",
                  onClick: () => navigate('/dashboard/products')
                },
              ].map((stat) => (
                <Card 
                  key={stat.label} 
                  className="hover:border-green-600/50 transition-colors cursor-pointer"
                  onClick={stat.onClick}
                >
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className="text-2xs sm:text-xs font-medium text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                    </div>
                    <div className="text-sm sm:text-lg md:text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs Navigation */}
            <div className="border-b sm:mb-2">
              <Tabs defaultValue="reviews" className="space-y-4 mt-4">
                <div className="overflow-x-auto">
                  <TabsList className="w-max sm:w-full justify-start rounded-none h-auto p-0 bg-transparent flex">
                    {[
                      { value: "reviews", label: "Reviews", icon: MessageSquare },
                      { value: "shop", label: "Shop", icon: ShoppingBag },
                      { value: "blips", label: "Blips", icon: Zap },
                      { value: "shows", label: "Shows", icon: Tv },
                      { value: "posts", label: "Posts", icon: UserSquareIcon },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="px-3 sm:px-6 py-2 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none text-xs sm:text-sm whitespace-nowrap"
                      >
                        <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <TabsContent value="reviews" className="min-h-[400px] pt-4">
                  <ReviewsTab sellerId={profile?._id} />
                </TabsContent>
                <TabsContent value="shop" className="min-h-[400px] pt-4">
                  <ShopTab sellerId={profile?._id} />
                </TabsContent>
                <TabsContent value="blips" className="min-h-[400px] pt-4">
                  <BlipsTab sellerId={profile?._id} />
                </TabsContent>
                <TabsContent value="shows" className="min-h-[400px] pt-4">
                  <ShowsTab sellerId={profile?._id} />
                </TabsContent>
                <TabsContent value="posts" className="min-h-[400px] pt-4">
                  <div className="flex flex-col items-center justify-center h-full py-8 sm:py-16">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 sm:p-6 rounded-lg text-center max-w-md">
                      <UserSquareIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-green-600 mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">Coming Soon</h3>
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">Post feature is currently under development and will be available soon!</p>
                      <Badge className="mx-auto bg-green-600 hover:bg-green-700">Stay tuned</Badge>
                    </div>
                  </div>
                  {/* <PostsTab sellerId={profile?._id} /> */}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
              Followers
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              People who are following your store
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto mt-3 sm:mt-4">
            {followersLoading && followers.length === 0 ? (
              <div className="py-6 sm:py-8 flex justify-center">
                <LinearProgress color="success" className="w-3/4" />
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                No followers yet
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {followers.map((follower) => (
                  <div key={follower._id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-muted">
                        <AvatarImage src={follower.profileImageUrl || "/placeholder.svg"} />
                        <AvatarFallback>
                          {follower.name && follower.name !== "undefined undefined" 
                            ? `${follower.name.split(' ')[0]?.[0]}${follower.name.split(' ')[1]?.[0] || ''}`
                            : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-full">
                          {follower.name && follower.name !== "undefined undefined" 
                            ? follower.name 
                            : "Anonymous User"}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-2xs sm:text-xs text-muted-foreground">
                          <span>Followed: {new Date(follower.followedAt).toLocaleDateString()}</span>
                          {follower.totalOrders > 0 && (
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {follower.totalOrders} orders
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {follower.buyerId && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-2xs sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                        onClick={() => {
                          setFollowersDialogOpen(false);
                          navigate(`/dashboard/customer/${follower.buyerId}`);
                        }}
                      >
                        <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">View Profile</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    )}
                  </div>
                ))}
                
                {followersPagination.hasMore && (
                  <div className="flex justify-center pt-3 sm:pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadMoreFollowers}
                      disabled={followersLoading}
                      className="text-xs sm:text-sm h-7 sm:h-8"
                    >
                      {followersLoading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              Following
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              People you are following
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto mt-3 sm:mt-4">
            {followingLoading ? (
              <div className="py-6 sm:py-8 flex justify-center">
                <LinearProgress color="success" className="w-3/4" />
              </div>
            ) : following.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                You&apos;re not following anyone yet
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {following.map((user) => (
                  <div key={user.buyerId} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-muted">
                        <AvatarFallback>
                          {user.firstName && user.lastName 
                            ? `${user.firstName[0]}${user.lastName[0]}`
                            : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-full">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : "Anonymous User"}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-2xs sm:text-xs text-muted-foreground">
                          <span>Following since: {new Date(user.followDate).toLocaleDateString()}</span>
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-2xs sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                      onClick={() => {
                        setFollowingDialogOpen(false);
                        navigate(`/dashboard/customer/${user.buyerId}`);
                      }}
                    >
                      <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">View Profile</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Management Modal */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="max-w-[92vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Profile Picture
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Manage your profile picture
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 sm:mt-6">
            {/* Profile Image Display */}
            <div className="flex justify-center mb-6">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 border-4 border-background rounded-full ring-2 sm:ring-4 ring-green-600/20">
                <AvatarImage src={profile?.storeAvatar?.url || "/placeholder.svg"} />
                <AvatarFallback className="font-bold text-2xl sm:text-3xl md:text-4xl">
                  {`${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 h-10 sm:h-11"
                onClick={() => {
                  // Trigger the file input for editing
                  document.getElementById('avatar-upload').click();
                  setShowAvatarModal(false);
                }}
              >
                <Pencil className="h-4 w-4" />
                {profile?.storeAvatar?.url ? "change Picture" : "Add Picture"}
              </Button>
              
              {profile?.storeAvatar?.url && (
                <Button
                  variant="destructive"
                  className="flex-1 flex items-center justify-center gap-2 h-10 sm:h-11"
                  onClick={handleDeleteAvatar}
                  disabled={isDeletingAvatar}
                >
                  {isDeletingAvatar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Picture
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
