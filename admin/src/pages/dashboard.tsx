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
import { useEffect, useState } from "react";
import { api } from "@/api/axios";

// Add interfaces for the API data
interface DashboardSeller {
  _id: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isVerified: boolean;
  isFeatured: boolean;
  walletBalance: number;
  storeVisits: number;
}

interface DashboardBuyer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isIdentityVerified: boolean;
}

interface DashboardOrder {
  _id: string;
  buyer: {
    firstName: string;
    lastName: string;
  };
  items: {
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentInfo: {
    status: string;
  };
  createdAt: string;
}

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
    const [sellers, setSellers] = useState<DashboardSeller[]>([]);
    const [buyers, setBuyers] = useState<DashboardBuyer[]>([]);
    const [orders, setOrders] = useState<DashboardOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Sample data for categories
    const topCategories = [
      {
        name: "Electronics",
        orders: 2345,
        revenue: "₦1,234,567",
        growth: 25.8
      },
      {
        name: "Fashion",
        orders: 1456,
        revenue: "₦987,654",
        growth: -12.4
      },
      {
        name: "Home & Garden",
        orders: 1123,
        revenue: "₦654,321",
        growth: 15.3
      },
      {
        name: "Beauty",
        orders: 987,
        revenue: "₦456,789",
        growth: 8.7
      }
    ];

    // Sample data for products
    const topProducts = [
      {
        name: "Wireless Earbuds",
        category: "Electronics",
        revenue: "₦456,789",
        growth: 12.5
      },
      {
        name: "Designer Watch",
        category: "Fashion",
        revenue: "₦345,678",
        growth: -5.8
      },
      {
        name: "Smart Speaker",
        category: "Electronics",
        revenue: "₦234,567",
        growth: 8.3
      },
      {
        name: "Running Shoes",
        category: "Fashion",
        revenue: "₦123,456",
        growth: 15.7
      }
    ];

    // Sample data for streaming sellers
    const topStreamingSellers = [
      {
        name: "TechHub Store",
        totalStreams: 156,
        totalViewers: 23456,
        revenue: "₦567,890"
      },
      {
        name: "Fashion Forward",
        totalStreams: 123,
        totalViewers: 18234,
        revenue: "₦456,789"
      },
      {
        name: "Beauty Box",
        totalStreams: 98,
        totalViewers: 15678,
        revenue: "₦345,678"
      },
      {
        name: "Home Essentials",
        totalStreams: 87,
        totalViewers: 12345,
        revenue: "₦234,567"
      }
    ];

    // Sample data for top buyers
    const topBuyers = [
      {
        name: "John Smith",
        orders: 45,
        spent: "₦789,123",
        status: "VIP"
      },
      {
        name: "Sarah Johnson",
        orders: 38,
        spent: "₦567,890",
        status: "Regular"
      },
      {
        name: "Michael Brown",
        orders: 32,
        spent: "₦456,789",
        status: "VIP"
      },
      {
        name: "Emma Wilson",
        orders: 28,
        spent: "₦345,678",
        status: "Regular"
      }
    ];

    // Sample data for withdrawal requests
    const withdrawalRequests = [
      {
        seller: "TechHub Store",
        amount: "₦234,567",
        requestDate: "2024-03-15",
        status: "Processing"
      },
      {
        seller: "Fashion Forward",
        amount: "₦123,456",
        requestDate: "2024-03-14",
        status: "Pending"
      },
      {
        seller: "Beauty Box",
        amount: "₦98,765",
        requestDate: "2024-03-13",
        status: "Processing"
      },
      {
        seller: "Home Essentials",
        amount: "₦87,654",
        requestDate: "2024-03-12",
        status: "Pending"
      }
    ];

    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const [sellersRes, buyersRes, ordersRes] = await Promise.all([
            api.get("/api/admin/sellers"),
            api.get("/api/admin/users"),
            api.get("/api/admin/orders?page=1&limit=5")
          ]);

          setSellers(sellersRes.data);
          setBuyers(buyersRes.data);
          setOrders(ordersRes.data.orders);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, []);

    // Calculate total revenue from orders
    const totalRevenue = orders
      .filter(order => order.paymentInfo?.status === 'paid')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Get recent orders from the API data
    const recentOrdersFromAPI = orders.map(order => ({
      id: order._id,
      customer: `${order.buyer.firstName} ${order.buyer.lastName}`,
      seller: order.items[0]?.product?.name || "N/A",
      product: order.items[0]?.product?.name || "N/A",
      amount: `₦${order.totalAmount.toLocaleString()}`,
      status: order.paymentInfo.status,
      date: new Date(order.createdAt).toISOString().split('T')[0]
    }));

    // Get top sellers from the API data
    const topSellersFromAPI = sellers
      .slice(0, 3)
      .map(seller => ({
        name: seller.businessName || `${seller.firstName} ${seller.lastName}`,
        orders: 0, // This data isn't available from the API
        revenue: `₦${seller.walletBalance.toLocaleString()}`,
        products: 0, // This data isn't available from the API
        rating: 0 // This data isn't available from the API
      }));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Hi {user?.username}</h2>
          <p className="text-muted-foreground">
            Here's what's happening across Auqli today
          </p>
        </div>
  
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={`₦${totalRevenue.toLocaleString()}`}
            change={20.1}
            icon={DollarSign}
          />
          <StatCard
            title="Active Sellers"
            value={sellers.length.toString()}
            change={5.8}
            icon={Store}
          />
          <StatCard
            title="Total Orders"
            value={orders.length.toString()}
            change={-5.2}
            icon={ShoppingCart}
          />
          <StatCard
            title="Active Buyers"
            value={buyers.length.toString()}
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
              {recentOrdersFromAPI.map((order) => (
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
                {topSellersFromAPI.map((seller) => (
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