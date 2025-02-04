import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { BASE_URL } from "@/Constants/Server"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { CheckCircle, AlertCircle, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Coupons() {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    code: '', // Optional now
    discountPercentage: '',
    hasMinimumRequirement: false,
    minimumAmount: 0,
    startDate: new Date(), // Default to current date for immediate start
    endDate: null,
    customerEligibility: 'all',
    usageLimit: null,
    productDiscounts: [] // Will store {productId, discountedPrice}
  })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [endDateEnabled, setEndDateEnabled] = useState(false)
  const [sellerProducts, setSellerProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [productErrors, setProductErrors] = useState({})
  const navigate = useNavigate()
  const [startTimeOption, setStartTimeOption] = useState('immediately')

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data

          const profileResponse = await axios.get(`${BASE_URL}/seller/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          const sellerId = profileResponse.data._id
          const productsResponse = await axios.get(`${BASE_URL}/products/seller/${sellerId}`)

          // Filter out products that are already on discount
          const availableProducts = productsResponse.data.products.map(product => ({
            ...product,
            isOnDiscount: product.discountEndDate && new Date(product.discountEndDate) > new Date(),
            discountEndDate: product.discountEndDate
          }))

          setSellerProducts(availableProducts)
        }
      } catch (error) {
        setError("Failed to fetch products: " + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerProducts()
  }, [])

  // Update form data when start time option changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startDate: startTimeOption === 'immediately' ? new Date() : prev.startDate
    }))
  }, [startTimeOption])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) {
        throw new Error("Not authenticated")
      }

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      // Prepare product discounts data
      const productDiscounts = selectedProducts.map(productId => {
        const product = sellerProducts.find(p => p._id === productId)
        // Calculate discounted price based on percentage
        const discountedPrice = product.price * (1 - (formData.discountPercentage / 100))
        return {
          productId,
          discountedPrice: Math.round(discountedPrice * 100) / 100 // Round to 2 decimal places
        }
      })

      // Combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = endDateEnabled ? new Date(`${formData.endDate}T${formData.endTime}`) : null

      const couponData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discountPercentage),
        hasMinimumRequirement: formData.hasMinimumRequirement,
        minimumAmount: formData.hasMinimumRequirement ? Number(formData.minimumAmount) : 0,
        startDate: startDateTime,
        endDate: endDateTime,
        customerEligibility: formData.customerEligibility,
        productDiscounts,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
      }

      await axios.post(`${BASE_URL}/coupons`, couponData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSuccessDialogOpen(true)

      // Reset form
      setFormData({
        name: "",
        code: "",
        discountPercentage: 0,
        hasMinimumRequirement: false,
        minimumAmount: 0,
        startDate: new Date(),
        endDate: null,
        customerEligibility: "all",
        usageLimit: null,
        productDiscounts: []
      })
      setSelectedProducts([])
      setEndDateEnabled(false)

    } catch (error) {
      setError(error.response?.data?.message || error.message)
    }
  }

  // Filter products based on search query
  const filteredProducts = sellerProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Modify the product selection handler
  const handleProductSelection = (productId, checked) => {
    const product = sellerProducts.find(p => p._id === productId)

    if (checked && product.isOnDiscount) {
      setProductErrors({
        ...productErrors,
        [productId]: `This product is already on discount until ${new Date(product.discountEndDate).toLocaleDateString()}`
      })
      return
    }

    setProductErrors({
      ...productErrors,
      [productId]: null
    })

    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  const formatDiscountInfo = (product) => {
    if (!product.isOnDiscount) return null;

    const endDate = new Date(product.discountEndDate).toLocaleDateString();
    const discountPercentage = product.discountType === 'coupon'
      ? `${product.discountPercentage}% off`
      : `${Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% off`;

    return {
      endDate,
      discountPercentage,
      daysRemaining: Math.ceil((new Date(product.discountEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    };
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Coupon</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/coupons/list')}
        >
          View All Coupons
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Coupon Name and Code */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Coupon Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Coupon Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Summer Sale"
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Coupon Code (Optional)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="SUMMER2024"
              />
            </div>
            <div>
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        {/* Purchase Restrictions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Coupon Purchase Restriction</h2>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasMinimum"
              checked={formData.hasMinimumRequirement}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                hasMinimumRequirement: checked,
                minimumAmount: checked ? formData.minimumAmount : 0
              })}
            />
            <Label htmlFor="hasMinimum">Minimum Purchase requirement</Label>
          </div>

          {formData.hasMinimumRequirement && (
            <Input
              type="number"
              value={formData.minimumAmount}
              onChange={(e) => setFormData({...formData, minimumAmount: e.target.value})}
              placeholder="₦ 1,000"
              className="max-w-[200px]"
            />
          )}
        </div>

        {/* Active Dates */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Coupon Duration</h2>
          <div className="space-y-4">
            <RadioGroup
              value={startTimeOption}
              onValueChange={setStartTimeOption}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediately" id="immediately" />
                <Label htmlFor="immediately">Start immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled">Schedule start time</Label>
              </div>
            </RadioGroup>

            {startTimeOption === 'scheduled' && (
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({...formData, startDate: new Date(e.target.value)})}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({...formData, endDate: e.target.value ? new Date(e.target.value) : null})}
              />
            </div>
          </div>
        </div>

        {/* Customer Eligibility */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Customer Eligibility</h2>
          <RadioGroup
            value={formData.customerEligibility}
            onValueChange={(value) => setFormData({...formData, customerEligibility: value})}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All customers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new">New customers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="followers" id="followers" />
              <Label htmlFor="followers">Followers only</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Usage Limits */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Usage Limits</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasUsageLimit"
                checked={formData.usageLimit !== null}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  usageLimit: checked ? 0 : null
                })}
              />
              <Label htmlFor="hasUsageLimit">Limit number of times this discount can be used</Label>
            </div>
            {formData.usageLimit !== null && (
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                placeholder="0"
                className="max-w-[200px]"
              />
            )}
          </div>
        </div>

        {/* Select Products */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select Products</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>PRODUCTS</TableHead>
                  <TableHead>STOCK</TableHead>
                  <TableHead>PRICE</TableHead>
                  <TableHead>DISCOUNTED PRICE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading products...</TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No products found</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const isDiscounted = product.discount?.isActive;
                    const discountInfo = isDiscounted ? {
                      endDate: product.discount.endDate ? new Date(product.discount.endDate).toLocaleDateString() : 'No end date',
                      discountPercentage: `${product.discount.value}% off`,
                      daysRemaining: product.discount.endDate ? 
                        Math.ceil((new Date(product.discount.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
                        'Ongoing',
                      couponName: product.discount.couponName
                    } : null;

                    return (
                      <TableRow
                        key={product._id}
                        className={isDiscounted ? "bg-gray-50" : ""}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="relative">
                              <Checkbox
                                checked={selectedProducts.includes(product._id)}
                                onCheckedChange={(checked) => handleProductSelection(product._id, checked)}
                                disabled={isDiscounted}
                                className={isDiscounted ? "opacity-50 cursor-not-allowed" : ""}
                              />
                              {isDiscounted && (
                                <AlertCircle className="h-4 w-4 text-amber-500 absolute -right-5 -top-1" />
                              )}
                            </div>
                            {isDiscounted && (
                              <div className="text-xs text-gray-500">
                                <div className="font-medium">Product Already Discounted</div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ends on {discountInfo.endDate}</span>
                                  </div>
                                  <div>Current discount: {discountInfo.discountPercentage}</div>
                                  <div>Coupon: {discountInfo.couponName}</div>
                                  {discountInfo.daysRemaining !== 'Ongoing' && (
                                    <div className="text-amber-500">
                                      {discountInfo.daysRemaining} days remaining
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.images[0]?.url || "/placeholder.svg"}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                            <div className="space-y-1">
                              <div className="font-medium">{product.name}</div>
                              {product.isOnDiscount && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                                    {discountInfo.discountPercentage}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    until {discountInfo.endDate}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{product.stock}</div>
                            {product.isOnDiscount && (
                              <div className="text-xs text-gray-500">
                                Not available for new discounts
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={product.isOnDiscount ? "line-through text-gray-400" : ""}>
                              ₦ {product.price.toLocaleString()}
                            </div>
                            {product.isOnDiscount && (
                              <div className="text-green-600 font-medium">
                                ₦ {product.discountedPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.isOnDiscount ? (
                            <div className="text-gray-400 italic">
                              Currently discounted
                            </div>
                          ) : (
                            <div>
                              ₦ {(product.price * (1 - (formData.discountPercentage / 100))).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t text-sm text-gray-500">
              Showing {filteredProducts.length} items
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit">Publish Coupon</Button>
        </div>
      </form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Coupon Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your coupon has been created and is now active. You can view and manage all your coupons in the coupons list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setSuccessDialogOpen(false)}
            >
              Create Another
            </Button>
            <Button
              onClick={() => navigate('/dashboard/coupons/list')}
              className="bg-green-600 hover:bg-green-700"
            >
              View All Coupons
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
