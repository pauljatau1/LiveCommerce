import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table"
import { Button } from "@/Components/ui/button"
import { useState, useEffect } from "react"
import { Card } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { ChevronRight, Package, AlertTriangle } from "lucide-react"
import { BASE_URL } from "@/Constants/Server"
import { useOutletContext, useNavigate } from "react-router-dom"
import { tokenUtils } from "@/util/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"

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
            const sellerToken = tokenUtils.getBearerToken()
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
            const statuses = new Set(['all-status', ...data.returns?.map(item => 
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
            const sellerToken = tokenUtils.getBearerToken()
            const response = await fetch(`${BASE_URL}/returns/statistics`, {
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
            const sellerToken = tokenUtils.getBearerToken()
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

    const getStatusBadgeStyles = (status) => {
        return status === "PENDING_SELLER_REVIEW"
            ? "bg-blue-50 text-blue-600 border-blue-600 whitespace-nowrap"
            : status === "NEED_MORE_INFO"
            ? "bg-purple-50 text-purple-600 border-purple-600 whitespace-nowrap"
            : status === "APPROVED"
            ? "bg-green-50 text-green-600 border-green-600 whitespace-nowrap"
            : status === "REJECTED"
            ? "bg-red-50 text-red-600 border-red-600 whitespace-nowrap"
            : status === "IN_TRANSIT"
            ? "bg-yellow-50 text-yellow-600 border-yellow-600 whitespace-nowrap"
            : status === "RECEIVED"
            ? "bg-cyan-50 text-cyan-600 border-cyan-600 whitespace-nowrap"
            : status === "REFUNDED"
            ? "bg-emerald-50 text-emerald-600 border-emerald-600 whitespace-nowrap"
            : status === "CLOSED"
            ? "bg-gray-50 text-gray-600 border-gray-600 whitespace-nowrap"
            : status === "DISPUTED"
            ? "bg-orange-50 text-orange-600 border-orange-600 whitespace-nowrap"
            : "bg-teal-50 text-teal-600 whitespace-nowrap"; // for RESOLVED
    };

    return (
        <div className="space-y-6 p-3 sm:p-6">
            {/* Desktop Tabs */}
            <div className="hidden sm:block">
                <Tabs value={currentStatus} onValueChange={handleStatusChange} className="w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
            </div>

            {/* Mobile Status Dropdown */}
            <div className="sm:hidden">
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent >
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
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && returns?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <Package className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No Returns Found</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                        There are currently no return requests for this status. New returns will appear here when customers initiate them.
                    </p>
                </div>
            )}

            {/* Desktop Returns Table - Only show on larger screens */}
            {!loading && returns?.length > 0 && (
                <>
                    <div className="hidden sm:block border rounded-lg">
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
                                {returns?.map((item) => (
                                    <TableRow key={item?._id}>
                                        <TableCell>{item?._id}</TableCell>
                                        <TableCell>{item?.order?.order_id}</TableCell>
                                        <TableCell>{`${item?.buyer?.firstName} ${item?.buyer?.lastName}`}</TableCell>
                                        <TableCell>{item?.items[0]?.reason}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusBadgeStyles(item.status)}>
                                                {item?.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="link" 
                                                className="text-blue-600"
                                                onClick={() => handleReturnAction(item?._id, 'view')}
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Desktop Pagination */}
                        <div className="p-4 border-t">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    Showing {returns?.length} items out of {stats?.totalReturns} results found
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

                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-4">
                        {returns?.map((item) => (
                            <Card key={item._id} className="overflow-hidden">
                                <div className="p-4 space-y-3">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500">Return ID</p>
                                            <p className="text-sm font-medium font-mono">{item._id.slice(-8)}</p>
                                        </div>
                                        <Badge className={`${getStatusBadgeStyles(item.status)} text-xs`}>
                                            {item.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    
                                    {/* Order Info */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Order ID</p>
                                                <p className="text-sm font-medium">{item?.order?.order_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Buyer</p>
                                                <p className="text-sm font-medium truncate">
                                                    {`${item?.buyer?.firstName} ${item?.buyer?.lastName}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Return Reason */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">Return Reason</p>
                                        <div className="flex items-start gap-1 mt-1">
                                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm">{item?.items[0]?.reason || "Not specified"}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Action Button */}
                                    <div className="pt-2 flex justify-end">
                                        <Button 
                                            variant="outline"
                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-8 px-3"
                                            onClick={() => handleReturnAction(item?._id, 'view')}
                                        >
                                            View Details
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* Mobile Pagination */}
                        <div className="flex flex-col gap-2 mt-4 items-center text-center">
                            <div className="text-xs text-gray-500">
                                Showing {returns?.length} of {stats?.totalReturns} returns
                            </div>
                            <div className="flex gap-2 mt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    ← Previous
                                </Button>
                                <div className="flex items-center text-xs">
                                    Page {page} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next →
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

