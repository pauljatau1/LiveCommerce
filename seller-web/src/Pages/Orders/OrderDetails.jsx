import { Check, ChevronDown, Send } from 'lucide-react'
import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import SearchBar from '@/Components/ui/DashboardHomepageUi/SearchBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function OrderDetails() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
                  <h1 className="text-2xl font-bold">#8373648</h1>
                  <Badge variant="secondary" className="bg-black text-white">
                    Paid
                  </Badge>
                  <Badge variant="secondary" className="bg-black text-white">
                    <Check className="mr-1 h-4 w-4" />
                    Delivered
                  </Badge>
                </div>
                <p className="text-gray-600">
                  Placed via live show on 11 October, 2025 at 9:45pm
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
              <CardTitle>Tracking Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600">EBDF-HFG5-VIN8</span>
                  <Badge variant="secondary" className="bg-black text-white">
                    <Check className="mr-1 h-4 w-4" />
                    Delivered
                  </Badge>
                </div>
                <p className="text-gray-600">Delivered On Wednesday 4, 2024</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardContent className="pt-6">
              {[1, 2].map((item) => (
                <div key={item} className="flex items-center gap-4 py-4 border-b last:border-0">
                  <img
                    src="/placeholder.svg"
                    alt="Turtleneck Polo"
                    width={80}
                    height={80}
                    className="rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">Turtleneck Polo Long Sleeve</h3>
                    <p className="text-sm text-gray-600">#874847</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦10,000</p>
                    <p className="text-sm text-gray-600">x15</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦150,000</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="flex-1">
                  Cancel Order
                </Button>
                <Button variant="outline" className="flex-1">
                  Create Shipping Label
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦150,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <div className="text-right">
                    <div>INFLUENCER</div>
                    <div>₦100,000</div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>VAT</span>
                  <span>₦100,000</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₦100,000</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>₦70,000</span>
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
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="relative pl-8">
                        <div className="absolute left-0 w-8 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        </div>
                        <div className="text-sm">
                          <div className="font-semibold">This Customer Started a Conversation With You</div>
                          <div className="text-gray-500">Oct 22</div>
                          <div className="text-gray-500 mt-1">
                            The seller has prepared your order and is sending to dispatch company
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4">
                  <div className="relative">
                    <Input
                      placeholder="Leave A Comment..."
                      className="pr-10"
                    />
                    <Button
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                  <div className="bg-[#E6F5EB] p-3 rounded-lg">
                    <p className="text-sm">
                      Hey man, Please inform me when ever the package gets to your destination.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Note added on 4/24/2024</p>
                  </div>
                  <div className="bg-[#E6F5EB] p-3 rounded-lg">
                    <p className="text-sm">
                      Hi Mr. Obinna, Note that no good already bought can be returned.
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <div className="mt-4">
                <div className="relative">
                  <Input
                    placeholder="Write a note..."
                    className="pr-20"
                  />
                  <Button
                    className="absolute right-0 top-0 h-full"
                  >
                    Add Note
                  </Button>
                </div>
              </div>
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
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>EC</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Ewerem Chigozie</div>
                    <div className="text-sm text-gray-500">10 Orders</div>
                  </div>
                </div>
                <div className="text-sm">Customer Is Tax-Exempted</div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div>Ewer***********@gmail.com</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div>+234*******775</div>
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
                Flat CR-07, Castle Rock Apartments, beside Daily Trust by Chida Hotel, Abuja, Nigeria
              </p>
            </CardContent>
          </Card>

          {/* Conversion Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Customer Follows You And Came In And Liked One Of Your Products, On Your Live Stream.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}

