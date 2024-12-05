import React from 'react'
import { 
  ShoppingCart,
  Package,
  ArrowUpRight,
  Eye,
  Download
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Sample orders data
const orders = [
  {
    id: "ORD001",
    customer: "John Doe",
    product: "Gaming Laptop",
    amount: "$1,299.99",
    status: "Completed",
    date: "2024-03-15",
    items: 1,
    shipping: "Express"
  },
  {
    id: "ORD002", 
    customer: "Jane Smith",
    product: "Smartphone",
    amount: "$899.99", 
    status: "Processing",
    date: "2024-03-14",
    items: 2,
    shipping: "Standard"
  },
  {
    id: "ORD003",
    customer: "Bob Johnson",
    product: "Headphones",
    amount: "$199.99",
    status: "Pending",
    date: "2024-03-14", 
    items: 1,
    shipping: "Standard"
  },
  {
    id: "ORD004",
    customer: "Alice Brown", 
    product: "Smart Watch",
    amount: "$299.99",
    status: "Completed",
    date: "2024-03-13",
    items: 3,
    shipping: "Express"
  },
]

function Orders() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Orders</h2>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-primary">
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Orders</p>
              <h3 className="text-2xl font-bold">1,789</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pending Orders</p>
              <h3 className="text-2xl font-bold">23</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold">$45,231.89</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>{order.shipping}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'Completed' 
                      ? 'bg-green-100 text-green-800' 
                      : order.status === 'Processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export default Orders
