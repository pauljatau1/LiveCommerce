import { 
    Users, 
    ShoppingCart, 
    DollarSign, 
    Package, 
    ArrowUp, 
    ArrowDown,
    ArrowUpRight
  } from "lucide-react";
  import { Card } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { useAuth } from "@/context/authContext";
  
  // Static data for recent orders
  const recentOrders = [
    {
      id: "ORD001",
      customer: "John Doe",
      product: "Gaming Laptop",
      amount: "$1,299.99",
      status: "Completed",
      date: "2024-03-15",
    },
    {
      id: "ORD002",
      customer: "Jane Smith",
      product: "Smartphone",
      amount: "$899.99",
      status: "Processing",
      date: "2024-03-14",
    },
    {
      id: "ORD003",
      customer: "Bob Johnson",
      product: "Headphones",
      amount: "$199.99",
      status: "Pending",
      date: "2024-03-14",
    },
    {
      id: "ORD004",
      customer: "Alice Brown",
      product: "Smart Watch",
      amount: "$299.99",
      status: "Completed",
      date: "2024-03-13",
    },
  ];
  
  // Static data for top selling products
  const topProducts = [
    {
      name: "Gaming Laptop",
      sales: 145,
      revenue: "$188,500",
      growth: 23.5,
    },
    {
      name: "Smartphone",
      sales: 132,
      revenue: "$118,800",
      growth: 18.2,
    },
    {
      name: "Headphones",
      sales: 97,
      revenue: "$19,400",
      growth: -5.8,
    },
    {
      name: "Smart Watch",
      sales: 85,
      revenue: "$25,500",
      growth: 12.4,
    },
  ];
  
  function StatCard({ 
    title, 
    value, 
    change, 
    icon: Icon 
  }: { 
    title: string; 
    value: string; 
    change: number; 
    icon: React.ComponentType | React.ElementType; 
  }) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className={`flex items-center space-x-1 text-sm ${
            change > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {change > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
      </Card>
    );
  }
  
  function Dashboard() {
    const { user } = useAuth();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Hi {user?.username}</h2>
          <p className="text-muted-foreground">
            Welcome to your dashboard
          </p>
        </div>
  
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="$45,231.89"
            change={20.1}
            icon={DollarSign}
          />
          <StatCard
            title="New Customers"
            value="2,350"
            change={10.5}
            icon={Users}
          />
          <StatCard
            title="Total Orders"
            value="1,789"
            change={-5.2}
            icon={ShoppingCart}
          />
          <StatCard
            title="Products Sold"
            value="2,456"
            change={15.3}
            icon={Package}
          />
        </div>
  
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Recent Orders</h3>
            <Button variant="outline">View All</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.amount}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
  
        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Top Selling Products</h3>
            <Button variant="outline">Download Report</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product) => (
                <TableRow key={product.name}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sales}</TableCell>
                  <TableCell>{product.revenue}</TableCell>
                  <TableCell>
                    <div className={`flex items-center ${
                      product.growth > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {product.growth > 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(product.growth)}%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }
  
  export default Dashboard;