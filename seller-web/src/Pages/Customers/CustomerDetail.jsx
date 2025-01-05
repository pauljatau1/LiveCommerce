import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import { useState, useEffect } from "react"
import { Badge } from "@/Components/ui/badge"
import { Card } from "@/Components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { Button } from "@/Components/ui/button"
import { CheckCircle2, Star } from 'lucide-react'
import { useParams } from "react-router-dom"
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

function CustomerDetail() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const [customerData, setCustomerData] = useState(null);
  const [notification, setNotification] = useState(true);
  const [loading, setLoading] = useState(true)
  const { id } = useParams()

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (!sellerToken) {
          console.error('Seller token not found')
          return
        }
        const tokenData = JSON.parse(sellerToken)
        const response = await fetch(`${BASE_URL}/seller/buyer/${id}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.data}`
          }
        })
        const data = await response.json()
        setCustomerData({
          name: `${data.buyerInfo.firstName} ${data.buyerInfo.lastName}`,
          avatar: "/placeholder.svg?height=48&width=48",
          verified: false,
          customerSince: new Date(data.buyerInfo.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          joinedDate: new Date(data.buyerInfo.joinDate).getFullYear(),
          rating: 0,
          amountSpent: `₦${data.orderStats.withSeller.totalSpent.toLocaleString()}`,
          totalOrders: data.orderStats.withSeller.totalOrders,
          shippingAddress: data.shippingAddresses[0] ?
            `${data.shippingAddresses[0].city}, ${data.shippingAddresses[0].country}, ${data.shippingAddresses[0].zipCode}` :
            'No address provided',
          orders: [], // You'll need to add an endpoint for orders or modify the existing response
          activities: data.activityFeed.map(activity => ({
            date: new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            title: activity.content,
            description: ''
          })),
          notes: [] // You'll need to add an endpoint for notes or modify the existing response
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

  if (loading) {
    return <div className="flex flex-col justify-center items-center h-[80dvh]">
      <div className="w-1/4">
        <LinearProgress color="success" />
      </div>
    </div>
  }

  if (!customerData) {
    return <div className="flex justify-center items-center h-screen">Customer not found</div>
  }

  return (
    <>
      {/* Sidebar */}
      {/* Main Content */}
      <div className="">
        {/* Search Bar */}
        <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Notification */}
        {
          notification && (
            <AlertNotification />
          )
        }

        {/* Customer Header */}
        <div className="flex xl:items-center gap-4 my-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={customerData.avatar} alt={customerData.name} />
            <AvatarFallback>{customerData.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-4 xl:gap-8">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{customerData.name}</h1>
              {customerData.verified && (
                <div className="flex justify-center items-center gap-2">
                  <span>Verified</span>
                  <Icon icon="fluent-mdl2:verified-brand-solid" width="20" height="20" className="text-[#16783A]" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Customer Since: {customerData.customerSince}</span>
              <span>•</span>
              <span className="italic">Joined Auqli in {customerData.joinedDate}</span>
              <span>•</span>
              <div className="flex items-center">
                <StarRating starLength={5} messages={['Terrible', 'Bad', 'Okay', 'Good', 'Amazing']} defaultRating={customerData?.rating} color="#FFD700" starTextStyle={{ color: '#000000' }} disabled />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="w-full">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6 w-full ">
              <Card className="py-6 px-4 xl:px-6 bg-[#0D0D1E] text-white w-full ">
                <div className="text-sm mb-2 flex items-center gap-2 xl:gap-3">
                  <Icon icon="hugeicons:cash-02" className="w-[24px] h-[24px] xl:w-[32px] xl:h-[32px]" color="#0BB248" />
                  <h1 className="text-sm  font-lexend ">Amount Spent</h1>
                </div>
                <div className="text-xl xl:text-2xl font-bold">{customerData.amountSpent}</div>
              </Card>
              <Card className="py-6 px-4 xl:px-6 bg-[#0D0D1E] text-white w-full">
                <div className="text-sm mb-2 flex items-center gap-2 xl:gap-3">
                  <Icon icon="heroicons:briefcase" className="w-[24px] h-[24px] xl:w-[32px] xl:h-[32px] " color="#0BB248" />
                  <h1 className="text-sm  font-lexend ">Total Orders</h1>
                </div>
                <div className="text-xl xl:text-2xl font-bold">{customerData.totalOrders}</div>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="">
              {/* Orders and Activity */}
              <div className=" w-full space-y-6">
                {/* Latest Orders */}
                <Card className="border-[#00000042] border bg-[#00000008] w-full rounded-lg">
                  <div className="p-6">
                    <h2 className="text-base xl:text-xl font-lexendDeca font-bold text-[#05031F] pb-8 border-b border-[#00000042] mb-4">Latest Orders</h2>
                    <div className=" divide-y divide-[#00000042]">
                      {
                        customerLatestOrdersTempData.length > 0 ? (
                          customerLatestOrdersTempData.slice(0, 5).map((order) => (
                            <CustomerOrdersCard key={order.id} item={order} />
                          ))
                        ) : (
                          <div className="w-full h-full flex flex-col justify-center items-center" >
                            <img src={NotFoundIcon} alt="Not Found" className="w-44 h-44" />
                            <h1 className="text-md font-medium text-[#05031F]">No orders found</h1>
                          </div>
                        )
                      }
                    </div>
                  </div>
                </Card>

                {/* Activity */}
                <Card>
                  <div className="p-6 bg-[#F7F7F7] border border-[#00000042] rounded-lg">
                    <h2 className="text-base xl:text-xl font-lexendDeca font-bold mb-4">Activity</h2>
                    <div className="space-y-6">
                      {customerData?.activities?.map((activity, index) => (
                        <div key={index} className="flex divide-x divide-[#05031F] gap-4">
                          <div className="">
                            <h4 className="text-sm xl:text-base font-lexendDeca font-medium text-[#05031F] " >{activity?.date}</h4>
                            <p className="text-sm xl:text-base font-light font-lexendDeca whitespace-nowrap">{activity?.time}</p>
                          </div>
                          <div className="pl-3" >
                            <div className="font-semibold font-lexendDeca text-[#05031F] text-sm xl:text-base">{activity?.title}</div>
                            <p className="text-xs xl:text-sm font-cabin text-[#00000098] font-normal mt-1">
                              The seller has prepared your order and is sending to dispatch company order and is sending to dispatch company
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Side Information */}
          <div className="space-y-6 ">
            {/* Details & Shipping */}
            <Card className="bg-[#F7F7F7] border border-[#00000042] rounded-lg">
              <div className="p-6 divide-y  divide-[#00000042] ">
                <h2 className="text-lg xl:text-xl font-lexend font-bold mb-4">Details & Shipping Information</h2>
                <div className="mt-4 ">
                  <h3 className="font-medium my-2">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {customerData.shippingAddress}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-base xl:text-xl font-cabin font-bold mb-4">Customer Notes</h2>
                <div className="space-y-4 border border-[#00000042] rounded-lg p-4">
                  {customerData.notes.map((note, index) => (
                    <div key={index} className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.timestamp}
                      </p>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Write a note..."
                      className="flex-1 px-3 py-2 text-sm font-lexend text-[#000000] rounded-md border focus:outline-none"
                    />
                    <Button className="bg-[#05031F] text-white text-xs xl:text-sm font-lexend ">Add Note</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer Notes */}
            <Card>

            </Card>

            {/* Top Products */}
            <Card className="bg-[#F7F7F7] border border-[#00000042] rounded-lg">
              <div className="p-6 divide-y divide-[#00000042]">
                <div className="flex items-center gap-2 mb-5 ">
                  <Icon icon="solar:cup-outline" width="512" height="512" className="w-4 h-4 xl:w-6 xl:h-6" />
                  <h2 className="text-lg xl:text-xl font-lexend font-bold">Top Products Purchased</h2>
                </div>
                <div className="space-y-4">
                  {customerData.orders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4">
                      <img
                        src={order.image}
                        alt={order.name}
                        className="h-16 w-16 object-cover rounded-md"
                      />
                      <div>
                        <h3 className="font-medium">{order.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Color: {order.color}
                        </p>
                        <p className="text-sm">
                          {order.price} x{order.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
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

