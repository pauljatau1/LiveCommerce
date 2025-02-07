import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, FilterIcon } from "lucide-react"
import { BASE_URL } from "@/Constants/Server"
import { useOutletContext, useNavigate } from "react-router-dom"

export default function ReturnsDashboard() {
    const { setHeaderName, setNavName } = useOutletContext()
    const navigate = useNavigate()
    const [returns, setReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalReturns: 0,
        inProgress: 0,
        completed: 0,
        disputed: 0,
        averageResolutionTime: 0,
        totalValue: 0,
        returnRate: 0,
        commonReasons: {},
        resolutionBreakdown: {}
    })
    const [currentStatus, setCurrentStatus] = useState('all-status')
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    useEffect(() => {
        setHeaderName("Returns")
        setNavName("")
        fetchReturns()
        fetchReturnStats()
    }, [currentStatus, page])

    const fetchReturns = async () => {
        try {
            const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
            const queryParams = new URLSearchParams({
                page,
                limit,
                ...(currentStatus !== 'all-status' && { status: currentStatus.toUpperCase() })
            })

            const response = await fetch(`${BASE_URL}/returns/seller?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${sellerToken}`
                }
            })
            const data = await response.json()
            
            setReturns(data.returns)
            setTotalPages(data.pagination.pages)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching returns:", error)
            setLoading(false)
        }
    }

    const fetchReturnStats = async () => {
        try {
            const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
            const response = await fetch(`${BASE_URL}/returns/seller/statistics`, {
                headers: {
                    Authorization: `Bearer ${sellerToken}`
                }
            })
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error("Error fetching return statistics:", error)
        }
    }

    const handleStatusChange = (status) => {
        setCurrentStatus(status)
        setPage(1)
    }

    const handleReturnAction = async (returnId, action, message = '') => {
        if (action === 'view') {
            navigate(`/dashboard/return/${returnId}`)
            return
        }

        try {
            const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
            const response = await fetch(`${BASE_URL}/returns/${returnId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sellerToken}`
                },
                body: JSON.stringify({ action, message })
            })
            
            if (response.ok) {
                fetchReturns()
                fetchReturnStats()
            }
        } catch (error) {
            console.error("Error handling return action:", error)
        }
    }

    return (
        <div className="space-y-6 p-6">
            {/* Primary Metrics */}
            {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">New Return Requests</div>
                    <div className="text-2xl font-bold mt-1">{stats.totalReturns}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Returns in Progress</div>
                    <div className="text-2xl font-bold mt-1">{stats.inProgress}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Completed Requests</div>
                    <div className="text-2xl font-bold mt-1">{stats.completed}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Disputed Returns</div>
                    <div className="text-2xl font-bold mt-1">{stats.disputed}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Average Return Resolution Time</div>
                    <div className="text-2xl font-bold mt-1">{stats.averageResolutionTime} days</div>
                </Card>
            </div> */}

            {/* Secondary Metrics */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Value of Returns</div>
                            <div className="text-xl font-bold">₦ {stats.totalValue.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Return Rate</div>
                    <div className="text-xl font-bold">{stats.returnRate.toFixed(2)}%</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Most common Return Reason</div>
                    <div className="text-xl font-bold">{Object.entries(stats.commonReasons).sort((a, b) => b[1] - a[1])[0][0]}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Returns Resolution Breakdown</div>
                    <div className="text-xl font-bold">{stats.resolutionBreakdown.refund.toFixed(2)}% Refund, {stats.resolutionBreakdown.replacement.toFixed(2)}% Replacement</div>
                </Card>
            </div> */}

            {/* Status Tabs */}
            <Tabs value={currentStatus} onValueChange={handleStatusChange} className="w-full">
                <TabsList>
                    <TabsTrigger value="all-status">All Status</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="in-transit">In Transit</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Table Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Returns Table</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Filtering by date
                    </Button>
                    <Button variant="outline" size="sm">
                        <FilterIcon className="w-4 h-4 mr-2" />
                        Return Reason
                    </Button>
                </div>
            </div>

            {/* Returns Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>RETURN ID</TableHead>
                            <TableHead>ORDER ID</TableHead>
                            <TableHead>BUYER NAME</TableHead>
                            <TableHead>RETURN REASON</TableHead>
                            <TableHead>RETURN STATUS</TableHead>
                            <TableHead>ACTION</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {returns.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell>{item._id}</TableCell>
                                <TableCell>{item.order.order_id}</TableCell>
                                <TableCell>{`${item.buyer.firstName} ${item.buyer.lastName}`}</TableCell>
                                <TableCell>{item.items[0]?.reason}</TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            item.status === "PENDING"
                                                ? "bg-yellow-50 text-yellow-600 border-yellow-600"
                                                : item.status === "APPROVED"
                                                    ? "bg-green-50 text-green-600 border-green-600"
                                                    : "bg-orange-50 text-orange-600 border-orange-600"
                                        }
                                    >
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    
                                    <Button 
                                        variant="link" 
                                        className="text-blue-600"
                                        onClick={() => handleReturnAction(item._id, 'view')}
                                    >
                                        View Details
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="p-4 border-t">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {returns.length} items out of {stats.totalReturns} results found
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 rounded-full"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                            >
                                <span className="sr-only">Previous page</span>←
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 rounded-full"
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                            >
                                <span className="sr-only">Next page</span>→
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

