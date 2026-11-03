import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import { useState, useEffect } from "react"
import { Badge } from "@/Components/ui/badge"
import { Card } from "@/Components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { Button } from "@/Components/ui/button"
import { CheckCircle2, Star, MessageSquare, UserPlus, UserMinus, ShoppingBag, DollarSign, TrendingUp, Package } from 'lucide-react'
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
import { useAuthContext } from "@/Hooks/useAuthContextV2";

function CustomerDetail() {
  const { token } = useAuthContext();
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
        const sellerToken = token?.data
        if (!sellerToken) {
          console.error('Seller token not found')
          return
        }
        
        // Fetch customer data
        const response = await fetch(`${BASE_URL}/seller/buyer/${id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const data = await response.json();
        
        // Check if the seller is following this buyer
        const followingResponse = await fetch(`${BASE_URL}/seller/following/buyers`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const followingData = await followingResponse.json();
        const isCurrentlyFollowing = followingData.some(buyer => buyer.buyerId === id);
        setIsFollowing(isCurrentlyFollowing);

        setCustomerData({
          name: `${data.buyerInfo.firstName} ${data.buyerInfo.lastName}`,
          email: data.buyerInfo.email,
          phoneNumber: data.buyerInfo.phoneNumber,
          country: data.buyerInfo.country,
          avatar: data.buyerInfo.profileImageUrl || "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
          verified: data.hasOrderedFromSeller,
          customerSince: new Date(data.buyerInfo.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          joinedDate: new Date(data.buyerInfo.joinDate).getFullYear(),
          accountAge: data.buyerInfo.accountAge,
          isIdentityVerified: data.buyerInfo.isIdentityVerified,
          preferredLanguage: data.buyerInfo.preferredLanguage,
          preferredCurrency: data.buyerInfo.preferredCurrency,
          rating: 0,
          amountSpent: {
            total: data.orderStats?.totalSpent || 0,
            withSeller: data.orderStats?.totalSpent || 0
          },
          orderStats: {
            totalOrders: data.orderStats?.totalOrders || 0,
            totalSpent: data.orderStats?.totalSpent || 0,
            averageOrderValue: data.orderStats?.averageOrderValue || 0,
            firstOrderDate: data.orderStats?.firstOrderDate || null,
            lastOrderDate: data.orderStats?.lastOrderDate || null,
            orderFrequency: data.orderStats?.orderFrequency || '0 orders/month'
          },
          purchaseInsights: {
            topCategories: data.purchaseInsights?.topCategories || [],
            paymentMethods: data.purchaseInsights?.paymentMethods || [],
            orderStatusDistribution: data.purchaseInsights?.orderStatusDistribution || {}
          },
          addresses: data.shippingAddresses || [],
          recentOrders: data.recentOrders || [],
          topPurchases: data.topPurchases || []
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
        openChatWithCustomer: true // Flag to indicate we want to open a chat with this customer
      }
    });
  };

  const handleFollowClick = async () => {
    try {
      const sellerToken = token?.data;
      if (!sellerToken) {
        console.error('Seller token not found');
        return;
      }

      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const method = isFollowing ? 'DELETE' : 'POST';

      const response = await fetch(`${BASE_URL}/seller/${endpoint}/${id}`, {
        method,
        headers: {
          'Authorization': `Bearer ${sellerToken}`
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
      <div className="max-w-[1600px] pt-4 pb-14 mx-auto sm:px-6 lg:px-8">
       
        {/* Customer Header - Enhanced with more details */}
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
                  <span className="font-medium">Verified Customer</span>
                </div>
              )}
              {customerData.isIdentityVerified && (
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs border border-green-200">
                  <Icon icon="mdi:shield-check" width="12" height="12" />
                  <span className="font-medium">ID Verified</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="font-medium">Member since {customerData.customerSince}</span>
              <span className="hidden sm:block text-slate-300">•</span>
              <span className="text-slate-500">{customerData.accountAge}</span>
              {/* {customerData.phoneNumber && (
                <>
                  <span className="hidden sm:block text-slate-300">•</span>
                  <span className="text-slate-500">{customerData.phoneNumber}</span>
                </>
              )} */}
              {customerData.country && (
                <>
                  <span className="hidden sm:block text-slate-300">•</span>
                  <span className="text-slate-500">{customerData.country}</span>
                </>
              )}
              {customerData.preferredCurrency && (
                <>
                  <span className="hidden sm:block text-slate-300">•</span>
                  <span className="text-slate-500">Currency: {customerData.preferredCurrency}</span>
                </>
              )}
            </div>
          </div>
          <div className="sm:flex gap-2">
            <Button 
              variant="primary" 
              className="lg:ml-4 hover:bg-green-700 transition-all duration-300 bg-green-600 text-white"
              onClick={handleMessageClick}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
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
              {isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unfollow Customer
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow Customer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-violet-700 to-violet-600 text-white border border-violet-400">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium font-inter text-white/80">Total Spent</p>
                <p className="text-lg font-bold font-inter mt-0.5">
                  ₦{(customerData?.amountSpent?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  {customerData?.orderStats?.orderFrequency}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-500 text-white border border-blue-400">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium text-white/80">Total Orders</p>
                <p className="text-lg font-bold mt-0.5">
                  {customerData?.orderStats?.totalOrders || 0}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  First order: {customerData?.orderStats?.firstOrderDate ? 
                    new Date(customerData.orderStats.firstOrderDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'
                  }
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border border-emerald-400">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium text-white/80">Average Order Value</p>
                <p className="text-lg font-bold mt-0.5">
                  ₦{Math.round(customerData?.orderStats?.averageOrderValue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-600 to-amber-500 text-white border border-amber-400">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-xs font-medium text-white/80">Last Purchase</p>
                <p className="text-lg font-bold mt-0.5">
                  {customerData?.orderStats?.lastOrderDate ? 
                    new Date(customerData.orderStats.lastOrderDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Top Purchases */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-semibold font-inter text-slate-900 mb-4">Top Purchases</h2>
                <div className="space-y-4">
                  {customerData.topPurchases?.map((purchase, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{purchase.name}</p>
                        <div className="mt-1 flex items-center gap-4 text-sm">
                          <span className="text-slate-600">Quantity: {purchase.quantity}</span>
                          <span className="text-emerald-600 font-medium">₦{purchase.totalSpent.toLocaleString()}</span>
                        </div>
                        {/* <p className="text-xs text-slate-500 mt-1">Seller: {purchase.seller.name}</p> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Recent Orders - Enhanced with images */}
            <Card className="border border-slate-200 max-h-[860px] overflow-y-auto scroll-smooth">
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
                <div className="divide-y divide-slate-300">
                  {customerData.recentOrders.map((order) => (
                    <div key={order._id} className="py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-900">#{order.orderNumber}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${
                              order.paymentMethod === 'paystack' ? 'bg-green-100 text-green-800 border-green-200' :
                              order.paymentMethod === 'cash' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            } capitalize`}>
                              {order.paymentMethod}
                            </Badge>
                            {order.isCashOnDelivery && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                COD
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="font-medium text-emerald-600">₦{order.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="mt-2 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-md">
                            {item.product.images && item.product.images[0] && (
                              <img 
                                src={item.product.images[0].url} 
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity} × ₦{item.product.price.toLocaleString()}</p>
                            </div>
                            <Badge className={`
                              ${item.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' : 
                                item.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                item.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                item.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-slate-100 text-slate-800 border-slate-200'} 
                              capitalize
                            `}>
                              {item.status || 'processing'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Enhanced Customer Stats */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-inter font-semibold text-slate-900 mb-4">Detailed Statistics</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Order Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Total Orders</span>
                        <span className="font-medium text-slate-900">
                          {customerData?.orderStats?.totalOrders || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Total Spent</span>
                        <span className="font-medium text-slate-900">
                          ₦{(customerData?.orderStats?.totalSpent || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Average Order Value</span>
                        <span className="font-medium text-slate-900">
                          ₦{Math.round(customerData?.orderStats?.averageOrderValue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">First Order Date</span>
                        <span className="font-medium text-slate-900">
                          {customerData?.orderStats?.firstOrderDate ? 
                            new Date(customerData.orderStats.firstOrderDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Last Order Date</span>
                        <span className="font-medium text-slate-900">
                          {customerData?.orderStats?.lastOrderDate ? 
                            new Date(customerData.orderStats.lastOrderDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Order Frequency</span>
                        <span className="font-medium text-slate-900">
                          {customerData?.orderStats?.orderFrequency || '0 orders/month'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {customerData?.purchaseInsights?.topCategories && 
                   customerData.purchaseInsights.topCategories.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Top Categories</h3>
                      <div className="space-y-2">
                        {customerData.purchaseInsights.topCategories.slice(0, 5).map((category, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 capitalize">{category.category}</span>
                            <span className="font-medium text-slate-900">
                              ₦{(category.totalSpent || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {customerData?.purchaseInsights?.paymentMethods && 
                   customerData.purchaseInsights.paymentMethods.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Methods</h3>
                      <div className="space-y-2">
                        {customerData.purchaseInsights.paymentMethods.map((payment, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 capitalize">{payment.method}</span>
                            <span className="font-medium text-slate-900">
                              {payment.count} orders
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {customerData?.purchaseInsights?.orderStatusDistribution && 
                   Object.keys(customerData.purchaseInsights.orderStatusDistribution).length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Order Status Distribution</h3>
                      <div className="space-y-2">
                        {Object.entries(customerData.purchaseInsights.orderStatusDistribution).map(([status, count], index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 capitalize">{status}</span>
                            <span className="font-medium text-slate-900">
                              {count} items
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Shipping Addresses */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-semibold font-inter text-slate-900 mb-4">Shipping Addresses</h2>
                <div className="space-y-4">
                  {customerData.addresses.map((address, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                          {address.addressType}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{address.addressLine1}</p>
                      {address.addressLine2 && (
                        <p className="text-sm text-slate-600 mt-1">{address.addressLine2}</p>
                      )}
                      <p className="text-sm text-slate-600 mt-1">
                        {address.city}, {address.state}, {address.country}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{address.zipCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Activity Feed - Enhanced */}
            <Card className="border border-slate-200">
              <div className="p-5">
                <h2 className="text-lg font-semibold font-inter text-slate-900 mb-4">Customer Info</h2>
                <div className="space-y-4">
                  {/* <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Email</span>
                        <span className="font-medium text-slate-900">{customerData.email}</span>
                      </div>
                      {customerData.phoneNumber && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Phone</span>
                          <span className="font-medium text-slate-900">{customerData.phoneNumber}</span>
                        </div>
                      )}
                      {customerData.country && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Country</span>
                          <span className="font-medium text-slate-900">{customerData.country}</span>
                        </div>
                      )}
                    </div>
                  </div> */}
                  
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Account Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Member Since</span>
                        <span className="font-medium text-slate-900">{customerData.customerSince}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Account Age</span>
                        <span className="font-medium text-slate-900">{customerData.accountAge}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Preferred Currency</span>
                        <span className="font-medium text-slate-900">{customerData.preferredCurrency || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Preferred Language</span>
                        <span className="font-medium text-slate-900 capitalize">{customerData.preferredLanguage || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">ID Verified</span>
                        <span className={`font-medium ${customerData.isIdentityVerified ? 'text-green-600' : 'text-slate-600'}`}>
                          {customerData.isIdentityVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
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

