import { 
  RefreshCcw,
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
import { useEffect, useState, useMemo } from "react"
import { api } from "@/api/axios"
import { Link } from "react-router-dom"

// Update TypeScript interfaces
interface Return {
  _id: string
  order: {
    order_id: string
    createdAt: string
  }
  buyer: {
    firstName: string
    lastName: string
  }
  items: {
    product: {
      name: string
      price: number
    }
    quantity: number
    reason: string
  }[]
  status: string
  description: string
  requestDate: string
  refundDetails?: {
    amount: number
    processedAt: string
  }
}

interface ReturnsResponse {
  returns: Return[]
  pagination: {
    total: number
    pages: number
    page: number
    limit: number
  }
}

interface ReturnStatistics {
  statistics: {
    byStatus: {
      _id: string
      count: number
      totalRefundAmount: number
    }[]
    topReasons: {
      _id: string
      count: number
    }[]
    timeframe: string
  }
}

function Returns() {
  const [returnsData, setReturnsData] = useState<ReturnsResponse | null>(null)
  const [statistics, setStatistics] = useState<ReturnStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  // Calculate total refund amount using useMemo
  const totalRefundAmount = useMemo(() => {
    return statistics?.statistics.byStatus
      .reduce((sum, status) => sum + (status.totalRefundAmount || 0), 0) || 0
  }, [statistics])

  // Calculate pending returns count using useMemo
  const pendingReturns = useMemo(() => {
    return statistics?.statistics.byStatus
      .find(status => status._id === 'PENDING_SELLER_REVIEW')?.count || 0
  }, [statistics])

  // Calculate total returns
  const totalReturns = useMemo(() => {
    return returnsData?.pagination.total || 0
  }, [returnsData])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [returnsResponse, statsResponse] = await Promise.all([
          api.get('/api/returns/admin/all'),
          api.get('/api/returns/admin/statistics')
        ])
        setReturnsData(returnsResponse.data)
        setStatistics(statsResponse.data)
      } catch (error) {
        console.error('Error fetching returns data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper function to get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'REFUNDED':
        return 'bg-green-100 text-green-700'
      case 'PENDING_SELLER_REVIEW':
        return 'bg-yellow-100 text-yellow-700'
      case 'REJECTED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'REFUNDED':
        return 'bg-green-600'
      case 'PENDING_SELLER_REVIEW':
        return 'bg-yellow-600'
      case 'REJECTED':
        return 'bg-red-600'
      default:
        return 'bg-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Returns</h2>
          <p className="text-muted-foreground">Manage and track product returns</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Return Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <RefreshCcw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Returns</p>
              <h3 className="text-2xl font-bold">{totalReturns}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pending Returns</p>
              <h3 className="text-2xl font-bold">{pendingReturns}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Refunds</p>
              <h3 className="text-2xl font-bold">₦{totalRefundAmount.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Returns Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : returnsData?.returns && returnsData.returns.length > 0 ? (
              returnsData.returns.map((returnItem) => (
                <TableRow key={returnItem._id}>
                  <TableCell className="font-medium">{returnItem._id}</TableCell>
                  <TableCell>{returnItem.order.order_id}</TableCell>
                  <TableCell>
                    {returnItem.buyer.firstName} {returnItem.buyer.lastName}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(returnItem.status)}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${getStatusDot(returnItem.status)}`} />
                      {returnItem.status.replace(/_/g, ' ')}
                    </div>
                  </TableCell>
                  <TableCell>{returnItem.items.map(item => item.product.name).join(', ')}</TableCell>
                  <TableCell>
                    {new Date(returnItem.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link to={`/dashboard/return-detail/${returnItem._id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No returns found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export default Returns
