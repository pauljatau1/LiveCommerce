import { Card, CardContent } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Button } from "@/Components/ui/button"
import { Textarea } from "@/Components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Checkbox } from "@/Components/ui/checkbox"
import { Search, Trash2, HelpCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function CreateCampaign() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    audienceType: "all", // Default to all followers
    message: "",
    selectedProducts: [],
    scheduledFor: null
  })
  
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginationData, setPaginationData] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  })
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Fetch products with optional search
  const fetchProducts = async (page = currentPage, search = "") => {
    setLoading(true)
    try {
      const sellerString = localStorage.getItem('seller')
      let sellerId
      
      if (!sellerString) {
        // If seller isn't in localStorage, get it from the profile
        const sellerToken = localStorage.getItem('sellerToken')
        if (!sellerToken) {
          throw new Error("Authentication token not found")
        }
        
        const tokenData = JSON.parse(sellerToken)
        const token = tokenData.data

        // Get seller profile
        const profileResponse = await axios.get(`${BASE_URL_V2}/sellers/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        sellerId = profileResponse.data.data._id

        // Save seller ID to localStorage
        localStorage.setItem('seller', JSON.stringify({ _id: sellerId }))
      } else {
        // Use seller ID from localStorage
        sellerId = JSON.parse(sellerString)._id
      }

      // Build API endpoint and params
      let endpoint = `${BASE_URL}/products/seller/${sellerId}`
      let params = {
        page: page,
        limit: itemsPerPage,
        sortBy: 'newest'
      }
      
      // If search term exists, use search endpoint
      if (search) {
        endpoint = `${BASE_URL}/products/seller/${sellerId}/search`
        params.query = search
      }
      
      console.log(`Fetching products from ${endpoint} with params:`, params)
      
      const productsResponse = await axios.get(endpoint, { params })
      
      console.log("Products API Response:", productsResponse.data)
      
      // Set products
      if (productsResponse.data) {
        // Handle different response formats
        if (Array.isArray(productsResponse.data.products)) {
          setProducts(productsResponse.data.products)
        } else if (Array.isArray(productsResponse.data.data)) {
          // Search endpoint might return data in a different format
          setProducts(productsResponse.data.data)
        } else {
          console.error("Unknown response format:", productsResponse.data)
          setProducts([])
        }
        
        // Handle pagination data (also handle different formats)
        if (productsResponse.data.pagination) {
          setPaginationData({
            currentPage: productsResponse.data.pagination.currentPage || page,
            totalPages: productsResponse.data.pagination.totalPages || 1,
            totalProducts: productsResponse.data.pagination.totalProducts || 0
          })
        } else {
          setPaginationData({
            currentPage: productsResponse.data.currentPage || page,
            totalPages: productsResponse.data.totalPages || 1,
            totalProducts: productsResponse.data.totalProducts || 0
          })
        }
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError("Failed to fetch data: " + error.message)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchProducts(currentPage, searchQuery)
  }, [currentPage])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearch = (e) => {
    e.preventDefault() // Prevent form submission
    setIsSearching(true)
    setCurrentPage(1) // Reset to first page on new search
    fetchProducts(1, searchQuery)
  }

  const clearSearch = (e) => {
    e.preventDefault() // Prevent form submission
    setSearchQuery("")
    setCurrentPage(1)
    fetchProducts(1, "")
  }

  const handleProductSelect = (productId) => {
    setFormData(prev => {
      const selectedProducts = prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]

      return {
        ...prev,
        selectedProducts
      }
    })
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error("Please enter a campaign name")
      return
    }
    
    if (!formData.message.trim()) {
      toast.error("Please enter a message for your campaign")
      return
    }
    
    if (formData.selectedProducts.length === 0) {
      toast.error("Please select at least one product")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
      const response = await axios.post(
        `${BASE_URL}/campaigns`,
        formData,
        {
          headers: { Authorization: `Bearer ${sellerToken}` }
        }
      )
      
      console.log("Campaign created response:", response.data)
      toast.success("Campaign created successfully")
      navigate("/dashboard/inbox-campaigns/list")
    } catch (error) {
      console.error("Campaign creation error:", error)
      toast.error(error.response?.data?.message || "Failed to create campaign")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreviousPage = (e) => {
    e.preventDefault() // Prevent form submission
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = (e) => {
    e.preventDefault() // Prevent form submission
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div className="space-y-2">
          <Label htmlFor="title">Campaign Name</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Announcing a Live Shopping Event"
            required
          />
        </div>

        {/* Message Content */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Message Content</h2>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" placeholder="Exclusive Deals Up to 50% Off!" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="body">Body</Label>
                <div className="flex items-center text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Attach Media
                </div>
              </div>
              <Textarea
                id="body"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Hi Oscar,

We have an ongoing promo for our followers this week.
Enjoy 50% off your next purchase for the next 7 days.

Click here to shop: www.augli.live"
                className="min-h-[200px]"
                required
              />
              <p className="text-sm text-muted-foreground">
                * Only Augli URL, No phone number or Instagram usernames or competitors allowed
              </p>
            </div>

            {/* Media Preview */}
            <div className="space-y-2">
              {selectedImage ? (
                <div className="relative w-24 h-24">
                  <img 
                    src={selectedImage} 
                    alt="Media preview" 
                    className="w-24 h-24 rounded-lg object-cover" 
                  />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveImage}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="text-center">
                      <div className="flex justify-center">
                        <HelpCircle className="h-6 w-6 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-500">Upload Image</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Select Products */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Select Products</h2>

            {/* Search Form */}
            <div className="relative mb-4 flex">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  className="pl-10 pr-3" 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleSearch} 
                className="ml-2 bg-[#0BB248] hover:bg-[#0BB248]/90"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : "Search"}
              </Button>
              {searchQuery && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearSearch} 
                  className="ml-2"
                  disabled={isSearching}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="rounded-lg border">
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50">
                <div className="col-span-6">
                  <div className="text-sm font-medium">PRODUCTS</div>
                </div>
                <div className="col-span-3 text-sm font-medium">TOTAL AVAILABLE</div>
                <div className="col-span-3 text-sm font-medium">AMOUNT</div>
              </div>

              <div className="divide-y">
                {loading ? (
                  <div className="p-4 text-center flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0BB248]" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-500">{error}</div>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <div key={product._id} className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-6">
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            checked={formData.selectedProducts.includes(product._id)}
                            onCheckedChange={() => handleProductSelect(product._id)}
                          />
                          <img
                            src={product.images?.[0]?.url || "/placeholder.svg"}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </div>
                      <div className="col-span-3">{product.stock || 0}</div>
                      <div className="col-span-3">N {(product.price || 0).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">No products found</div>
                )}
              </div>
            </div>

            {/* Pagination controls */}
            {!loading && products.length > 0 && (
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                <span>Showing {products.length} items out of {paginationData.totalProducts} results found</span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1}
                    type="button"
                  >
                    <span className="sr-only">Previous page</span>←
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {paginationData.totalPages}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleNextPage}
                    disabled={currentPage >= paginationData.totalPages}
                    type="button"
                  >
                    <span className="sr-only">Next page</span>→
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate("/dashboard/inbox-campaigns/list")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : "Publish Campaign"}
          </Button>
        </div>
      </form>
    </div>
  )
}

