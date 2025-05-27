import { useEffect, useState, useRef } from 'react'
import { Pencil, Trash2, Plus, Loader2, Upload, X, Eye, Tag, Star, BarChart2, Package2, Store, Play, Pause, Volume2, VolumeX, Info, ArrowUpDown, Calendar, Grid3X3, List } from "lucide-react"
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
import { api } from "@/api/axios"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"

interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  storeName: string;
  storeAvatar: {
    url: string;
  };
  email: string;
  phoneNumber: string;
  isVerified: boolean;
}

interface BlipEngagement {
  likesCount: number;
  commentsCount: number;
  viewCount: number;
}

interface ProductBlip {
  productId: string;
  blipId: string;
  blipUrl: string;
  thumbnail: string;
  contentType: string;
  productName: string;
  productDescription: string;
  price: number;
  category: string;
  subCategory: string;
  createdAt: string;
  seller: Seller;
  engagement: BlipEngagement;
  status: string;
}

interface BlipStats {
  totalBlips: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageViews: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalBlips: number;
  blipsPerPage: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

function ProductBlips() {
  const [blips, setBlips] = useState<ProductBlip[]>([])
  const [stats, setStats] = useState<BlipStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [muted, setMuted] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentBlipDetails, setCurrentBlipDetails] = useState<ProductBlip | null>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const [deletingBlip, setDeletingBlip] = useState<string | null>(null)
  
  // Pagination and filtering state
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalBlips: 0,
    blipsPerPage: 20
  })
  
  const [filters, setFilters] = useState({
    sellerId: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    minLikes: 0,
    minViews: 0,
    minComments: 0,
    dateRange: {} as DateRange
  })

  useEffect(() => {
    fetchBlips(true)
  }, [])

  const fetchBlips = async (isNewSearch = false, page?: number) => {
    try {
      const currentPage = page || (isNewSearch ? 1 : pagination.currentPage)
      if (isNewSearch) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      // Build query parameters
      const params: any = {
        page: currentPage,
        limit: pagination.blipsPerPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.sellerId && { sellerId: filters.sellerId }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minLikes > 0 && { minLikes: filters.minLikes }),
        ...(filters.minViews > 0 && { minViews: filters.minViews }),
        ...(filters.minComments > 0 && { minComments: filters.minComments }),
        ...(filters.dateRange.from && { startDate: format(filters.dateRange.from, 'yyyy-MM-dd') }),
        ...(filters.dateRange.to && { endDate: format(filters.dateRange.to, 'yyyy-MM-dd') })
      }

      console.log('Fetching blips with params:', params)
      const response = await api.get('/api/admin/product-blips', { params })
      console.log('Received response:', {
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalBlips: response.data.pagination.totalBlips,
        blipsCount: response.data.blips.length
      })
      
      // Update pagination data and stats
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalBlips: response.data.pagination.totalBlips,
        blipsPerPage: response.data.pagination.blipsPerPage
      })
      
      setStats(response.data.stats)

      // If this is a new search, replace blips. Otherwise, append
      if (isNewSearch) {
        setBlips(response.data.blips)
      } else {
        setBlips(prev => [...prev, ...response.data.blips])
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch blips";
      toast.error(errorMessage)
      if (isNewSearch) {
        setBlips([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      const nextPage = pagination.currentPage + 1;
      setPagination(prev => ({ ...prev, currentPage: nextPage }))
      fetchBlips(false, nextPage)
    }
  }

  const handleSearch = () => {
    // For now, we're not implementing search by text as the API doesn't support it
    // This could be extended later when the API adds this feature
    toast.info("Search functionality will be implemented in a future update")
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    fetchBlips(true)
  }

  const resetFilters = () => {
    setFilters({
      sellerId: '',
      category: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minLikes: 0,
      minViews: 0,
      minComments: 0,
      dateRange: {}
    })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    fetchBlips(true)
  }

  const handlePlayVideo = (blipId: string) => {
    if (activeVideo === blipId) {
      // Pause the video if it's already playing
      const videoElement = videoRefs.current[blipId];
      if (videoElement) {
        if (videoElement.paused) {
          videoElement.play()
        } else {
          videoElement.pause()
        }
      }
    } else {
      // Pause the currently playing video
      if (activeVideo && videoRefs.current[activeVideo]) {
        videoRefs.current[activeVideo]?.pause()
      }
      
      // Play the new video
      setActiveVideo(blipId)
      const videoElement = videoRefs.current[blipId];
      if (videoElement) {
        videoElement.currentTime = 0
        videoElement.play()
      }
    }
  }

  const toggleMute = () => {
    setMuted(!muted)
    
    // Apply to all video elements
    Object.values(videoRefs.current).forEach(videoEl => {
      if (videoEl) {
        videoEl.muted = !muted
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const openBlipDetails = (blip: ProductBlip) => {
    setCurrentBlipDetails(blip)
  }

  const handleDeleteBlip = async (productId: string, blipId: string) => {
    try {
      setDeletingBlip(blipId)
      await api.delete(`/api/admin/products/${productId}/blips/${blipId}`)
      
      // Remove the blip from the state
      setBlips(prev => prev.filter(b => b.blipId !== blipId))
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          totalBlips: stats.totalBlips - 1
        })
      }
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        totalBlips: prev.totalBlips - 1
      }))

      toast.success('Blip deleted successfully')
      
      // Close the details dialog if the deleted blip was being viewed
      if (currentBlipDetails?.blipId === blipId) {
        setCurrentBlipDetails(null)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete blip"
      toast.error(errorMessage)
    } finally {
      setDeletingBlip(null)
    }
  }

  // Initial loading state
  if (loading && pagination.currentPage === 1 && blips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-xl text-muted-foreground">Loading product blips...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Product Blips</h2>
          <p className="text-muted-foreground">
            Manage video content from products across the platform ({pagination.totalBlips} blips)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 bg-card border-none">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">Total Blips</span>
              <span className="text-2xl font-bold">{formatNumber(stats.totalBlips)}</span>
            </div>
          </Card>
          <Card className="p-4 bg-card border-none">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">Total Views</span>
              <span className="text-2xl font-bold">{formatNumber(stats.totalViews)}</span>
            </div>
          </Card>
          <Card className="p-4 bg-card border-none">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">Total Likes</span>
              <span className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</span>
            </div>
          </Card>
          <Card className="p-4 bg-card border-none">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">Total Comments</span>
              <span className="text-2xl font-bold">{formatNumber(stats.totalComments)}</span>
            </div>
          </Card>
          <Card className="p-4 bg-card border-none">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">Average Views</span>
              <span className="text-2xl font-bold">{formatNumber(stats.averageViews)}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
     
      {/* Main Content */}
      <Card className="bg-card border-none">
        {/* Global sound toggle */}
        <div className="p-4 border-b border-gray-800 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="flex items-center gap-2"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? "Unmute All" : "Mute All"}
          </Button>
        </div>

        {viewMode === 'grid' ? (
          // Grid View
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {blips.map((blip) => (
                <Card key={blip.blipId} className="overflow-hidden border-none bg-slate-800/50">
                  <div className="p-3">
                    <div className="relative aspect-[9/16] w-full group mb-3">
                      <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                        <img 
                          src={blip.thumbnail} 
                          alt={blip.productName}
                          className="w-full h-full object-cover opacity-75"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full bg-black/50 hover:bg-primary/90"
                            onClick={() => handlePlayVideo(blip.blipId)}
                          >
                            <Play className="h-8 w-8" />
                          </Button>
                        </div>
                      </div>
                      
                      <video
                        ref={el => videoRefs.current[blip.blipId] = el}
                        src={blip.blipUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted={muted}
                        playsInline
                        onClick={() => handlePlayVideo(blip.blipId)}
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent z-20">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              {formatNumber(blip.engagement.viewCount)}
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-3.5 w-3.5 mr-1" />
                              {formatNumber(blip.engagement.likesCount)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-gray-800/80"
                            onClick={() => openBlipDetails(blip)}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-red-900/30"
                            onClick={() => handleDeleteBlip(blip.productId, blip.blipId)}
                            disabled={deletingBlip === blip.blipId}
                          >
                            {deletingBlip === blip.blipId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm truncate" title={blip.productName}>
                        {blip.productName}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                          {blip.seller.storeAvatar ? (
                            <img src={blip.seller.storeAvatar.url} alt={blip.seller.storeName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium">
                              {(blip.seller.storeName || blip.seller.firstName).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate flex-1">{blip.seller.storeName || `${blip.seller.firstName} ${blip.seller.lastName}`}</p>
                      </div>
                      <p className="text-sm font-medium mt-2">{formatPrice(blip.price)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Table View
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Seller</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-300">Engagement</TableHead>
                  <TableHead className="text-gray-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No blips found. Try different filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  blips.map((blip) => (
                    <TableRow key={blip.blipId} className="border-b border-gray-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-slate-800 rounded-md overflow-hidden relative group">
                            <img 
                              src={blip.thumbnail} 
                              alt={blip.productName} 
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="h-5 w-5" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-white truncate max-w-[200px]" title={blip.productName}>
                              {blip.productName}
                            </div>
                            <div className="text-sm text-gray-400">{formatPrice(blip.price)}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                            {blip.seller.storeAvatar ? (
                              <img src={blip.seller.storeAvatar.url} alt={blip.seller.storeName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium">
                                {(blip.seller.storeName || blip.seller.firstName).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm truncate max-w-[150px]" title={blip.seller.storeName || `${blip.seller.firstName} ${blip.seller.lastName}`}>
                              {blip.seller.storeName || `${blip.seller.firstName} ${blip.seller.lastName}`}
                            </span>
                            {blip.seller.isVerified && (
                              <Badge className="text-xs py-0 px-1 h-5 bg-blue-500/20 text-blue-400">Verified</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-gray-400">
                        {formatDate(blip.createdAt)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {blip.category}
                        </Badge>
                        {blip.subCategory && (
                          <div className="text-xs text-gray-400 mt-1">
                            {blip.subCategory}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-300">
                            <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                            <span className="font-medium text-white">{formatNumber(blip.engagement.viewCount)}</span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <Tag className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                            <span className="font-medium text-white">{formatNumber(blip.engagement.likesCount)}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => openBlipDetails(blip)}
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-slate-700 border-slate-600"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handlePlayVideo(blip.blipId)}
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-slate-700 border-slate-600"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Play blip</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleDeleteBlip(blip.productId, blip.blipId)}
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-red-900/30 border-red-800 hover:bg-red-900/50"
                                  disabled={deletingBlip === blip.blipId}
                                >
                                  {deletingBlip === blip.blipId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete blip</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Load More Button */}
        {pagination.currentPage < pagination.totalPages && (
          <div className="py-4 px-6 flex justify-center">
            <Button 
              onClick={handleLoadMore} 
              variant="outline" 
              disabled={loadingMore}
              className="w-full max-w-md"
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading more...</>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Blip Details Dialog */}
      {currentBlipDetails && (
        <Dialog open={!!currentBlipDetails} onOpenChange={(open) => !open && setCurrentBlipDetails(null)}>
          <DialogContent className="max-w-3xl bg-slate-900 border border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Blip Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                Detailed information about this product blip
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-[9/16] bg-black rounded-md overflow-hidden">
                <video
                  src={currentBlipDetails.blipUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{currentBlipDetails.productName}</h3>
                  <p className="text-sm text-gray-400 mt-1">{currentBlipDetails.productDescription}</p>
                  <p className="text-lg font-bold mt-2">{formatPrice(currentBlipDetails.price)}</p>
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Seller Information</h4>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                      {currentBlipDetails.seller.storeAvatar ? (
                        <img
                          src={currentBlipDetails.seller.storeAvatar.url}
                          alt={currentBlipDetails.seller.storeName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {(currentBlipDetails.seller.storeName || currentBlipDetails.seller.firstName).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {currentBlipDetails.seller.storeName || `${currentBlipDetails.seller.firstName} ${currentBlipDetails.seller.lastName}`}
                        {currentBlipDetails.seller.isVerified && (
                          <Badge className="ml-2 text-xs py-0 px-1 h-5 bg-blue-500/20 text-blue-400">Verified</Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">{currentBlipDetails.seller.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Engagement Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-md">
                      <p className="text-xs text-gray-400">Views</p>
                      <p className="text-lg font-medium">{formatNumber(currentBlipDetails.engagement.viewCount)}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-md">
                      <p className="text-xs text-gray-400">Likes</p>
                      <p className="text-lg font-medium">{formatNumber(currentBlipDetails.engagement.likesCount)}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-md">
                      <p className="text-xs text-gray-400">Comments</p>
                      <p className="text-lg font-medium">{formatNumber(currentBlipDetails.engagement.commentsCount)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="text-sm">{currentBlipDetails.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Subcategory</p>
                      <p className="text-sm">{currentBlipDetails.subCategory || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Created</p>
                      <p className="text-sm">{formatDate(currentBlipDetails.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-sm">{currentBlipDetails.status || "Active"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-800">
              <Button
                variant="destructive"
                className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800"
                onClick={() => handleDeleteBlip(currentBlipDetails.productId, currentBlipDetails.blipId)}
                disabled={deletingBlip === currentBlipDetails.blipId}
              >
                {deletingBlip === currentBlipDetails.blipId ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4 mr-2" /> Delete Blip</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ProductBlips 