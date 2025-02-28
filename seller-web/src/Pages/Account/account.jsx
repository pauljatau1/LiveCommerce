import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MapPin, MoreVertical, Calendar, Phone, ShoppingBag, Users, Heart, Zap, Tv, MessageSquare, CheckCircle2, Radio, Camera } from "lucide-react"
import { UserSquareIcon } from "lucide-react"
import LinearProgress from "@mui/material/LinearProgress"
import { BASE_URL } from "@/Constants/Server"
import { format } from "date-fns"
import PostsTab from "./components/PostsTab"
import ShopTab from "./components/ShopTab"
import BlipsTab from "./components/BlipsTab"
import ShowsTab from "./components/ShowsTab"
import ReviewsTab from "./components/ReviewsTab"
import { useOutletContext } from "react-router-dom"
import { toast } from "sonner"


export default function AccountPage() {
  const { setHeaderName, setNavName } = useOutletContext();
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setHeaderName("Account");
   
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const sellerToken = localStorage.getItem("sellerToken")
        if (!sellerToken) {
          throw new Error("No authentication token found")
        }

        const tokenData = JSON.parse(sellerToken)
        const response = await fetch(`${BASE_URL}/seller/profile`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile data")
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading toast
    const loadingToast = toast.loading('Uploading profile picture...');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      const response = await fetch(`${BASE_URL}/seller/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload avatar');
      
      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        storeAvatar: data.storeAvatar
      }));
      
      toast.dismiss(loadingToast);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to update profile picture');
      console.error('Error uploading avatar:', error);
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading toast
    const loadingToast = toast.loading('Uploading cover image...');

    const formData = new FormData();
    formData.append('banner', file);

    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      const response = await fetch(`${BASE_URL}/seller/profile/banner`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload banner');
      
      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        storeBanner: data.storeBanner
      }));
      
      toast.dismiss(loadingToast);
      toast.success('Cover image updated successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to update cover image');
      console.error('Error uploading banner:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <div className="w-1/4">
          <LinearProgress color="success" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <p className="text-red-600">Error: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-green-600 hover:bg-green-700"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image Section */}
      <div className="relative h-24 sm:h-36 w-full overflow-hidden mt-4 sm:mt-6 rounded-lg">
        <input
          type="file"
          id="banner-upload"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
        <label htmlFor="banner-upload" className="absolute inset-0 z-10 cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          <img
            src={profile?.storeBanner?.url || "https://a.storyblok.com/f/191576/768x432/ba499c40d2/nice-backgrounds-cover.webp"}
            alt="Cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute right-4 top-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </label>
      </div>

      {/* Profile Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-12 sm:-mt-16 mb-6 sm:mb-8">
          <div className="relative mb-6 sm:mb-8 z-20">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <label htmlFor="avatar-upload" className="cursor-pointer block relative group">
              <Avatar className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-background rounded-full ring-4 ring-green-600/20">
                <AvatarImage src={profile?.storeAvatar?.url || "/placeholder.svg"} />
                <AvatarFallback>{`${profile?.firstName?.[0]}${profile?.lastName?.[0]}`}</AvatarFallback>
              </Avatar>
              <div className="absolute right-0 bottom-0 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </label>
          </div>

          {/* Rest of the content */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{profile?.storeName || `${profile?.firstName} ${profile?.lastName}`}</h1>
                  {profile?.isVerified && (
                    <Badge 
                      variant="secondary" 
                      className="font-medium bg-green-600/10 text-green-600 px-2 sm:px-3 py-1 flex items-center gap-1 rounded-full text-xs sm:text-sm"
                    >
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {/* Contact info */}
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent hover:text-green-600">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    {profile?.businessEmail || profile?.email}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent hover:text-green-600">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    {profile?.businessAddress ? 
                      `${profile.businessAddress.city}, ${profile.businessAddress.country}` :
                      profile?.warehouseAddress ?
                      `${profile.warehouseAddress.city}, ${profile.warehouseAddress.country}` :
                      profile?.sellerAddress ?
                      `${profile.sellerAddress.city}, ${profile.sellerAddress.country}` :
                      'Address not available'
                    }
                  </Button>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="flex items-center sm:border-l sm:pl-4">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600" />
                      Joined {format(new Date(profile?.createdAt), 'MMMM yyyy')}
                    </span>
                    <span className="flex items-center sm:border-l sm:pl-4">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600" />
                      {profile?.businessNumber || profile?.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="icon" className="rounded-full hover:bg-green-600/10 hover:text-green-600">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </div>

            {/* Description */}
            <div className="space-y-3 text-sm max-w-3xl mb-6 sm:mb-8">
              <p className="leading-relaxed text-sm sm:text-base">
                {profile?.aboutStore || "No store description available"}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
              {[
                { label: "Streams", value: profile?.streamCount || 0, icon: Radio, color: "text-blue-500" },
                { label: "Orders", value: profile?.totalOrders || 0, icon: ShoppingBag, color: "text-green-500" },
                { label: "Following", value: profile?.followingCount || 0, icon: Users, color: "text-purple-500" },
                { label: "Followers", value: profile?.followersCount || 0, icon: Heart, color: "text-rose-500" },
                { 
                  label: "Store Rating", 
                  value: (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span>{profile?.storeStats?.averageRating || "4.3"}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, index) => (
                          <svg
                            key={index}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              index < Math.floor(profile?.storeStats?.averageRating || 4.3)
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
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({profile?.storeStats?.totalReviews || "42"})
                      </span>
                    </div>
                  ),
                  icon: MessageSquare,
                  color: "text-yellow-500",
                },
              ].map((stat) => (
                <Card key={stat.label} className="hover:border-green-600/50 transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs Navigation */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[500px] px-4 sm:px-0">
                <Tabs defaultValue="posts" className="space-y-4">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    {[
                      { value: "posts", label: "Posts", icon: UserSquareIcon },
                      { value: "shop", label: "Shop", icon: ShoppingBag },
                      { value: "blips", label: "Blips", icon: Zap },
                      { value: "shows", label: "Shows", icon: Tv },
                      { value: "reviews", label: "Reviews", icon: MessageSquare },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="px-4 sm:px-6 py-2 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none text-sm sm:text-base"
                      >
                        <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="posts" className="min-h-[400px]">
                    <PostsTab sellerId={profile?._id} />
                  </TabsContent>
                  <TabsContent value="shop" className="min-h-[400px]">
                    <ShopTab sellerId={profile?._id} />
                  </TabsContent>
                  <TabsContent value="blips" className="min-h-[400px]">
                    <BlipsTab sellerId={profile?._id} />
                  </TabsContent>
                  <TabsContent value="shows" className="min-h-[400px]">
                    <ShowsTab sellerId={profile?._id} />
                  </TabsContent>
                  <TabsContent value="reviews" className="min-h-[400px]">
                    <ReviewsTab sellerId={profile?._id} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

