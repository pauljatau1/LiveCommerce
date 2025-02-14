import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MapPin, MoreVertical, Calendar, Phone, ShoppingBag, Users, Heart, Zap, Tv, MessageSquare, CheckCircle2, Radio} from "lucide-react"
import { UserSquareIcon } from "lucide-react"
import LinearProgress from "@mui/material/LinearProgress"
import { BASE_URL } from "@/Constants/Server"
import { format } from "date-fns"
import PostsTab from "./components/PostsTab"
import ShopTab from "./components/ShopTab"
import BlipsTab from "./components/BlipsTab"
import ShowsTab from "./components/ShowsTab"
import ReviewsTab from "./components/ReviewsTab"

export default function AccountPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      <div className="relative h-36 w-full overflow-hidden md:h-36 mt-6 rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
        <img
          src={profile?.storeBanner?.url || "https://a.storyblok.com/f/191576/768x432/ba499c40d2/nice-backgrounds-cover.webp"}
          alt="Cover"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Profile Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8">
          <div className="relative mb-8">
            <Avatar className="h-28 w-28 border-4 border-background rounded-full ring-4 ring-green-600/20">
              <AvatarImage src={profile?.storeAvatar?.url || "/placeholder.svg"} />
              <AvatarFallback>{`${profile?.firstName?.[0]}${profile?.lastName?.[0]}`}</AvatarFallback>
            </Avatar>
          </div>

          {/* Rest of the content */}
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">{profile?.storeName || `${profile?.firstName} ${profile?.lastName}`}</h1>
                  {profile?.isVerified && (
                    <Badge 
                      variant="secondary" 
                      className="font-medium bg-green-600/10 text-green-600 px-3 py-1 flex items-center gap-1 rounded-full"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {/* Contact info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent hover:text-green-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {profile?.businessEmail || profile?.email}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent hover:text-green-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {profile?.businessAddress ? 
                      `${profile.businessAddress.city}, ${profile.businessAddress.country}` :
                      profile?.warehouseAddress ?
                      `${profile.warehouseAddress.city}, ${profile.warehouseAddress.country}` :
                      profile?.sellerAddress ?
                      `${profile.sellerAddress.city}, ${profile.sellerAddress.country}` :
                      'Address not available'
                    }
                  </Button>
                  <span className="flex items-center border-l pl-4">
                    <Calendar className="h-4 w-4 mr-2 text-green-600" />
                    Joined {format(new Date(profile?.createdAt), 'MMMM yyyy')}
                  </span>
                  <span className="flex items-center border-l pl-4">
                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                    {profile?.businessNumber || profile?.phoneNumber}
                  </span>
                </div>
              </div>
              
              <Button variant="outline" size="icon" className="rounded-full hover:bg-green-600/10 hover:text-green-600">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </div>

            {/* Description */}
            <div className="space-y-3 text-sm max-w-3xl mb-8">
              <p className="leading-relaxed text-base">
                {profile?.aboutStore || "No store description available"}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
              {[
                { label: "Streams", value: profile?.streamCount || 0, icon: Radio, color: "text-blue-500" },
                { label: "Orders", value: profile?.totalOrders || 0, icon: ShoppingBag, color: "text-green-500" },
                { label: "Following", value: profile?.followingCount || 0, icon: Users, color: "text-purple-500" },
                { label: "Followers", value: profile?.followersCount || 0, icon: Heart, color: "text-rose-500" },
                { 
                  label: "Store Rating", 
                  value: (
                    <div className="flex items-center gap-2">
                      <span>{profile?.storeStats?.averageRating || "4.3"}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, index) => (
                          <svg
                            key={index}
                            className={`w-4 h-4 ${
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
                      <span className="text-sm text-muted-foreground">
                        ({profile?.storeStats?.totalReviews || "42"})
                      </span>
                    </div>
                  ),
                  icon: MessageSquare,
                  color: "text-yellow-500",
                },
              ].map((stat) => (
                <Card key={stat.label} className="hover:border-green-600/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs Navigation */}
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
                    className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
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
  )
}

