import { 
    Users, 
    ShoppingCart, 
    DollarSign, 
    ArrowUp, 
    ArrowDown,
    ArrowUpRight,
    Store,
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
      seller: "TechStore",
      product: "Gaming Laptop",
      amount: "₦599,999",
      status: "Completed",
      date: "2024-03-15",
    },
    {
      id: "ORD002", 
      customer: "Jane Smith",
      seller: "MobileWorld",
      product: "iPhone 15",
      amount: "₦899,999",
      status: "Processing",
      date: "2024-03-14",
    },
    {
      id: "ORD003",
      customer: "Bob Johnson",
      seller: "AudioHub",
      product: "Sony WH-1000XM4",
      amount: "₦199,999",
      status: "Pending",
      date: "2024-03-14",
    },
    {
      id: "ORD004",
      customer: "Alice Brown",
      seller: "WearableTech",
      product: "Apple Watch",
      amount: "₦299,999",
      status: "Completed",
      date: "2024-03-13",
    },
  ];

  // Static data for top sellers
  const topSellers = [
    {
      name: "TechStore",
      orders: 245,
      revenue: "₦12,500,000",
      products: 89,
      rating: 4.8
    },
    {
      name: "MobileWorld",
      orders: 198,
      revenue: "₦9,800,000",
      products: 45,
      rating: 4.6
    },
    {
      name: "FashionHub",
      orders: 156,
      revenue: "₦5,400,000",
      products: 234,
      rating: 4.7
    }
  ];

  // Static data for withdrawal requests
  const withdrawalRequests = [
    {
      seller: "TechStore",
      amount: "₦5,500,000",
      requestDate: "2024-03-15",
      status: "Pending",
      accountDetails: "GTBank ****4589"
    },
    {
      seller: "MobileWorld", 
      amount: "₦3,200,000",
      requestDate: "2024-03-15",
      status: "Processing",
      accountDetails: "FirstBank ****7823"
    },
    {
      seller: "FashionHub",
      amount: "₦2,800,000", 
      requestDate: "2024-03-14",
      status: "Pending",
      accountDetails: "UBA ****1234"
    }
  ];

  // Static data for top streaming sellers
  const topStreamingSellers = [
    {
      name: "TechStore Live",
      totalStreams: 156,
      totalViewers: 25600,
      interactions: 45800,
      avgStreamDuration: "2.5 hrs",
      lastStream: "2024-03-15",
      revenue: "₦8,500,000"
    },
    {
      name: "FashionHub Stream",
      totalStreams: 142,
      totalViewers: 18900,
      interactions: 32400,
      avgStreamDuration: "1.8 hrs", 
      lastStream: "2024-03-15",
      revenue: "₦6,200,000"
    },
    {
      name: "BeautyStream",
      totalStreams: 128,
      totalViewers: 15600,
      interactions: 28900,
      avgStreamDuration: "2.1 hrs",
      lastStream: "2024-03-14", 
      revenue: "₦4,800,000"
    }
  ];
  
  // Static data for top products
  const topProducts = [
    {
      name: "iPhone 15",
      category: "Electronics",
      sales: 145,
      revenue: "₦13,050,000",
      growth: 23.5,
      seller: "MobileWorld"
    },
    {
      name: "Nike Air Max",
      category: "Fashion",
      sales: 132,
      revenue: "₦6,600,000",
      growth: 18.2,
      seller: "FashionHub"
    },
    {
      name: "PS5",
      category: "Gaming",
      sales: 97,
      revenue: "₦48,500,000",
      growth: -5.8,
      seller: "TechStore"
    }
  ];

  // Static data for top categories
  const topCategories = [
    {
      name: "Electronics",
      orders: 856,
      revenue: "₦45,500,000",
      sellers: 25,
      growth: 15.4
    },
    {
      name: "Fashion",
      orders: 654,
      revenue: "₦12,800,000", 
      sellers: 48,
      growth: 22.1
    },
    {
      name: "Home & Living",
      orders: 432,
      revenue: "₦8,900,000",
      sellers: 18,
      growth: 9.8
    }
  ];

  // Static data for top buyers
  const topBuyers = [
    {
      name: "John Doe",
      orders: 45,
      spent: "₦2,850,000",
      lastPurchase: "2024-03-15",
      status: "VIP"
    },
    {
      name: "Sarah Wilson",
      orders: 38,
      spent: "₦1,950,000",
      lastPurchase: "2024-03-14",
      status: "Regular"
    },
    {
      name: "Mike Chang",
      orders: 32,
      spent: "₦1,680,000",
      lastPurchase: "2024-03-13",
      status: "VIP"
    }
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
            Here's what's happening across your platform today
          </p>
        </div>
  
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="₦45,231,890"
            change={20.1}
            icon={DollarSign}
          />
          <StatCard
            title="Active Sellers"
            value="156"
            change={5.8}
            icon={Store}
          />
          <StatCard
            title="Total Orders"
            value="1,789"
            change={-5.2}
            icon={ShoppingCart}
          />
          <StatCard
            title="Active Buyers"
            value="12,456"
            change={15.3}
            icon={Users}
          />
        </div>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Recent Orders</h3>
            <Button variant="outline">View All Orders</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.seller}</TableCell>
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

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Top Sellers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Top Performing Sellers</h3>
              <Button variant="outline">View All</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellers.map((seller) => (
                  <TableRow key={seller.name}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.orders}</TableCell>
                    <TableCell>{seller.revenue}</TableCell>
                    <TableCell>
                      <span className="flex items-center text-yellow-500">
                        {seller.rating} ★
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Top Categories */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Top Categories</h3>
              <Button variant="outline">View Report</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCategories.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.orders}</TableCell>
                    <TableCell>{category.revenue}</TableCell>
                    <TableCell>
                      <div className={`flex items-center ${
                        category.growth > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {category.growth > 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(category.growth)}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Top Products */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Top Selling Products</h3>
              <Button variant="outline">View All</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
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

          {/* Top Streaming Sellers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Top Live Streamers</h3>
              <Button variant="outline">View All</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Streamer</TableHead>
                  <TableHead>Total Streams</TableHead>
                  <TableHead>Total Viewers</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStreamingSellers.map((streamer) => (
                  <TableRow key={streamer.name}>
                    <TableCell className="font-medium">{streamer.name}</TableCell>
                    <TableCell>{streamer.totalStreams}</TableCell>
                    <TableCell>{streamer.totalViewers.toLocaleString()}</TableCell>
                    <TableCell>{streamer.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Top Buyers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Top Buyers</h3>
              <Button variant="outline">View All</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topBuyers.map((buyer) => (
                  <TableRow key={buyer.name}>
                    <TableCell className="font-medium">{buyer.name}</TableCell>
                    <TableCell>{buyer.orders}</TableCell>
                    <TableCell>{buyer.spent}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        buyer.status === 'VIP' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {buyer.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Withdrawal Requests */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Withdrawal Requests</h3>
              <Button variant="outline">View All</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalRequests.map((request) => (
                  <TableRow key={request.seller}>
                    <TableCell className="font-medium">{request.seller}</TableCell>
                    <TableCell>{request.amount}</TableCell>
                    <TableCell>{request.requestDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'Processing' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    );
  }
  
  export default Dashboard;