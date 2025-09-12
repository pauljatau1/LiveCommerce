import { useState, useEffect } from "react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group"
import { Checkbox } from "@/Components/ui/checkbox"
import { Button } from "@/Components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table"
import { Search } from "lucide-react"
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/Components/ui/badge"
import { InfoIcon } from "lucide-react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/Components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import PropTypes from "prop-types";
import { Command, CommandGroup, CommandItem, CommandList } from "@/Components/ui/command"
import { Check } from "lucide-react"

export default function Coupons() {
  // Add coupon type state
  const [couponType, setCouponType] = useState('product') // 'product' or 'special'
  
  // State management
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountPercentage: '',
    discountType: 'percentage',
    fixedAmount: '',
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginationData, setPaginationData] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  })
  const [priceWarnings, setPriceWarnings] = useState({})
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [warningProducts, setWarningProducts] = useState([])

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data

          const profileResponse = await axios.get(`${BASE_URL_V2}/sellers/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          const sellerId = profileResponse.data.data._id
          
          // Update to include pagination parameters
          const productsResponse = await axios.get(`${BASE_URL}/products/seller/${sellerId}`, {
            params: {
              page: currentPage,
              limit: itemsPerPage
            }
          })

          // Filter out products that are already on discount
          const availableProducts = productsResponse.data.products.map(product => ({
            ...product,
            isOnDiscount: product.discountEndDate && new Date(product.discountEndDate) > new Date(),
            discountEndDate: product.discountEndDate
          }))

          setSellerProducts(availableProducts)
          
          // Set pagination data
          setPaginationData({
            currentPage: productsResponse.data.currentPage || 1,
            totalPages: productsResponse.data.totalPages || 1,
            totalProducts: productsResponse.data.totalProducts || availableProducts.length
          })
        }
      } catch (error) {
        setError("Failed to fetch products: " + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerProducts()
  }, [currentPage, itemsPerPage]) // Add dependencies to re-fetch when page changes

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

  // Check for price warnings when fixed amount is used
  const checkPriceWarnings = () => {
    if (formData.discountType !== 'fixed' || !formData.fixedAmount) {
      setPriceWarnings({})
      return []
    }

    const warnings = {}
    const warningProductsList = []

    selectedProducts.forEach(productId => {
      const product = sellerProducts.find(p => p._id === productId)
      if (product) {
        const discountedPrice = Math.max(0, product.price - Number(formData.fixedAmount))
        const percentageOfOriginal = (discountedPrice / product.price) * 100

        if (percentageOfOriginal < 50) {
          warnings[productId] = {
            originalPrice: product.price,
            discountedPrice: discountedPrice,
            percentage: percentageOfOriginal,
            fixedAmount: Number(formData.fixedAmount)
          }
          warningProductsList.push({
            ...product,
            warning: warnings[productId]
          })
        }
      }
    })

    setPriceWarnings(warnings)
    return warningProductsList
  }

  // Update warnings when form data changes
  useEffect(() => {
    if (formData.discountType === 'fixed' && formData.fixedAmount && selectedProducts.length > 0) {
      checkPriceWarnings()
    } else {
      setPriceWarnings({})
    }
  }, [formData.discountType, formData.fixedAmount, selectedProducts, sellerProducts])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isDateValid()) {
      setError("Please set valid start and end dates");
      return;
    }

    // Check for price warnings before submission
    const warningProductsList = checkPriceWarnings()
    if (warningProductsList.length > 0) {
      setWarningProducts(warningProductsList)
      setShowWarningDialog(true)
      return
    }

    await submitCoupon()
  }

  // Separate function for actual submission
  const submitCoupon = async () => {
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
          discountType: formData.discountType,
          discountPercentage: formData.discountType === 'percentage' ? Number(formData.discountPercentage) : undefined,
          fixedAmount: formData.discountType === 'fixed' ? Number(formData.fixedAmount) : undefined,
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
          const discountedPrice = formData.discountType === 'percentage'
            ? product.price * (1 - (formData.discountPercentage / 100))
            : Math.max(0, product.price - Number(formData.fixedAmount || 0))
          return {
            productId,
            discountedPrice: Math.round(discountedPrice)
          }
        })

        const couponData = {
          name: formData.name,
          discountType: formData.discountType,
          discountPercentage: formData.discountType === 'percentage' ? Number(formData.discountPercentage) : undefined,
          fixedAmount: formData.discountType === 'fixed' ? Number(formData.fixedAmount) : undefined,
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
        discountType: 'percentage',
        fixedAmount: '',
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

  // Add pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  return (
    <div className=" mx-auto p-6">
      {/* Header Section with improved spacing and styling */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8 border-b pb-4">
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
        <h2 className="text-lg xl:text-xl font-semibold mb-4">Select Coupon Type</h2>
        <RadioGroup
          value={couponType}
          onValueChange={setCouponType}
          className="flex flex-wrap gap-4"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Coupon Details Card */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-lg xl:text-xl font-semibold mb-4 flex items-center gap-2">
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
                  <Label>Discount Type</Label>
                  <RadioGroup
                    value={formData.discountType}
                    onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="type-percentage" />
                      <Label htmlFor="type-percentage">Percentage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="type-fixed" />
                      <Label htmlFor="type-fixed">Fixed Amount</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.discountType === 'percentage' ? (
                  <div className="grid gap-3">
                    <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <div className="relative max-w-[200px]">
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                        className="pr-8"
                        placeholder="e.g., 15"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                    </div>
                    {/* <span className="text-sm text-gray-500">
                      Enter decimal values like 15.5 for 15.5% discount
                    </span> */}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <Label htmlFor="fixedAmount">Fixed Amount (₦)</Label>
                    <div className="relative max-w-[200px]">
                      <Input
                        id="fixedAmount"
                        type="number"
                        min="0"
                        value={formData.fixedAmount}
                        onChange={(e) => setFormData({...formData, fixedAmount: e.target.value})}
                        className="pr-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Restrictions Card */}
            {couponType === 'product' && (
              <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h2 className="text-lg xl:text-xl font-semibold mb-4 flex items-center gap-2">
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
              <h2 className="text-lg xl:text-xl font-semibold mb-4 flex items-center gap-2">
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
              <h2 className="text-lg xl:text-xl font-semibold mb-4 flex items-center gap-2">
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
          <h2 className="text-lg xl:text-xl font-semibold mb-4 flex items-center gap-2">
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
                        className={`${isDiscounted ? "bg-gray-50" : ""} ${priceWarnings[product._id] ? "bg-red-50 border-l-4 border-l-red-400" : ""}`}
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
                            <div className="space-y-1">
                              <div className={priceWarnings[product._id] ? "text-red-600 font-medium" : ""}>
                                ₦ {(formData.discountType === 'percentage'
                                  ? product.price * (1 - (formData.discountPercentage / 100))
                                  : Math.max(0, product.price - Number(formData.fixedAmount || 0))
                                ).toLocaleString()}
                              </div>
                              {priceWarnings[product._id] && (
                                <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                                  ⚠️ {priceWarnings[product._id].percentage.toFixed(1)}% of original price
                                </div>
                              )}
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
            <div className="p-4 border-t text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                Showing {filteredProducts.length} of {paginationData.totalProducts} items
              </div>
              
              {paginationData.totalPages > 1 && (
                <div className="flex items-center justify-center flex-wrap gap-3 w-full sm:w-auto">
                  {/* Mobile pagination display */}
                  <div className="flex sm:hidden items-center justify-center w-full">
                    <button 
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                      className={`flex-1 ${
                        currentPage <= 1 
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                          : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center justify-center gap-1 rounded-l-lg py-2 transition-all duration-300 ease-in-out`}
                    >
                      <span className="text-xs">Prev</span>
                    </button>
                    
                    <span className="px-4 py-2 text-xs bg-gray-50 border-t border-b border-gray-200">
                      Page {currentPage} of {paginationData.totalPages}
                    </span>
                    
                    <button 
                      onClick={handleNextPage}
                      disabled={currentPage >= paginationData.totalPages}
                      className={`flex-1 ${
                        currentPage >= paginationData.totalPages 
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                          : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center justify-center gap-1 rounded-r-lg py-2 transition-all duration-300 ease-in-out`}
                    >
                      <span className="text-xs">Next</span>
                    </button>
                  </div>
                  
                  {/* Desktop pagination controls */}
                  <div className="hidden sm:flex items-center justify-center gap-3">
                    <button 
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                      className={`text-xs sm:text-sm font-cabin font-normal ${
                        currentPage <= 1 
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                          : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                    >
                      <p className="text-xs sm:text-sm font-cabin font-normal">Previous</p>
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <span className="px-3 py-2 rounded-md bg-[#17171B] text-white">
                        {currentPage}
                      </span>
                      <span className="text-gray-600">of</span>
                      <span className="px-3 py-2 rounded-md border border-gray-200">
                        {paginationData.totalPages}
                      </span>
                    </div>
                    
                    <button 
                      onClick={handleNextPage}
                      disabled={currentPage >= paginationData.totalPages}
                      className={`text-xs sm:text-sm font-cabin font-normal ${
                        currentPage >= paginationData.totalPages 
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                          : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                    >
                      <p className="text-xs sm:text-sm font-cabin font-normal">Next</p>
                    </button>
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-xs sm:text-sm font-cabin font-normal text-[#ffffff] bg-[#17171B] flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap hover:bg-[#17171B]/90 transition-all duration-500 ease-in-out">
                        <p className="text-xs sm:text-sm font-cabin font-normal text-[#FFFFFF]">{itemsPerPage} per page</p>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            <CommandItem onSelect={() => handleItemsPerPageChange(10)}>
                              <span>10 per page</span>
                              {itemsPerPage === 10 && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            <CommandItem onSelect={() => handleItemsPerPageChange(20)}>
                              <span>20 per page</span>
                              {itemsPerPage === 20 && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            <CommandItem onSelect={() => handleItemsPerPageChange(50)}>
                              <span>50 per page</span>
                              {itemsPerPage === 50 && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isSubmitting}
            onClick={() => navigate(-1)}
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

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              Price Warning
            </DialogTitle>
            <DialogDescription>
              The following products will have their prices reduced to less than 50% of their original value:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Warning</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This coupon reduces the product price to less than 50% of its original value. 
                    Are you sure you want to proceed?
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-sm">Affected Products</h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {warningProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">Stock: {product.stock}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 line-through">
                        ₦ {product.warning.originalPrice.toLocaleString()}
                      </div>
                      <div className="font-medium text-red-600">
                        ₦ {product.warning.discountedPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-red-500">
                        {product.warning.percentage.toFixed(1)}% of original
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowWarningDialog(false)
                submitCoupon()
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Proceed Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

Coupons.propTypes = {
  couponType: PropTypes.string.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  selectedProducts: PropTypes.array.isRequired,
  setSelectedProducts: PropTypes.func.isRequired,
};
