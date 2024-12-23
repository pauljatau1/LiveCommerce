import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import SideBarNav from "@/Components/ui/DashboardHomepageUi/SideBarNav"
import { useState } from "react"
import { Badge } from "@/Components/ui/badge"
import { Card } from "@/Components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { Button } from "@/Components/ui/button"
import { CheckCircle2, Star } from 'lucide-react'

const customerData = {
  name: "Obinna Eze",
  avatar: "/placeholder.svg?height=48&width=48",
  verified: true,
  customerSince: "May 2025",
  joinedDate: "2025",
  rating: 4.5,
  amountSpent: "₦5,024,774",
  totalOrders: 105,
  shippingAddress: "Block 6 Lot 8 Pearl Street Richgage Homes, Villa Cecilia Lagos State, 29837, Nigeria",
  orders: [
    {
      id: "874847",
      image: "/placeholder.svg?height=80&width=80",
      name: "Turtleneck Polo Long Sleeve",
      color: "Orange Stripe",
      price: "₦10,401",
      quantity: 2,
      total: "₦92,000",
      status: { paid: true, delivered: true }
    },
    // More orders with the same structure...
  ],
  activities: [
    {
      date: "Oct 22",
      time: "11:42",
      title: "This Customer Started a Conversation With You",
      description: "The order has prepared your order and is sending to dispatch company order and is sending to dispatch company"
    },
    {
      date: "Oct 22",
      time: "11:42",
      title: "Tracking More Sent a Shipping Update Email For Oder #874847 To This Client",
      description: "The order has prepared your order and is sending to dispatch company order and is sending to dispatch company"
    },
    {
      date: "Oct 22",
      time: "11:42",
      title: "Shipped",
      description: "The order has prepared your order and is sending to dispatch company order and is sending to dispatch company"
    }
  ],
  notes: [
    {
      text: "Hey man, Please inform me when ever the package gets to your destination.",
      timestamp: "10/10/2024"
    },
    {
      text: "Hey Mr. Obinna, Note that no good already bought can be returned.",
      timestamp: "10/10/2024"
    }
  ]
}

function CustomerDetail() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-dvh">
      {/* Sidebar */}
      <SideBarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {/* Main Content */}
      <div className="pl-[20px] pr-[20px] md:pl-[42px] md:pr-[28px] pb-14 h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Search Bar */}
        <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        
        <div className="pl-[2px] xl:pl-[42px] pr-[18px] xl:pr-[28px]">
          {/* Customer Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={customerData.avatar} alt={customerData.name} />
              <AvatarFallback>{customerData.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{customerData.name}</h1>
                {customerData.verified && (
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Customer Since: {customerData.customerSince}</span>
                <span>•</span>
                <span>Joined Auqli in {customerData.joinedDate}</span>
                <span>•</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1">{customerData.rating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 bg-[#0D0D1E] text-white">
              <div className="text-sm mb-2">Amount Spent</div>
              <div className="text-2xl font-bold">{customerData.amountSpent}</div>
            </Card>
            <Card className="p-6 bg-[#0D0D1E] text-white">
              <div className="text-sm mb-2">Total Orders</div>
              <div className="text-2xl font-bold">{customerData.totalOrders}</div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders and Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Latest Orders */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Latest Orders</h2>
                  <div className="space-y-4">
                    {customerData.orders.map((order) => (
                      <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={order.image}
                          alt={order.name}
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{order.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Color: {order.color}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            #{order.id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {order.status.paid && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Paid
                              </Badge>
                            )}
                            {order.status.delivered && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Delivered
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{order.price} x{order.quantity}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Total: {order.total}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Activity */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Activity</h2>
                  <div className="space-y-6">
                    {customerData.activities.map((activity, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {activity.date}
                          <br />
                          {activity.time}
                        </div>
                        <div>
                          <div className="font-medium">{activity.title}</div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Side Information */}
            <div className="space-y-6">
              {/* Details & Shipping */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Details & Shipping Information</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Shipping Address</h3>
                      <p className="text-sm text-muted-foreground">
                        {customerData.shippingAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Customer Notes */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Customer Notes</h2>
                  <div className="space-y-4">
                    {customerData.notes.map((note, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{note.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.timestamp}
                        </p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a note..."
                        className="flex-1 px-3 py-2 rounded-md border"
                      />
                      <Button>Add Note</Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Top Products */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Top Products Purchased</h2>
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
      </div>
    </div>
  )
}

export default CustomerDetail

