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
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group"
import { Checkbox } from "@/Components/ui/checkbox"

export default function CouponsList() {
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
  const [editFormData, setEditFormData] = useState({
    name: "",
    status: "",
    discountPercentage: 0,
    hasMinimumRequirement: false,
    minimumAmount: 0,
    endDate: "",
    endTime: "",
    usageLimit: null
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchCoupons()
    fetchSellerProducts()
  }, [])

  const fetchCoupons = async () => {
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error("Not authenticated")
      
      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      // Fetch both regular coupons and special coupons
      const [regularResponse, specialResponse] = await Promise.all([
        axios.get(`${BASE_URL}/coupons/seller`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/coupons/special`, {
          headers: { Authorization: `Bearer ${token}` }
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

  const fetchSellerProducts = async () => {
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) return
      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const profileResponse = await axios.get(`${BASE_URL_V2}/sellers/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const sellerId = profileResponse.data.data._id

      const productsResponse = await axios.get(`${BASE_URL}/products/seller/${sellerId}`)
      setSellerProducts(productsResponse.data.products || [])
    } catch (err) {
      // Don't block the page if product fetch fails; we just show no association
      console.error('Failed to fetch seller products:', err?.message)
    }
  }

  const handleResetAllDiscounts = async () => {
    setResetError(null)
    setResetLoading(true)
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error('Not authenticated')
      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      await axios.post(`${BASE_URL}/coupons/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      await fetchCoupons()
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

  const handleDelete = async (couponId) => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
      await axios.delete(`${BASE_URL}/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      })
      await fetchCoupons()
      setDeleteDialogOpen(false)
    } catch (error) {
      setError(error.message)
    }
  }

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon)
    // Format the date and time for the form
    const endDateTime = coupon.endDate ? new Date(coupon.endDate) : null
    setEditFormData({
      name: coupon.name,
      status: coupon.status,
      discountPercentage: coupon.discountPercentage,
      hasMinimumRequirement: coupon.hasMinimumRequirement,
      minimumAmount: coupon.minimumAmount || 0,
      endDate: endDateTime ? endDateTime.toISOString().split('T')[0] : "",
      endTime: endDateTime ? endDateTime.toISOString().split('T')[1].substring(0, 5) : "",
      usageLimit: coupon.usageLimit
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
      
      // Combine date and time for endDate
      let endDateTime = null
      if (editFormData.endDate && editFormData.endTime) {
        endDateTime = new Date(`${editFormData.endDate}T${editFormData.endTime}`)
      }

      const updateData = {
        name: editFormData.name,
        status: editFormData.status,
        discountPercentage: Number(editFormData.discountPercentage),
        hasMinimumRequirement: editFormData.hasMinimumRequirement,
        minimumAmount: editFormData.hasMinimumRequirement ? Number(editFormData.minimumAmount) : 0,
        endDate: endDateTime,
        usageLimit: editFormData.usageLimit ? Number(editFormData.usageLimit) : null
      }

      await axios.put(`${BASE_URL}/coupons/${selectedCoupon._id}`, updateData, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      })
      
      await fetchCoupons()
      setEditDialogOpen(false)
    } catch (error) {
      setError(error.message)
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
    // Heuristic association based on product.discount metadata exposed in product objects
    // Prefer coupon code match when available, then fall back to coupon name
    return (sellerProducts || []).filter((product) => {
      const d = product.discount || {}
      const isActive = d.isActive === true
      if (!isActive) return false
      const byCode = coupon.code && (d.couponCode === coupon.code)
      const byName = d.couponName && (d.couponName === coupon.name)
      // Some backends may not expose couponCode; try name match as fallback
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
              Are you sure you want to delete the coupon "{selectedCoupon?.name}"? This action cannot be undone.
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
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
              <Label htmlFor="status" className="text-right">
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
              <Label htmlFor="discount" className="text-right">
                Discount %
              </Label>
              <Input
                id="discount"
                type="number"
                value={editFormData.discountPercentage}
                onChange={(e) => setEditFormData({ ...editFormData, discountPercentage: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Minimum Amount
              </Label>
              <div className="col-span-3">
                <Checkbox
                  checked={editFormData.hasMinimumRequirement}
                  onCheckedChange={(checked) => setEditFormData({
                    ...editFormData,
                    hasMinimumRequirement: checked
                  })}
                />
                {editFormData.hasMinimumRequirement && (
                  <Input
                    type="number"
                    value={editFormData.minimumAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, minimumAmount: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
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
              <Label htmlFor="usageLimit" className="text-right">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
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