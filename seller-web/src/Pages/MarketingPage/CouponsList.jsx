import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { BASE_URL } from "@/Constants/Server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, CheckCircle, XCircle, Plus, CalendarIcon, ShoppingBag, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

export default function CouponsList() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
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
  }, [])

  const fetchCoupons = async () => {
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error("Not authenticated")
      
      const tokenData = JSON.parse(sellerToken)
      const response = await axios.get(`${BASE_URL}/coupons/seller`, {
        headers: { Authorization: `Bearer ${tokenData.data}` }
      })
      setCoupons(response.data.coupons)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Coupons</h1>
          <p className="text-gray-500 mt-1">Manage and track your discount coupons</p>
        </div>
        <Button 
          onClick={() => navigate('/dashboard/coupons/create')}
          className="bg-green-600 hover:bg-green-700 text-white px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Coupon
        </Button>
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
        <div className="bg-white rounded-xl shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Discount</TableHead>
                <TableHead className="font-semibold">Validity</TableHead>
                {/* <TableHead className="font-semibold">Usage</TableHead> */}
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon._id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">{coupon.name}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-3 py-1 rounded-full text-sm font-mono">
                      {coupon.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    {coupon.discountPercentage}% OFF
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
                  {/* <TableCell>
                    <div className="flex items-center">
                      
                      <span className="ml-2 text-sm text-gray-600">
                        {coupon.usageCount} / {coupon.usageLimit || '∞'}
                      </span>
                    </div>
                  </TableCell> */}
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
                    <div className="flex justify-end space-x-2">
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
              ))}
            </TableBody>
          </Table>
          {coupons.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No coupons found</h3>
              <p className="text-gray-500 mt-2">Get started by creating a new coupon.</p>
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
    </div>
  )
} 