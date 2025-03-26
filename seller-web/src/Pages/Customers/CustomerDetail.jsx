import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import { useState, useEffect } from "react"
import { Badge } from "@/Components/ui/badge"
import { Card } from "@/Components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { Button } from "@/Components/ui/button"
import { CheckCircle2, Star } from 'lucide-react'
import { useParams, useNavigate } from "react-router-dom"
import { BASE_URL } from "@/Constants/Server";
import { useSidebar } from "@/Hooks/useSideBar";
import { Icon } from "@iconify/react";
import { StarRating } from "star-product-rating";
import { customerLatestOrdersTempData } from "@/Utilities/data";
import Loader from "@/Components/Loader";
import AlertNotification from "@/Components/ui/AlertNotification";
import CustomerOrdersCard from "@/Components/CustomerOrdersCard";
import NotFoundIcon from '@/assets/not-found-icon.png';
import LinearProgress from '@mui/material/LinearProgress';
import Header from "@/Components/ui/Header/Header"
import { useOutletContext } from "react-router-dom"

function CustomerDetail() {
  const { setHeaderName, setNavName } = useOutletContext()
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const [customerData, setCustomerData] = useState(null);
  const [notification, setNotification] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setHeaderName('Customer');
    setNavName('Customer Detail');
  }, [])

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (!sellerToken) {
          console.error('Seller token not found')
          return
        }
        const tokenData = JSON.parse(sellerToken)
        
        // Fetch customer data
        const response = await fetch(`${BASE_URL}/seller/buyer/${id}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.data}`
          }
        });
        const data = await response.json();
        
        // Check if the seller is following this buyer
        const followingResponse = await fetch(`${BASE_URL}/seller/following/buyers`, {
          headers: {
            'Authorization': `Bearer ${tokenData.data}`
          }
        });
        const followingData = await followingResponse.json();
        const isCurrentlyFollowing = followingData.some(buyer => buyer.buyerId === id);
        setIsFollowing(isCurrentlyFollowing);

        setCustomerData({
          name: `${data.buyerInfo.firstName} ${data.buyerInfo.lastName}`,
          email: data.buyerInfo.email,
          avatar: data.buyerInfo.profileImageUrl || "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
          verified: data.hasOrderedFromSeller,
          customerSince: new Date(data.buyerInfo.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          joinedDate: new Date(data.buyerInfo.joinDate).getFullYear(),
          rating: 0,
          amountSpent: {
            total: data.orderStats.general.totalSpent,
            withSeller: data.orderStats.withSeller.totalSpent
          },
          orderStats: {
            total: data.orderStats.general.totalOrders,
            withSeller: data.orderStats.withSeller.totalOrders,
            averageValue: data.orderStats.withSeller.averageOrderValue
          },
          addresses: data.shippingAddresses,
          activities: data.activityFeed,
          recentOrders: data.recentOrders,
          topPurchases: data.topPurchases
        })
      } catch (error) {
        console.error('Error fetching customer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [id])

  console.log('customerData', customerData)

  const handleMessageClick = () => {
    if (!customerData) return;
    
    navigate('/dashboard/messages', {
      state: {
        customerId: id,
        customerName: customerData.name,
        customerEmail: customerData.email,
      }
    });
  };

  const handleFollowClick = async () => {
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) {
        console.error('Seller token not found');
        return;
      }
      const tokenData = JSON.parse(sellerToken);

      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const method = isFollowing ? 'DELETE' : 'POST';

      const response = await fetch(`${BASE_URL}/seller/${endpoint}/${id}`, {
        method,
        headers: {
          'Authorization': `Bearer ${tokenData.data}`
        }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      } else {
        console.error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (loading) {
    return <div className="flex flex-col justify-center items-center h-[80dvh]">
      <div className="w-1/4">
        <LinearProgress color="success" />
      </div>
    </div>
  }

  if (!customerData) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] px-4">
        <img 
          src={NotFoundIcon} 
          alt="Customer Not Found" 
          className="w-32 h-32 mb-6 opacity-80"
        />
        <h2 className="text-2xl font-semibold text-slate-800 mb-3 text-center">
          Customer Not Found
        </h2>
        <p className="text-slate-600 text-center max-w-md mb-6">
          This customer profile may have been deactivated, deleted, or is temporarily unavailable. Please verify the customer ID or try again later.
        </p>
        <Button
          variant="outline"
          className="border-slate-300 hover:bg-slate-50"
          onClick={() => navigate(-1)}
        >
          <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
       
        {/* Customer Header - More compact and refined */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 my-6 p-5 bg-white rounded-lg border border-slate-200">
          <Avatar className="h-14 w-14 ring-2 ring-indigo-500/10">
            {customerData.avatar ? (
              <AvatarImage 
                src={customerData.avatar} 
                alt={customerData.name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gray-200">
                {customerData.name[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-inter font-bold text-slate-900">{customerData.name}</h1>
              {customerData.verified && (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs border border-blue-200">
                  <Icon icon="fluent-mdl2:verified-brand-solid" width="12" height="12" />
                  <span className="font-medium">Verified</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="font-medium">Since {customerData.customerSince}</span>
              <span className="hidden sm:block text-slate-300">•</span>
              <span className="text-slate-500">Joined {customerData.joinedDate}</span>
              <span className="hidden sm:block text-slate-300">•</span>
              {/* NOT ALLOWED FOR SECURITY REASONS <span className="text-indigo-600 font-medium">{customerData.email}</span>*/}
            </div>
          </div>
          <div className="sm:flex gap-2">
            <Button 
              variant="primary" 
              className="lg:ml-4 hover:bg-green-700 transition-all duration-300 bg-green-600 text-white"
              onClick={handleMessageClick}
            >
              Message Customer
            </Button>
            <Button
              variant={isFollowing ? "outline" : "primary"}
              className={`lg:ml-4 mt-2 sm:mt-0 transition-all duration-300 ${
                isFollowing 
                  ? 'border-red-500 text-red-500 hover:bg-red-50' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleFollowClick}
            >
              {isFollowing ? 'Unfollow Customer' : 'Follow Customer'}
            </Button>
          </div>
        </div>

        {/* Stats Cards - Multi-color scheme */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-violet-700 to-violet-600 text-white border border-violet-400">
            <div className="flex items-center gap-3">
              <Icon icon="hugeicons:cash-02" className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium font-inter text-white/80">Total Spent</p>
                <p className="text-lg font-bold font-inter mt-0.5">₦{customerData.amountSpent.total.toLocaleString()}</p>
                <p className="text-xs text-white/70 mt-0.5">With you: ₦{customerData.amountSpent.withSeller.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-500 text-white border border-blue-400">
            <div className="flex items-center gap-3">
              <Icon icon="heroicons:shopping-bag" className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium text-white/80">Total Orders</p>
                <p className="text-lg font-bold mt-0.5">{customerData.orderStats.total}</p>
                <p className="text-xs text-white/70 mt-0.5">With you: {customerData.orderStats.withSeller}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border border-emerald-400">
            <div className="flex items-center gap-3">
              <Icon icon="heroicons:chart-bar" className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium text-white/80">Average Order</p>
                <p className="text-lg font-bold mt-0.5">₦{Math.round(customerData.orderStats.averageValue).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Recent Orders */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold font-inter text-slate-900">Recent Orders</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-200 font-inter text-blue-700 hover:bg-blue-50"
                    onClick={() => navigate('/dashboard/orders')}
                  >
                    View All
                  </Button>
                </div>
                <div className="divide-y divide-slate-100">
                  {customerData.recentOrders.map((order) => (
                    <div key={order._id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex xl:items-center flex-col xl:flex-row justify-between sm:justify-start gap-3">
                          <p className="font-medium font-inter text-slate-900">#{order.orderNumber}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="mt-1.5">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-xs text-slate-600">
                              {item.quantity}x {item.product.name}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-emerald-600">₦{order.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Activity Feed */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-semibold font-inter text-slate-900 mb-4">Activity Feed</h2>
                <div className="space-y-4">
                  {customerData.activities.map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-14 text-xs text-slate-500">
                        <p className="font-medium">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-slate-400">
                          {new Date(activity.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex-1 pb-4 border-l border-slate-200 pl-4 relative">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-100 border-2 border-indigo-500"></div>
                        <p className="text-sm font-medium text-slate-900">{activity.content}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{activity.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Shipping Addresses */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-semibold font-inter text-slate-900 mb-4">Shipping Addresses</h2>
                <div className="space-y-4">
                  {customerData.addresses.map((address, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                          {address.addressType}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{address.addressLine1}</p>
                      {address.addressLine2 && (
                        <p className="text-sm text-slate-600">{address.addressLine2}</p>
                      )}
                      <p className="text-sm text-slate-600 mt-1">
                        {address.city}, {address.state}, {address.country}
                      </p>
                      <p className="text-sm text-slate-500">{address.zipCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Customer Stats */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-inter font-semibold text-slate-900 mb-4">Customer Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                    <span className="text-sm text-slate-600">Average Order Value</span>
                    <span className="font-medium text-indigo-600">₦{Math.round(customerData.orderStats.averageValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                    <span className="text-sm text-slate-600">Total Orders</span>
                    <span className="font-medium text-blue-600">{customerData.orderStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                    <span className="text-sm text-slate-600">Orders with You</span>
                    <span className="font-medium text-violet-600">{customerData.orderStats.withSeller}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

export default CustomerDetail

