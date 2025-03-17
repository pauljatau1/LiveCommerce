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
import { CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InfoIcon } from "lucide-react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function Coupons() {
  // Add coupon type state
  const [couponType, setCouponType] = useState('product') // 'product' or 'special'
  
  // State management
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountPercentage: '',
    hasMinimumRequirement: false,
    minimumAmount: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    customerEligibility: 'all',
    usageLimit: null,
    productDiscounts: [],
    applicableProductIds: [] // New field for special coupons
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
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Add date validation
  const isDateValid = () => {
    if (!formData.endDate) return false;
    if (startTimeOption === 'scheduled' && !formData.startDate) return false;
    if (startTimeOption === 'scheduled' && formData.startDate >= formData.endDate) return false;
    if (startTimeOption === 'immediately' && new Date() >= formData.endDate) return false;
    return true;
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isDateValid()) {
      setError("Please set valid start and end dates");
      return;
    }
    setIsSubmitting(true)
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) {
        throw new Error("Not authenticated")
      }

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      // Format dates properly
      const startDateTime = startTimeOption === 'immediately' 
        ? new Date().toISOString()
        : formData.startDate.toISOString();

      const endDateTime = formData.endDate.toISOString();

      if (couponType === 'special') {
        // Special coupon data
        const couponData = {
          name: formData.name,
          code: formData.code.toUpperCase(),
          discountPercentage: Number(formData.discountPercentage),
          startDate: startDateTime,
          endDate: endDateTime,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
          applicableProductIds: selectedProducts // Use selected products as applicable products
        }

        await axios.post(`${BASE_URL}/coupons/special`, couponData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        // Regular product discount data
        const productDiscounts = selectedProducts.map(productId => {
          const product = sellerProducts.find(p => p._id === productId)
          const discountedPrice = product.price * (1 - (formData.discountPercentage / 100))
          return {
            productId,
            discountedPrice: Math.round(discountedPrice)
          }
        })

        const couponData = {
          name: formData.name,
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
      }

      setSuccessDialogOpen(true)

      // Reset form
      setFormData({
        name: "",
        code: "",
        discountPercentage: 0,
        hasMinimumRequirement: false,
        minimumAmount: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        customerEligibility: "all",
        usageLimit: null,
        productDiscounts: [],
        applicableProductIds: []
      })
      setSelectedProducts([])

    } catch (error) {
      setError(error.response?.data?.message || error.message)
    } finally {
      setIsSubmitting(false)
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
    <div className=" mx-auto p-6">
      {/* Header Section with improved spacing and styling */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Coupon</h1>
          <p className="text-gray-500 mt-1">Set up discounts for your products</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/coupons/list')}
          className="flex items-center gap-2"
        >
          <CalendarIcon className="h-4 w-4" />
          View All Coupons
        </Button>
      </div>

      {/* Coupon Type Selector */}
      <div className="bg-white rounded-lg border p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Coupon Type</h2>
        <RadioGroup
          value={couponType}
          onValueChange={setCouponType}
          className="flex space-x-8"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="product" id="product" />
            <Label htmlFor="product">Product Discount</Label>
            <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" title="Apply discount directly to specific products" />
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="special" id="special" />
            <Label htmlFor="special">Special Coupon Code</Label>
            <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" title="Create a reusable coupon code that can be applied at checkout" />
          </div>
        </RadioGroup>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Organize form into card-like sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Coupon Details Card */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </span>
                Coupon Details
              </h2>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">Coupon Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Summer Sale 2024"
                    className="max-w-md"
                  />
                </div>
                
                {couponType === 'special' && (
                  <div className="grid gap-3">
                    <Label htmlFor="code">Coupon Code <span className="text-red-500">*</span></Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., SUMMER2024"
                      className="max-w-md uppercase"
                      required
                    />
                    <span className="text-sm text-gray-500">
                      This code will be used by customers at checkout
                    </span>
                  </div>
                )}

                <div className="grid gap-3">
                  <Label htmlFor="discountPercentage">Discount Percentage</Label>
                  <div className="relative max-w-[200px]">
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Restrictions Card */}
            {couponType === 'product' && (
              <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary/10 p-2 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </span>
                  Purchase Restrictions
                </h2>
                <div className="space-y-4">
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
                    <Label htmlFor="hasMinimum">Set minimum purchase amount</Label>
                  </div>

                  {formData.hasMinimumRequirement && (
                    <div className="ml-6">
                      <Label htmlFor="minimumAmount">Minimum Amount (₦)</Label>
                      <Input
                        id="minimumAmount"
                        type="number"
                        value={formData.minimumAmount}
                        onChange={(e) => setFormData({...formData, minimumAmount: e.target.value})}
                        placeholder="1000"
                        className="max-w-[200px] mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Duration Card */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 p-2 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </span>
                Coupon Duration
              </h2>
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
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => setFormData({ ...formData, startDate: date })}
                          disabled={(date) => 
                            date < new Date() || 
                            (formData.endDate && date >= formData.endDate)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>End Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                        disabled={(date) => 
                          date < new Date() || 
                          (startTimeOption === 'scheduled' && formData.startDate && date <= formData.startDate)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {!isDateValid() && (
                    <p className="text-sm text-red-500">
                      Please select a valid end date that is after the start date
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Eligibility Card */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </span>
                Customer Eligibility
              </h2>
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
          </div>
        </div>

        {/* Products Selection Section - Full Width */}
        <div className="bg-white rounded-lg border p-6 shadow-sm mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-primary/10 p-2 rounded-lg">
              <Search className="h-5 w-5 text-primary" />
            </span>
            {couponType === 'special' ? 'Select Applicable Products' : 'Select Products to Discount'}
          </h2>
          
          {/* Improved search bar */}
          <div className="max-w-md mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                  <TableHead>STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span>Loading products...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No products found</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const isDiscounted = product.discount?.isActive;
                    const discountInfo = isDiscounted ? {
                      endDate: product.discount.endDate ? new Date(product.discount.endDate).toLocaleDateString() : 'Ongoing',
                      discountPercentage: `${product.discount.value}%`,
                      couponName: product.discount.couponName
                    } : null;

                    return (
                      <TableRow
                        key={product._id}
                        className={isDiscounted ? "bg-gray-50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product._id)}
                            onCheckedChange={(checked) => handleProductSelection(product._id, checked)}
                            disabled={isDiscounted}
                            className={isDiscounted ? "opacity-50 cursor-not-allowed" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.images[0]?.url || "/placeholder.svg"}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                            <div className="font-medium">{product.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <div className={isDiscounted ? "line-through text-gray-400" : ""}>
                            ₦ {product.price.toLocaleString()}
                          </div>
                          {isDiscounted && (
                            <div className="text-green-600 font-medium">
                              ₦ {product.discountedPrice.toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isDiscounted ? (
                            <span className="text-gray-400">N/A</span>
                          ) : (
                            <div>
                              ₦ {(product.price * (1 - (formData.discountPercentage / 100))).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isDiscounted && (
                            <div className="inline-flex items-center">
                              <Badge 
                                variant="secondary" 
                                className="bg-amber-50 text-amber-700 hover:bg-amber-50"
                              >
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>
                                    {Math.ceil(parseFloat(discountInfo.discountPercentage))}% off until {discountInfo.endDate}
                                  </span>
                                </div>
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-1"
                                onClick={() => {
                                  // Add a tooltip or modal here to show full discount details
                                  alert(`Current Discount Details:\nDiscount: ${discountInfo.discountPercentage} off\nEnds: ${discountInfo.endDate}\nCoupon: ${discountInfo.couponName}`)
                                }}
                              >
                                <InfoIcon className="h-4 w-4 text-gray-400" />
                              </Button>
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
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="min-w-[150px]"
            disabled={selectedProducts.length === 0 || isSubmitting || !isDateValid()}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Coupon...</span>
              </div>
            ) : (
              'Publish Coupon'
            )}
          </Button>
        </div>
      </form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              {couponType === 'special' ? 'Special Coupon Created' : 'Product Discount Created'}
            </DialogTitle>
            <DialogDescription>
              {couponType === 'special' 
                ? 'Your special coupon code has been created and is ready to use.'
                : 'Your product discounts have been created and are now active.'}
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
