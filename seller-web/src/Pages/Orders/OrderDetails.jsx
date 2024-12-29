import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Separator } from "@/components/ui/separator"
import SearchBar from '@/Components/ui/DashboardHomepageUi/SearchBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, } from "@/components/ui/avatar"
import Loader from '@/Components/Loader'
import { BASE_URL } from '@/Constants/Server'


export default function OrderDetails() {
  const { id } = useParams()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          const response = await fetch(`${BASE_URL}/order/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setOrderData(data)
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id])

  if (loading || !orderData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    )
  }

  const { order, buyer, items, shipping, timeline, notes } = orderData

  return (
    <>
      <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">#{order._id.slice(-8)}</h1>
                    <Badge variant="secondary" className="bg-black text-white">
                      {order.paymentInfo.status}
                    </Badge>
                    <Badge variant="secondary" className="bg-black text-white">
                      <Check className="mr-1 h-4 w-4" />
                      {shipping.tracking.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="bg-[#E6F5EB]">
                        Print
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Print Invoice</DropdownMenuItem>
                      <DropdownMenuItem>Print Shipping Label</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="secondary" className="bg-[#070514] text-white">
                    Follow
                  </Button>
                  <Button variant="secondary" className="bg-[#070514] text-white">
                    Chat Buyer
                  </Button>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600">{shipping.tracking.status}</span>
                    <Badge variant="secondary" className="bg-black text-white">
                      Estimated Delivery: {new Date(shipping.estimatedDeliveryDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="pt-6">
                {items.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-4 py-4 border-b last:border-0">
                    <img
                      src={item.product.images[0]?.url || "/placeholder.svg"}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">#{item.product._id.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{item.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Price Breakdown */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span>₦{shipping.fee.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>{order.paymentInfo.status}</span>
                    <span>₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-4">
                      {timeline.map((activity, index) => (
                        <div key={index} className="relative pl-8">
                          <div className="absolute left-0 w-8 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          </div>
                          <div className="text-sm">
                            <div className="font-semibold">{activity.status}</div>
                            <div className="text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    {notes.length === 0 ? (
                      <p className="text-gray-500">No notes yet</p>
                    ) : (
                      notes.map((note, index) => (
                        <div key={index} className="bg-[#E6F5EB] p-3 rounded-lg">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Note added on {new Date(note.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{buyer.firstName[0]}{buyer.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{`${buyer.firstName} ${buyer.lastName}`}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div>{buyer.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div>{buyer.phoneNumber}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {`${shipping.address.line1}, ${shipping.address.line2 ? shipping.address.line2 + ', ' : ''}${shipping.address.city}, ${shipping.address.state}, ${shipping.address.country}`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

