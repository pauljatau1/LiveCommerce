import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, Loader2, Upload, X, Eye, Tag, Star, BarChart2, Package2, Store } from "lucide-react"
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

interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  storeName?: string;
  email: string;
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
  discount?: ProductDiscount;
  seller?: Seller;
  stats?: ProductStats;
  inventory?: ProductInventory;
  images: {
    url: string;
    _id?: string;
  }[];
  reviews?: any[];
}

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchProducts()
    fetchSellers()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/admin/products")
      setProducts(response.data)
    } catch (error) {
      toast.error("Failed to fetch products" + error)
    } finally {
      setLoading(false)
    }
  }

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
        `Successfully imported ${response.data.results.createdProducts.length} products. ${sellerName} has been notified via email with details.`,
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
    if (product.discount?.isActive && product.discount.type === 'percentage') {
      return product.discount.value;
    }
    if (product.price && product.discountedPrice && product.discountedPrice < product.price) {
      return Math.round(((product.price - product.discountedPrice) / product.price) * 100);
    }
    return 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Products</h2>
          <p className="text-muted-foreground">Manage your product inventory ({products.length} products)</p>
        </div>
        <div className="flex space-x-3">
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
              {products.map((product) => (
                <TableRow key={product._id || product.id} className="hover:bg-slate-50/5">
                  <TableCell className="align-top">
                    {product.images && product.images.length > 0 && (
                      <div className="relative group">
                        <div className="relative">
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md"
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
                      {product.visibility && (
                        <Badge variant="outline" className="text-xs w-fit">
                          {product.visibility.charAt(0).toUpperCase() + product.visibility.slice(1)}
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
                            <Button variant="outline" size="sm">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Product</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Product</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

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
