import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { Button } from "@/Components/ui/button"
import { Badge } from "@/Components/ui/badge"
import { Edit2, Trash2, CheckCircle, XCircle, Plus, CalendarIcon, ShoppingBag, AlertTriangle, RotateCcw, Info, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog"
import { Input } from "@/Components/ui/form/input"
import { Label } from "@/Components/ui/label"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group"
import { Checkbox } from "@/Components/ui/checkbox"
import { useAuthContext } from "@/Hooks/useAuthContextV2";

export default function CouponsList() {
  const { token } = useAuthContext();
  const [coupons, setCoupons] = useState([])
  const [specialCoupons, setSpecialCoupons] = useState([])
  const [activeTab, setActiveTab] = useState('all') // 'all', 'product', 'special'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [sellerProducts, setSellerProducts] = useState([])
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewCoupon, setViewCoupon] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    status: "",
    discountPercentage: 0,
    discountType: "percentage",
    fixedAmount: 0,
    hasMinimumRequirement: false,
    minimumAmount: 0,
    endDate: "",
    endTime: "",
    usageLimit: null,
    selectedProducts: [] // Track selected product IDs
  })
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCoupons()
    fetchSellerProducts()
  }, [])

  const fetchCoupons = async () => {
    try {
      const sellerToken = token?.data;
      if (!sellerToken) throw new Error("Not authenticated")
      

      // Fetch both regular coupons and special coupons
      const [regularResponse, specialResponse] = await Promise.all([
        axios.get(`${BASE_URL}/coupons/seller`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        }),
        axios.get(`${BASE_URL}/coupons/special`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        })
      ])

      console.log("Regular coupons:", regularResponse.data.coupons);
      console.log("Special coupons:", specialResponse.data.coupons);

      setCoupons(regularResponse.data.coupons)
      setSpecialCoupons(specialResponse.data.coupons)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSellerProducts = async (forceRefresh = false) => {
    try {
      const sellerToken = token?.data;
      if (!sellerToken) return

      setIsLoadingProducts(true)
      const profileResponse = await axios.get(`${BASE_URL_V2}/sellers/profile`, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      })
      const sellerId = profileResponse.data.data._id

      // Fetch all products (no pagination limit for editing purposes)
      const productsResponse = await axios.get(`${BASE_URL}/products/seller/${sellerId}`, {
        params: { limit: 1000 } // Get all products
      })
      
      // Map products with their current discount status
      const productsWithDiscountInfo = (productsResponse.data.products || []).map(product => ({
        ...product,
        discount: product.discount || { isActive: false }
      }))
      
      setSellerProducts(productsWithDiscountInfo)
    } catch (err) {
      // Don't block the page if product fetch fails; we just show no association
      console.error('Failed to fetch seller products:', err?.message)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleResetAllDiscounts = async () => {
    setResetError(null)
    setResetLoading(true)
    try {
      const sellerToken = token?.data;
      if (!sellerToken) throw new Error('Not authenticated')

      await axios.post(`${BASE_URL}/coupons/reset`, {}, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      })

      await fetchCoupons()
      await fetchSellerProducts() // Refresh products to update discount status
      setResetDialogOpen(false)
    } catch (err) {
      setResetError(err.response?.data?.message || err.message)
    } finally {
      setResetLoading(false)
    }
  }

  // Get filtered coupons based on active tab
  const getFilteredCoupons = () => {
    // Helper function to generate a consistent unique key for any coupon object
    const getCouponKey = (coupon) => {
      // If the coupon has an ID (either _id or id), use that as primary identifier
      if (coupon._id) return `id-${coupon._id}`;
      if (coupon.id) return `id-${coupon.id}`;
      
      // Fall back to name+code combination
      const codeStr = coupon.code || "noCode";
      return `name-code-${coupon.name}-${codeStr}`;
    };
    
    switch (activeTab) {
      case 'product':
        return coupons;
      case 'special':
        return specialCoupons;
      default:
        {
          // Use Map to enforce uniqueness based on our key generation function
          const uniqueCouponsMap = new Map();
          
          // Process regular coupons first
          coupons.forEach(coupon => {
            const key = getCouponKey(coupon);
            uniqueCouponsMap.set(key, coupon);
          });
          
          // Process special coupons, only adding if they don't conflict with regular coupons
          specialCoupons.forEach(coupon => {
            const key = getCouponKey(coupon);
            // Only add if not already in the map
            if (!uniqueCouponsMap.has(key)) {
              uniqueCouponsMap.set(key, coupon);
            }
          });
          
          // Convert map values back to array
          const combinedCoupons = Array.from(uniqueCouponsMap.values());
          console.log("Combined coupons after Map deduplication:", combinedCoupons);
          return combinedCoupons;
        }
    }
  }

  const handleDelete = async (couponId) => {
    try {
      const sellerToken = token?.data;
      await axios.delete(`${BASE_URL}/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      })
      await fetchCoupons()
      await fetchSellerProducts() // Refresh products to update discount status
      setDeleteDialogOpen(false)
    } catch (error) {
      setError(error.response?.data?.message || error.message)
    }
  }

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon)
    // Format the date and time for the form
    const endDateTime = coupon.endDate ? new Date(coupon.endDate) : null
    
    // Get the selected products for this coupon
    let selectedProductIds = []
    if (coupon.code) {
      // Special coupon - use applicableProductIds
      selectedProductIds = coupon.applicableProductIds || []
    } else {
      // Regular coupon - use productDiscounts
      selectedProductIds = (coupon.productDiscounts || []).map(pd => pd.productId)
    }
    
    setEditFormData({
      name: coupon.name,
      status: coupon.status,
      discountPercentage: coupon.discountPercentage || 0,
      discountType: coupon.discountType || "percentage",
      fixedAmount: coupon.fixedAmount || 0,
      hasMinimumRequirement: coupon.hasMinimumRequirement,
      minimumAmount: coupon.minimumAmount || 0,
      endDate: endDateTime ? endDateTime.toISOString().split('T')[0] : "",
      endTime: endDateTime ? endDateTime.toISOString().split('T')[1].substring(0, 5) : "",
      usageLimit: coupon.usageLimit,
      selectedProducts: selectedProductIds
    })
    setProductSearchQuery("")
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    try {
      const sellerToken = token?.data;
      
      // Combine date and time for endDate
      let endDateTime = null
      if (editFormData.endDate && editFormData.endTime) {
        endDateTime = new Date(`${editFormData.endDate}T${editFormData.endTime}`)
      }

      const updateData = {
        name: editFormData.name,
        status: editFormData.status,
        discountPercentage: Number(editFormData.discountPercentage),
        discountType: editFormData.discountType,
        fixedAmount: editFormData.fixedAmount ? Number(editFormData.fixedAmount) : undefined,
        hasMinimumRequirement: editFormData.hasMinimumRequirement,
        minimumAmount: editFormData.hasMinimumRequirement ? Number(editFormData.minimumAmount) : 0,
        endDate: endDateTime,
        usageLimit: editFormData.usageLimit ? Number(editFormData.usageLimit) : null
      }

      // Handle product updates differently for regular vs special coupons
      if (selectedCoupon.code) {
        // Special coupon - update applicableProductIds
        updateData.applicableProductIds = editFormData.selectedProducts
      } else {
        // Regular coupon - update productDiscounts with recalculated prices
        updateData.productDiscounts = editFormData.selectedProducts.map(productId => {
          const product = sellerProducts.find(p => p._id === productId)
          if (!product) return { productId, discountedPrice: 0 }
          
          const discountedPrice = editFormData.discountType === 'percentage'
            ? product.price * (1 - (editFormData.discountPercentage / 100))
            : Math.max(0, product.price - Number(editFormData.fixedAmount || 0))
          
          return {
            productId,
            discountedPrice: Math.round(discountedPrice)
          }
        })
      }

      await axios.put(`${BASE_URL}/coupons/${selectedCoupon._id}`, updateData, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      })
      
      await fetchCoupons()
      await fetchSellerProducts() // Refresh products to see updated discounts
      setEditDialogOpen(false)
    } catch (error) {
      setError(error.response?.data?.message || error.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const matchesSearch = (coupon) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (coupon.name || '').toLowerCase().includes(q) ||
      (coupon.code || '').toLowerCase().includes(q)
    )
  }

  const getAssociatedProducts = (coupon) => {
    if (!coupon) return []
    
    // For special coupons, use applicableProductIds
    if (coupon.code && coupon.applicableProductIds) {
      return (sellerProducts || []).filter(product => 
        coupon.applicableProductIds.includes(product._id)
      )
    }
    
    // For regular coupons, use productDiscounts
    if (coupon.productDiscounts) {
      const productIds = coupon.productDiscounts.map(pd => pd.productId)
      return (sellerProducts || []).filter(product => 
        productIds.includes(product._id)
      )
    }
    
    // Fallback: Heuristic association based on product.discount metadata
    return (sellerProducts || []).filter((product) => {
      const d = product.discount || {}
      const isActive = d.isActive === true
      if (!isActive) return false
      const byCode = coupon.code && (d.couponCode === coupon.code)
      const byName = d.couponName && (d.couponName === coupon.name)
      return Boolean(byCode || byName)
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 mt-1">Manage discounts, codes, and validity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setResetDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2 text-red-700 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Discounts
          </Button>
          <Button 
            onClick={() => navigate('/dashboard/coupons/create')}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Coupon
          </Button>
        </div>
      </div>

      {/* Toolbar: tabs + search */}
      <div className="bg-white rounded-xl shadow-sm border mb-4 p-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'product', label: 'Product Discounts' },
            { key: 'special', label: 'Special Coupons' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${activeTab === tab.key ? 'bg-[#17171B] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1.5 rounded-full text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading coupons...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
          <XCircle className="h-6 w-6 mx-auto mb-2" />
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Discount</TableHead>
                <TableHead className="font-semibold">Validity</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Products</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredCoupons().filter(matchesSearch).map((coupon) => {
                const associated = getAssociatedProducts(coupon)
                return (
                <TableRow key={coupon._id || `${coupon.name}-${coupon.code || 'no-code'}`} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">{coupon.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={coupon.code ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}
                    >
                      {coupon.code ? 'Special Coupon' : 'Product Discount'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.code ? (
                      <code className="bg-gray-100 px-3 py-1 rounded-full text-sm font-mono">
                        {coupon.code}
                      </code>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    {coupon.discountType === 'fixed' ? (
                      <>₦ {Number(coupon.fixedAmount || 0).toLocaleString()}</>
                    ) : (
                      <>{coupon.discountPercentage}% OFF</>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        From: {formatDate(coupon.startDate)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        To: {formatDate(coupon.endDate)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        new Date(coupon.startDate) > new Date() 
                          ? 'warning' 
                          : coupon.status === 'active' 
                            ? 'success' 
                            : 'secondary'
                      }
                      className={`
                        ${new Date(coupon.startDate) > new Date()
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : coupon.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'}
                        px-3 py-1 rounded-full text-xs font-medium
                      `}
                    >
                      {new Date(coupon.startDate) > new Date() ? (
                        <>
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          scheduled
                        </>
                      ) : coupon.status === 'active' ? (
                        <>
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          {coupon.status}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 inline mr-1" />
                          {coupon.status}
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-600">
                      {associated.length > 0 ? (
                        <span>{associated.length} product{associated.length > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => { setViewCoupon(coupon); setViewDialogOpen(true); }}
                        title="View details"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-green-50 hover:text-green-600"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => {
                          setSelectedCoupon(coupon)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          {getFilteredCoupons().filter(matchesSearch).length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No coupons found</h3>
              <p className="text-gray-500 mt-2">
                {activeTab === 'special' 
                  ? 'Get started by creating a new special coupon code.'
                  : activeTab === 'product'
                    ? 'Get started by creating a new product discount.'
                    : 'Get started by creating a new coupon.'}
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Coupon
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon &quot;{selectedCoupon?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedCoupon?._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details and manage associated products below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Details Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4 text-sm">Basic Details</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-sm">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right text-sm">
                    Status
                  </Label>
                  <RadioGroup
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    className="col-span-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="active" id="active" />
                      <Label htmlFor="active">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inactive" id="inactive" />
                      <Label htmlFor="inactive">Inactive</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discount" className="text-right text-sm">
                    Discount
                  </Label>
                  <div className="col-span-3">
                    {editFormData.discountType === 'percentage' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          id="discount"
                          type="number"
                          value={editFormData.discountPercentage}
                          onChange={(e) => setEditFormData({ ...editFormData, discountPercentage: e.target.value })}
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">₦</span>
                        <Input
                          id="fixedAmount"
                          type="number"
                          value={editFormData.fixedAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, fixedAmount: e.target.value })}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm">
                    End Date/Time
                  </Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="usageLimit" className="text-right text-sm">
                    Usage Limit
                  </Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={editFormData.usageLimit || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, usageLimit: e.target.value })}
                    className="col-span-3"
                    placeholder="No limit"
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Associated Products</h3>
                <Badge variant="secondary">
                  {editFormData.selectedProducts.length} selected
                </Badge>
              </div>
              
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-md max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={editFormData.selectedProducts.length === sellerProducts.filter(p => !p.discount?.isActive || getAssociatedProducts(selectedCoupon).some(ap => ap._id === p._id)).length && sellerProducts.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Select all available products
                              const availableIds = sellerProducts
                                .filter(p => !p.discount?.isActive || getAssociatedProducts(selectedCoupon).some(ap => ap._id === p._id))
                                .map(p => p._id)
                              setEditFormData({ ...editFormData, selectedProducts: availableIds })
                            } else {
                              setEditFormData({ ...editFormData, selectedProducts: [] })
                            }
                          }}
                          aria-label="Select all products"
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerProducts
                      .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                      .map((product) => {
                        const isCurrentlyOnThisCoupon = getAssociatedProducts(selectedCoupon).some(ap => ap._id === product._id)
                        const isOnOtherDiscount = product.discount?.isActive && !isCurrentlyOnThisCoupon
                        const isSelected = editFormData.selectedProducts.includes(product._id)
                        
                        return (
                          <TableRow 
                            key={product._id}
                            className={isOnOtherDiscount ? 'bg-gray-100 opacity-60' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setEditFormData({
                                      ...editFormData,
                                      selectedProducts: [...editFormData.selectedProducts, product._id]
                                    })
                                  } else {
                                    setEditFormData({
                                      ...editFormData,
                                      selectedProducts: editFormData.selectedProducts.filter(id => id !== product._id)
                                    })
                                  }
                                }}
                                disabled={isOnOtherDiscount}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.images?.[0]?.url || '/placeholder.svg'}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                                <div>
                                  <div className="font-medium text-sm">{product.name}</div>
                                  {isOnOtherDiscount && (
                                    <div className="text-xs text-amber-600">
                                      On another discount
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              ₦{product.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              {product.stock}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset All Discounts Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <RotateCcw className="h-5 w-5" />
              Reset All Discounts
            </DialogTitle>
            <DialogDescription>
              This will expire all your coupons and clear discounted prices on your products. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {resetError && (
            <div className="text-red-600 text-sm">{resetError}</div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetLoading}>
              Cancel
            </Button>
            <Button onClick={handleResetAllDiscounts} disabled={resetLoading} className="bg-red-600 hover:bg-red-700">
              {resetLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Resetting...</span>
                </div>
              ) : (
                'Reset Now'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Coupon Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              {viewCoupon?.name || 'Coupon Details'}
            </DialogTitle>
            <DialogDescription>
              Review coupon information and affected products.
            </DialogDescription>
          </DialogHeader>
          {viewCoupon && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="text-sm font-medium mt-1">{viewCoupon.code ? 'Special Coupon' : 'Product Discount'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Discount</div>
                  <div className="text-sm font-medium mt-1">
                    {viewCoupon.discountType === 'fixed' ? `₦ ${Number(viewCoupon.fixedAmount || 0).toLocaleString()}` : `${viewCoupon.discountPercentage}% OFF`}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Validity</div>
                  <div className="text-sm font-medium mt-1">{formatDate(viewCoupon.startDate)} → {formatDate(viewCoupon.endDate)}</div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <h4 className="font-medium text-sm">Affected Products</h4>
                  <span className="text-xs text-gray-500">
                    {getAssociatedProducts(viewCoupon).length} item{getAssociatedProducts(viewCoupon).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {getAssociatedProducts(viewCoupon).length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-6">No associated products found.</div>
                  ) : (
                    getAssociatedProducts(viewCoupon).map((p) => (
                      <div key={p._id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={p.images?.[0]?.url || '/placeholder.svg'} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                          <div className="truncate">
                            <div className="font-medium text-sm truncate">{p.name}</div>
                            <div className="text-xs text-gray-500">Stock: {p.stock}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 line-through">₦ {Number(p.price).toLocaleString()}</div>
                          <div className="text-sm font-semibold text-green-600">₦ {Number(p.discountedPrice || p.price).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
