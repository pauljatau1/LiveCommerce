import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, Loader2, Upload, X, Eye, Tag, Star, BarChart2, Package2, Store, Info } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface Seller {
  _id: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  storeName?: string;
  email?: string;
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  businessInfo?: {
    businessName?: string;
    businessType?: string;
  };
  storeInfo?: {
    storeName?: string;
    aboutStore?: string;
    storeAvatar?: {
      url: string;
      public_id: string;
    };
    storeBanner?: {
      url: string;
      public_id: string;
    };
    categories?: string[];
    followerCount?: number;
  };
}

interface ProductStats {
  views?: number;
  soldCount?: number;
  averageRating?: number;
  reviewCount?: number;
}

interface ProductDiscount {
  isActive: boolean;
  type: string;
  value: number;
  discountedPrice?: number;
}

interface ProductInventory {
  quantity?: number;
  lowStockThreshold?: number;
  sku?: string;
}

interface Product {
  _id: string;
  id?: string;
  name: string;
  brand?: string;
  category: string;
  subCategory?: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  status: string;
  sku?: string;
  upc?: string;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
  condition?: string;
  description?: string;
  discount?: ProductDiscount;
  seller?: Seller;
  stats?: ProductStats;
  inventory?: ProductInventory;
  blips?: any[];
  variants?: any[];
  images: {
    url: string;
    _id?: string;
  }[];
  reviews?: any[];
  shippingInfo?: {
    weight?: {
      value?: number;
      unit?: string;
    };
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
  };
  returnPolicy?: {
    allowed?: boolean;
    periodInDays?: number;
    conditions?: string[];
  };
}

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [sellerId, setSellerId] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadStats, setUploadStats] = useState({
    createdProducts: [],
    totalProcessed: 0,
    errors: []
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProductDetails, setLoadingProductDetails] = useState(false)
  const [productDetailsOpen, setProductDetailsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showNoProductsConfirmation, setShowNoProductsConfirmation] = useState(false)
  const [showNoBlipsConfirmation, setShowNoBlipsConfirmation] = useState(false)

  // Pagination and filtering state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    productsPerPage: 15
  })
  
  // Keep current search input and the applied search params separate
  const [searchInput, setSearchInput] = useState('')
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  // Form state for filters
  const [filterInputs, setFilterInputs] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  useEffect(() => {
    setLoading(true)
    fetchProducts()
    fetchSellers()
    fetchCategories()
  }, [])

  // Update filter inputs when searchParams change (for consistency)
  useEffect(() => {
    setFilterInputs({
      category: searchParams.category,
      minPrice: searchParams.minPrice,
      maxPrice: searchParams.maxPrice,
      status: searchParams.status,
      sortBy: searchParams.sortBy,
      sortOrder: searchParams.sortOrder
    })
    setSearchInput(searchParams.query)
  }, [searchParams])

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/admin/categories")
      if (response.data) {
        const categoryNames = response.data.map((cat: any) => cat.name)
        setCategories(categoryNames)
      }
    } catch (error) {
      toast.error("Failed to fetch categories")
    }
  }

  const fetchProducts = async (isNewSearch = false) => {
    if (isNewSearch) {
      setIsSearching(true)
    } else if (pagination.currentPage === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    fetchProductsWithParams(searchParams, isNewSearch)
  }

  const fetchProductsWithParams = async (params: any, isNewSearch = false) => {
    try {
      const currentPage = isNewSearch ? 1 : pagination.currentPage
      
      // Determine if we should use search or regular endpoint
      const endpoint = params.query || 
                      params.category || 
                      params.minPrice || 
                      params.maxPrice || 
                      params.status
        ? "/api/admin/products/search"
        : "/api/admin/products"

      // Build query parameters
      const queryParams = {
        page: currentPage,
        limit: pagination.productsPerPage,
        ...(params.query && { query: params.query }),
        ...(params.category && { category: params.category }),
        ...(params.minPrice && { minPrice: params.minPrice }),
        ...(params.maxPrice && { maxPrice: params.maxPrice }),
        ...(params.status && { status: params.status }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder })
      }

      const response = await api.get(endpoint, { params: queryParams })
      
      // Update pagination data
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalProducts: response.data.totalProducts,
        productsPerPage: response.data.productsPerPage
      })

      // If this is a new search, replace products. Otherwise, append
      if (isNewSearch) {
        setProducts(response.data.products)
      } else {
        setProducts(prev => [...prev, ...response.data.products])
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch products"
      toast.error(errorMessage)
      // If error occurs, set empty products to prevent showing stale data
      if (isNewSearch) {
        setProducts([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsSearching(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))
      fetchProducts(false)
    }
  }

  // Handle search input change without triggering search
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  // Clear search input and trigger search with empty query
  const clearSearchInput = () => {
    setSearchInput('');
    
    // Create new search params with empty query
    const newSearchParams = {
      ...searchParams,
      query: ''
    };
    
    // Update state for consistency
    setSearchParams(newSearchParams);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setIsSearching(true);
    
    // Use the new params directly
    fetchProductsWithParams(newSearchParams, true);
    toast.success("Search cleared");
  };

  // Perform search when search button is clicked
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    
    // Create a new searchParams object with the current searchInput
    const newSearchParams = {
      ...searchParams,
      query: searchInput
    }
    
    // Set state for consistency but don't wait for it
    setSearchParams(newSearchParams)
    setIsSearching(true)
    
    // Use the new searchParams directly in the API call
    fetchProductsWithParams(newSearchParams, true)
  }

  // Handle Enter key press in search input - prevent search on Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent form submission
    }
  }

  // Handle filter changes without immediately applying them
  const handleFilterInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFilterInputs(prev => ({ ...prev, [name]: value }))
  }

  // Apply all filters at once
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    
    // Create a new search params object with current filter inputs
    const newSearchParams = {
      ...searchParams,
      ...filterInputs
    }
    
    // Set state for consistency but don't wait for it
    setSearchParams(newSearchParams)
    setIsSearching(true)
    
    // Use the new searchParams directly in the API call
    fetchProductsWithParams(newSearchParams, true)
  }

  // Reset all filters
  const resetFilters = () => {
    const resetValues = {
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    // Update all state for consistency
    setSearchInput('');
    setFilterInputs({
      category: '',
      minPrice: '',
      maxPrice: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchParams(resetValues);
    setIsSearching(true);
    
    // Use the reset values directly
    fetchProductsWithParams(resetValues, true);
    toast.success("All filters have been reset");
  };
  
  // Clear a single filter
  const clearFilter = (filterName: string) => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Create new search params with the cleared filter
    const newSearchParams = {
      ...searchParams,
      [filterName]: ''
    };
    
    // Update state for consistency
    setSearchParams(newSearchParams);
    setIsSearching(true);
    
    // Use the new params directly
    fetchProductsWithParams(newSearchParams, true);
    toast.success(`${filterName.charAt(0).toUpperCase() + filterName.slice(1)} filter cleared`);
  };

  const fetchSellers = async () => {
    try {
      setLoadingSellers(true)
      const response = await api.get("/api/admin/sellers")
      setSellers(response.data)
    } catch (error) {
      toast.error("Failed to fetch sellers")
    } finally {
      setLoadingSellers(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
    }
  }

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSellerId(e.target.value)
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/api/admin/products/csv-template', {
        responseType: 'blob'
      })
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'product_upload_template.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Template downloaded successfully')
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sellerId) {
      toast.error("Please select a seller")
      return
    }
    
    if (!csvFile) {
      toast.error("Please upload a CSV file")
      return
    }
    
    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('sellerId', sellerId)
      
      const response = await api.post('/api/admin/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Find the seller name for the success message
      const sellerName = sellers.find(s => s._id === sellerId)?.storeName || 
                        sellers.find(s => s._id === sellerId)?.businessName || 
                        'the seller'
      
      toast.success(
        `Successfully imported ${response.data.results.createdProducts.length} products${response.data.results.errors.length > 0 ? ` with ${response.data.results.errors.length} errors` : ''}. ${sellerName} has been notified via email with details.`,
        { duration: 5000 }
      )
      
      // Set success state with upload stats
      setUploadStats({
        createdProducts: response.data.results.createdProducts,
        totalProcessed: response.data.results.totalProcessed,
        errors: response.data.results.errors
      })
      setUploadSuccess(true)
      
      fetchProducts() // Refresh products list
    } catch (error: any) {
      toast.error("Failed to import products: " + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

  const resetUploadState = () => {
    setShowImportModal(false)
    setSellerId('')
    setCsvFile(null)
    setUploadSuccess(false)
    setUploadStats({
      createdProducts: [],
      totalProcessed: 0,
      errors: []
    })
  }

  // Format price to readable format with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Function to get the product discount percentage
  const getDiscountPercentage = (product: Product) => {
    if (!product.discount?.isActive || !product.discount.value) return 0;
    return product.discount.type === 'percentage' ? 
      product.discount.value : 
      Math.round((product.discount.value / product.price) * 100);
  }

  // Handle delete product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/admin/products/${productId}`);
      
      if (response.data.success) {
        toast.success("Product deleted successfully");
        // Remove the deleted product from the list
        setProducts(products.filter(product => product._id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
    }
  };

  // Handle disable product
  const handleDisableProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to disable "${productName}"? The product will be set to draft status.`)) {
      return;
    }

    try {
      const response = await api.put(`/api/admin/products/${productId}/disable`);
      
      if (response.data.success) {
        toast.success("Product disabled successfully");
        // Update the product status in the list
        setProducts(products.map(product => 
          product._id === productId ? { ...product, status: 'draft' } : product
        ));
      }
    } catch (error) {
      console.error("Error disabling product:", error);
      toast.error("Failed to disable product. Please try again.");
    }
  };

  // Send reminder emails to sellers without products
  const sendRemindersToSellersWithoutProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/admin/sellers/reminders/no-products');
      toast.success(response.data.message || 'Reminder emails sent to sellers without products');
      setShowNoProductsConfirmation(false);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error sending reminder emails:', error);
      toast.error(error.response?.data?.message || 'Failed to send reminder emails');
      setShowNoProductsConfirmation(false);
      setIsLoading(false);
    }
  };

  // Send reminder emails to sellers without blips
  const sendRemindersToSellersWithoutBlips = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/admin/sellers/reminders/no-blips');
      toast.success(response.data.message || 'Reminder emails sent to sellers without blips');
      setShowNoBlipsConfirmation(false);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error sending reminder emails:', error);
      toast.error(error.response?.data?.message || 'Failed to send reminder emails');
      setShowNoBlipsConfirmation(false);
      setIsLoading(false);
    }
  };

  // Function to fetch product details
  const fetchProductDetails = async (productId: string) => {
    setProductDetailsOpen(true)
    try {
      setLoadingProductDetails(true)
      const response = await api.get(`/api/products/${productId}`)
      setSelectedProduct(response.data)
    } catch (error) {
      console.error("Error fetching product details:", error)
      toast.error("Failed to load product details")
    } finally {
      setLoadingProductDetails(false)
    }
  }

  // Initial loading state for the entire page
  if (loading && pagination.currentPage === 1 && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-xl text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Products</h2>
          <p className="text-muted-foreground">Manage your product inventory ({pagination.totalProducts} products)</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={showNoProductsConfirmation} onOpenChange={setShowNoProductsConfirmation}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <Info className="h-4 w-4 mr-2" />
                Remind No Products
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send Reminder Emails</DialogTitle>
                <DialogDescription>
                  This will send reminder emails to all sellers who have not uploaded any products yet.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to send reminder emails to all sellers without products? This action cannot be undone.
                </p>
              </div>
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="button" 
                  className="bg-amber-600 hover:bg-amber-700" 
                  onClick={sendRemindersToSellersWithoutProducts}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Info className="h-4 w-4 mr-2" />}
                  Send Reminders
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNoBlipsConfirmation} onOpenChange={setShowNoBlipsConfirmation}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Store className="h-4 w-4 mr-2" />
                Remind No Blips
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send Reminder Emails</DialogTitle>
                <DialogDescription>
                  This will send reminder emails to all sellers who have products but no blips.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to send reminder emails to all sellers without blips? This action cannot be undone.
                </p>
              </div>
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="button" 
                  className="bg-emerald-600 hover:bg-emerald-700" 
                  onClick={sendRemindersToSellersWithoutBlips}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Store className="h-4 w-4 mr-2" />}
                  Send Reminders
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline" 
            className="bg-slate-700 text-white hover:bg-slate-800"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            onClick={() => setShowImportModal(true)} 
            variant="outline" 
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          {/* <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button> */}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products by name, description or SKU..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyPress}
              className="w-full px-4 py-3 rounded-md border border-gray-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchInput && (
              <button 
                onClick={clearSearchInput}
                className="absolute right-[110px] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 py-1 px-4 h-10 text-base font-medium"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                name="category"
                value={filterInputs.category}
                onChange={handleFilterInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={filterInputs.status}
                onChange={handleFilterInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="offline_auction">Offline Auction</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
              <select
                name="sortBy"
                value={filterInputs.sortBy}
                onChange={handleFilterInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-white"
              >
                <option value="created">Date Created</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="popularity">Popularity</option>
                <option value="sold">Sales</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
              <select
                name="sortOrder"
                value={filterInputs.sortOrder}
                onChange={handleFilterInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Min Price (₦)</label>
              <input
                type="number"
                name="minPrice"
                value={filterInputs.minPrice}
                onChange={handleFilterInputChange}
                placeholder="Minimum price"
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Price (₦)</label>
              <input
                type="number"
                name="maxPrice"
                value={filterInputs.maxPrice}
                onChange={handleFilterInputChange}
                placeholder="Maximum price"
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-white"
              />
            </div>
            
            <div className="md:col-span-2 flex items-end justify-end space-x-3">
              <Button
                onClick={resetFilters}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-slate-700"
              >
                Reset All
              </Button>
              <Button
                onClick={applyFilters}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Filters"}
              </Button>
            </div>
          </div>
        )}

        {/* Active filters display */}
        {(searchParams.query || searchParams.category || searchParams.status || searchParams.minPrice || searchParams.maxPrice) && (
          <div className="flex flex-wrap gap-2 items-center py-2">
            <span className="text-sm text-gray-400">Active filters:</span>
            {searchParams.query && (
              <Badge className="bg-slate-700 text-white hover:bg-slate-600 cursor-pointer" onClick={() => clearFilter('query')}>
                Search: {searchParams.query} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {searchParams.category && (
              <Badge className="bg-slate-700 text-white hover:bg-slate-600 cursor-pointer" onClick={() => clearFilter('category')}>
                Category: {searchParams.category} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {searchParams.status && (
              <Badge className="bg-slate-700 text-white hover:bg-slate-600 cursor-pointer" onClick={() => clearFilter('status')}>
                Status: {searchParams.status} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {searchParams.minPrice && (
              <Badge className="bg-slate-700 text-white hover:bg-slate-600 cursor-pointer" onClick={() => clearFilter('minPrice')}>
                Min Price: ₦{searchParams.minPrice} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {searchParams.maxPrice && (
              <Badge className="bg-slate-700 text-white hover:bg-slate-600 cursor-pointer" onClick={() => clearFilter('maxPrice')}>
                Max Price: ₦{searchParams.maxPrice} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {(searchParams.sortBy !== 'createdAt' || searchParams.sortOrder !== 'desc') && (
              <Badge className="bg-slate-700 text-white hover:bg-slate-600 cursor-pointer" onClick={() => {
                setSearchParams(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }))
                fetchProducts(true)
              }}>
                Sorting: {searchParams.sortBy} ({searchParams.sortOrder}) <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sales & Analytics</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24">
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Filtering products...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No products found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product._id || product.id} className="hover:bg-slate-50/5">
                    <TableCell className="align-top">
                      {product.images && product.images.length > 0 && (
                        <div className="relative group">
                          <div className="relative">
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className={`w-16 h-16 object-cover rounded-md ${product.images.length > 1 ? 'col-span-2 row-span-2' : ''}`}
                            />
                            {product.images.length > 1 && (
                              <Badge className="absolute -top-2 -right-2 bg-slate-700 text-white text-xs">
                                +{product.images.length - 1}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm mb-1">{product.name}</span>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>ID: {product._id || product.id}</span>
                          {product.sku && <span>SKU: {product.sku}</span>}
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700">
                              {product.category}
                            </Badge>
                            {product.subCategory && (
                              <Badge variant="outline" className="text-xs">
                                {product.subCategory}
                              </Badge>
                            )}
                          </div>
                          {product.brand && (
                            <span className="mt-1 text-xs">Brand: {product.brand}</span>
                          )}
                          {product.seller && (
                            <div className="mt-1 flex items-center">
                              <span className="text-xs inline-flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                {product.seller.storeName || product.seller.businessName || `${product.seller.firstName} ${product.seller.lastName}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatPrice(product.price)}</span>
                          {product.discount?.isActive && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              -{getDiscountPercentage(product)}%
                            </Badge>
                          )}
                        </div>
                        {product.discount?.isActive && product.discount.discountedPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.stock}</span>
                          <span className="text-xs text-muted-foreground">units</span>
                        </div>
                        {product.inventory?.lowStockThreshold && (
                          <span className="text-xs text-muted-foreground">
                            Low stock alert: {product.inventory.lowStockThreshold}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center w-fit ${
                          product.stock > 20 
                            ? 'bg-green-100 text-green-800'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 20 
                            ? 'In Stock' 
                            : product.stock > 0 
                            ? 'Low Stock'
                            : 'Out of Stock'}
                        </span>
                        {product.status === 'active' && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 w-fit">
                            Active
                          </Badge>
                        )}
                        {product.status === 'draft' && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-800 w-fit">
                            Draft
                          </Badge>
                        )}
                        {product.status === 'offline_auction' && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 w-fit">
                            Offline Auction
                          </Badge>
                        )}
                        
                        {product.condition && (
                          <Badge variant="outline" className="text-xs capitalize w-fit">
                            {product.condition}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col text-xs gap-1">
                        <div className="flex items-center gap-1">
                          <Package2 className="h-3 w-3 text-blue-500" />
                          <span>{product.stats?.soldCount || 0} sold</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-purple-500" />
                          <span>{product.stats?.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span>{product.stats?.averageRating || 0} rating ({product.stats?.reviewCount || 0})</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-500 hover:text-blue-600"
                                onClick={() => fetchProductDetails(product._id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Product Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteProduct(product._id, product.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Product</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-amber-500 hover:text-amber-600"
                                onClick={() => handleDisableProduct(product._id, product.name)}
                              >
                                <Tag className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Disable Product</p>
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

          {/* Loading spinner for initial load */}
          {loading && pagination.currentPage === 1 && (
            <div className="flex flex-col items-center justify-center my-8 py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          )}

          {/* Pagination controls */}
          {!loading && products.length > 0 && pagination.currentPage < pagination.totalPages && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Products
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Pagination info */}
          <div className="mt-4 text-center text-sm text-gray-400">
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching products...</span>
              </div>
            ) : (
              <span>Showing {products.length} of {pagination.totalProducts} products</span>
            )}
          </div>
        </div>
      </Card>

      {/* Product Details Modal */}
      <Dialog open={productDetailsOpen} onOpenChange={setProductDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
          {loadingProductDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-slate-400">Loading product details...</p>
            </div>
          ) : selectedProduct ? (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl text-white">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="flex flex-wrap gap-2 mt-2 text-slate-300">
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {selectedProduct.category}
                  </Badge>
                  {selectedProduct.subCategory && (
                    <Badge variant="outline" className="border-slate-700 text-slate-300">{selectedProduct.subCategory}</Badge>
                  )}
                  {selectedProduct.brand && (
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">{selectedProduct.brand}</Badge>
                  )}
                  <Badge className={`${
                    selectedProduct.status === 'active' ? 'bg-green-900 text-green-300' :
                    selectedProduct.status === 'draft' ? 'bg-amber-900 text-amber-300' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Images */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-slate-300">Product Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      selectedProduct.images.map((image, index) => (
                        <div key={image._id || index} className="relative aspect-square">
                          <img 
                            src={image.url} 
                            alt={`${selectedProduct.name} - Image ${index + 1}`}
                            className={`w-full h-full object-cover rounded-md ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 bg-slate-800 flex items-center justify-center rounded-md p-4 h-40">
                        <p className="text-slate-500">No images available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Variants */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2 text-slate-300">Variants</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.variants.map((variant, index) => (
                          <div key={variant._id || index} className="flex flex-col items-center">
                            {variant.images && variant.images.length > 0 && (
                              <div className="w-12 h-12 rounded-md overflow-hidden mb-1">
                                <img 
                                  src={variant.images[0].data} 
                                  alt={variant.value}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <span className="text-xs text-slate-300">{variant.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Blips */}
                  {selectedProduct.blips && selectedProduct.blips.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2 text-slate-300">Blips ({selectedProduct.blips.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.blips.map((blip, index) => (
                          <div key={blip._id || index} className="relative">
                            <div className="w-16 h-28 bg-slate-800 rounded-md overflow-hidden">
                              {blip.thumbnail ? (
                                <img 
                                  src={blip.thumbnail} 
                                  alt={`Blip ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <span className="text-xs text-slate-500">Blip</span>
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-slate-800 bg-opacity-80 text-white text-xs px-1 rounded-sm">
                              {blip.viewCount || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="space-y-6">
                  {/* Price Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-slate-300">Pricing</h4>
                    <div className="bg-slate-800 p-4 rounded-md">
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{formatPrice(selectedProduct.price)}</span>
                        {selectedProduct.discount?.isActive && (
                          <Badge className="bg-red-900 text-red-300 mb-1">
                            -{getDiscountPercentage(selectedProduct)}%
                          </Badge>
                        )}
                      </div>
                      {selectedProduct.discount?.isActive && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(selectedProduct.price)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Inventory Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-slate-300">Inventory</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800 p-4 rounded-md">
                        <span className="text-sm text-slate-400">Current Stock</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-semibold text-white">{selectedProduct.stock}</span>
                          <span className="text-xs text-slate-400">units</span>
                        </div>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-md">
                        <span className="text-sm text-slate-400">SKU</span>
                        <div className="mt-1">
                          <span className="text-sm font-medium text-white">{selectedProduct.sku || "N/A"}</span>
                        </div>
                      </div>
                      {selectedProduct.upc && (
                        <div className="bg-slate-800 p-4 rounded-md">
                          <span className="text-sm text-slate-400">UPC</span>
                          <div className="mt-1">
                            <span className="text-sm font-medium text-white">{selectedProduct.upc}</span>
                          </div>
                        </div>
                      )}
                      {selectedProduct.inventory?.lowStockThreshold && (
                        <div className="bg-slate-800 p-4 rounded-md">
                          <span className="text-sm text-slate-400">Low Stock Alert</span>
                          <div className="mt-1">
                            <span className="text-sm font-medium text-white">{selectedProduct.inventory.lowStockThreshold} units</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Seller Information */}
                  {selectedProduct.seller && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-slate-300">Seller Information</h4>
                      <div className="bg-slate-800 p-4 rounded-md">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-white">
                            {selectedProduct.seller.personalInfo?.firstName && selectedProduct.seller.personalInfo?.lastName ? 
                              `${selectedProduct.seller.personalInfo.firstName} ${selectedProduct.seller.personalInfo.lastName}` :
                             selectedProduct.seller.storeInfo?.storeName || 
                             selectedProduct.seller.businessInfo?.businessName || 
                             'Unknown Seller'}
                          </span>
                        </div>
                        {selectedProduct.seller.storeInfo?.aboutStore && (
                          <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                            {selectedProduct.seller.storeInfo.aboutStore}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Analytics */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-slate-300">Analytics</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800 p-3 rounded-md flex flex-col items-center">
                        <Package2 className="h-4 w-4 text-blue-400 mb-1" />
                        <span className="text-lg font-semibold text-white">{selectedProduct.stats?.soldCount || 0}</span>
                        <span className="text-xs text-slate-400">Sold</span>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-md flex flex-col items-center">
                        <Eye className="h-4 w-4 text-purple-400 mb-1" />
                        <span className="text-lg font-semibold text-white">{selectedProduct.stats?.views || 0}</span>
                        <span className="text-xs text-slate-400">Views</span>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-md flex flex-col items-center">
                        <Star className="h-4 w-4 text-amber-400 mb-1" />
                        <span className="text-lg font-semibold text-white">{selectedProduct.stats?.averageRating || 0}</span>
                        <span className="text-xs text-slate-400">Rating ({selectedProduct.stats?.reviewCount || 0})</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping & Return */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.shippingInfo && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-slate-300">Shipping</h4>
                        <div className="bg-slate-800 p-4 rounded-md text-sm">
                          {selectedProduct.shippingInfo.weight && (
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-400">Weight:</span>
                              <span className="text-white">{selectedProduct.shippingInfo.weight.value} {selectedProduct.shippingInfo.weight.unit}</span>
                            </div>
                          )}
                          {selectedProduct.shippingInfo.dimensions && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Dimensions:</span>
                              <span className="text-white">
                                {selectedProduct.shippingInfo.dimensions.length} × {selectedProduct.shippingInfo.dimensions.width} × {selectedProduct.shippingInfo.dimensions.height}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedProduct.returnPolicy && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-slate-300">Return Policy</h4>
                        <div className="bg-slate-800 p-4 rounded-md text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Returns:</span>
                            <span className="text-white">{selectedProduct.returnPolicy.allowed ? 'Allowed' : 'Not Allowed'}</span>
                          </div>
                          {selectedProduct.returnPolicy.allowed && selectedProduct.returnPolicy.periodInDays && (
                            <div className="flex justify-between mt-1">
                              <span className="text-slate-400">Return Period:</span>
                              <span className="text-white">{selectedProduct.returnPolicy.periodInDays} days</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Product Description */}
              {selectedProduct.description && (
                <div className="mt-6">
                  <Separator className="mb-4 bg-slate-700" />
                  <h3 className="text-lg font-medium mb-2 text-white">Product Description</h3>
                  <div 
                    className="prose prose-sm max-w-none text-slate-300 bg-slate-800 p-4 rounded-md prose-headings:text-white prose-strong:text-white prose-a:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                  />
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white">Close</Button>
                </DialogClose>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Info className="h-8 w-8 text-slate-500 mb-4" />
              <p className="text-slate-400">No product details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            <button 
              onClick={resetUploadState}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            {uploadSuccess ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center text-green-600">Upload Successful!</h3>
                
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-medium">Products Processed:</span>
                    <span>{uploadStats.totalProcessed}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-medium">Products Created:</span>
                    <span className="text-green-600 font-semibold">{uploadStats.createdProducts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Errors:</span>
                    <span className={uploadStats.errors.length > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                      {uploadStats.errors.length}
                    </span>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                  <h4 className="font-medium mb-2">Product Preview</h4>
                  <ul className="space-y-2">
                    {uploadStats.createdProducts.slice(0, 5).map((product: any) => (
                      <li key={product.id} className="flex items-center gap-2 border-b pb-2">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">₦{product.price} • {product.category}</p>
                        </div>
                      </li>
                    ))}
                    {uploadStats.createdProducts.length > 5 && (
                      <li className="text-sm text-gray-500 italic text-center">
                        and {uploadStats.createdProducts.length - 5} more products...
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Error details section */}
                {uploadStats.errors.length > 0 && (
                  <div className="border border-red-200 rounded-md p-4 max-h-[200px] overflow-y-auto bg-red-50">
                    <h4 className="font-medium mb-2 text-red-700">Failed Products</h4>
                    <table className="w-full text-sm">
                      <thead className="text-xs text-red-700 uppercase bg-red-100">
                        <tr>
                          <th className="py-2 px-1 text-left">Row</th>
                          <th className="py-2 px-1 text-left">Product</th>
                          <th className="py-2 px-1 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadStats.errors.slice(0, 10).map((error: any, index: number) => (
                          <tr key={index} className="border-b border-red-200">
                            <td className="py-2 px-1">{error.row}</td>
                            <td className="py-2 px-1">{error.productName || 'N/A'}</td>
                            <td className="py-2 px-1 text-red-600">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {uploadStats.errors.length > 10 && (
                      <p className="text-sm text-gray-500 italic text-center mt-2">
                        and {uploadStats.errors.length - 10} more errors...
                      </p>
                    )}
                  </div>
                )}
                
                <div className="p-3 bg-amber-50 rounded-md text-sm text-amber-700 border-l-4 border-amber-400">
                  <p className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Default weight of 0.5kg has been assigned to products with no specified weight.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    The seller has been notified by email with product details.
                  </p>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={resetUploadState}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Import Products via CSV</h3>
                
                <form onSubmit={handleImport} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Seller
                    </label>
                    <select 
                      value={sellerId}
                      onChange={handleSellerChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={loadingSellers || uploading}
                    >
                      <option value="">Select a seller</option>
                      {sellers.map(seller => (
                        <option key={seller._id} value={seller._id}>
                          {seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload CSV File
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">CSV file only</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".csv" 
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {csvFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {csvFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                      disabled={uploading}
                    >
                      Download Template
                    </button>
                    
                    <Button 
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : "Import Products"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
