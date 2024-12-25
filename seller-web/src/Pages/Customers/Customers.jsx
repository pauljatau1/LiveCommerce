import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { Button } from "@/Components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { Link } from "react-router-dom" // Import Link from react-router-dom

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
    <>
      {/* Search Bar */}
      <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="">
        {/* Content area */}
        <div className="w-full rounded-xl overflow-hidden">
          <Table className="rounded-xl">
            <TableHeader className="rounded-t-xl">
              <TableRow className="bg-green-700 hover:bg-green-500/90 rounded-t-xl">
                <TableHead className="text-white rounded-tl-xl">Customer Name</TableHead>
                <TableHead className="text-white">Location</TableHead>
                <TableHead className="text-white">Orders</TableHead>
                <TableHead className="text-white">Amount spent</TableHead>
                <TableHead className="text-white rounded-tr-xl">Actions</TableHead>
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
                    <Link to="/dashboard/customer">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}

export default Customers
