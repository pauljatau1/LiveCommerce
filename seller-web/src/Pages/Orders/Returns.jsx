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
    const [availableStatuses, setAvailableStatuses] = useState(new Set())

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
            
            // Extract unique statuses from the returns data
            const statuses = new Set(['all-status', ...data.returns.map(item => 
                item.status.toLowerCase()
            )])
            setAvailableStatuses(statuses)
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
           
            <Tabs value={currentStatus} onValueChange={handleStatusChange} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {[
                        { value: 'all-status', label: 'All Status' },
                        { value: 'pending_seller_review', label: 'Pending Review' },
                        { value: 'need_more_info', label: 'Need Info' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                        { value: 'in_transit', label: 'In Transit' },
                        { value: 'received', label: 'Received' },
                        { value: 'refunded', label: 'Refunded' },
                        { value: 'closed', label: 'Closed' },
                        { value: 'disputed', label: 'Disputed' },
                        { value: 'resolved', label: 'Resolved' }
                    ].filter(status => availableStatuses.has(status.value)).map(status => (
                        <TabsTrigger key={status.value} value={status.value}>
                            {status.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Table Header */}
            <div className="flex items-center justify-between">
                {/* <h2 className="text-xl font-semibold">Returns Table</h2> */}
                {/* <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Filtering by date
                    </Button>
                    <Button variant="outline" size="sm">
                        <FilterIcon className="w-4 h-4 mr-2" />
                        Return Reason
                    </Button>
                </div> */}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && returns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <svg
                            className="w-12 h-12 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Returns Found</h3>
                    <p className="text-muted-foreground max-w-sm">
                        There are currently no return requests for this status. New returns will appear here when customers initiate them.
                    </p>
                </div>
            )}

            {/* Returns Table - Only show when not loading and has returns */}
            {!loading && returns.length > 0 && (
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
                                                item.status === "PENDING_SELLER_REVIEW"
                                                    ? "bg-blue-50 text-blue-600 border-blue-600"
                                                    : item.status === "NEED_MORE_INFO"
                                                    ? "bg-purple-50 text-purple-600 border-purple-600"
                                                    : item.status === "APPROVED"
                                                    ? "bg-green-50 text-green-600 border-green-600"
                                                    : item.status === "REJECTED"
                                                    ? "bg-red-50 text-red-600 border-red-600"
                                                    : item.status === "IN_TRANSIT"
                                                    ? "bg-yellow-50 text-yellow-600 border-yellow-600"
                                                    : item.status === "RECEIVED"
                                                    ? "bg-cyan-50 text-cyan-600 border-cyan-600"
                                                    : item.status === "REFUNDED"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-600"
                                                    : item.status === "CLOSED"
                                                    ? "bg-gray-50 text-gray-600 border-gray-600"
                                                    : item.status === "DISPUTED"
                                                    ? "bg-orange-50 text-orange-600 border-orange-600"
                                                    : "bg-teal-50 text-teal-600 border-teal-600" // for RESOLVED
                                            }
                                        >
                                            {item.status.replace(/_/g, ' ')}
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
            )}
        </div>
    )
}

