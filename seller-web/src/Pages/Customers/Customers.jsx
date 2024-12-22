import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import SideBarNav from "@/Components/ui/DashboardHomepageUi/SideBarNav"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Sample customer data
const customers = [
  {
    id: 1,
    name: "Obinna Eze",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Lagos, Nigeria",
    orders: 2,
    amount: "₦12,000"
  },
  {
    id: 2,
    name: "Denilson Igwe",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria", 
    orders: 7,
    amount: "₦12,000"
  },
  {
    id: 3,
    name: "Victoria Chiamaka",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Enugu Nigeria",
    orders: 5,
    amount: "₦12,000"
  },
  {
    id: 4,
    name: "Ibe Williams",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria",
    orders: 12,
    amount: "₦12,000"
  },
  {
    id: 5,
    name: "Chidi Nwaka",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria",
    orders: 5,
    amount: "₦12,000"
  },
  {
    id: 6,
    name: "Timisola Samtope",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria",
    orders: 8,
    amount: "₦12,000"
  },
  {
    id: 7,
    name: "Ugwu David",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria",
    orders: 10,
    amount: "₦12,000"
  },
  {
    id: 8,
    name: "Nwazue Obi",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria",
    orders: 2,
    amount: "₦12,000"
  },
  {
    id: 9,
    name: "Adanna Chjioke",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Abuja, Nigeria",
    orders: 1,
    amount: "₦12,000"
  }
]

function Customers() {
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
          {/* Content area */}
          <div className="w-full rounded-xl">
            <Table className="rounded-xl">
              <TableHeader className="rounded-t-xl">
                <TableRow className="bg-green-700 hover:bg-green-500/90">
                  <TableHead className="text-white">Customer Name</TableHead>
                  <TableHead className="text-white">Location</TableHead>
                  <TableHead className="text-white">Orders</TableHead>
                  <TableHead className="text-white">Amount spent</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="bg-[#F0F5F2] hover:bg-green-200">
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="bg-white">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback>{customer.name[0]}</AvatarFallback>
                      </Avatar>
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.location}</TableCell>
                    <TableCell>{customer.orders} Orders</TableCell>
                    <TableCell>{customer.amount}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Customers
