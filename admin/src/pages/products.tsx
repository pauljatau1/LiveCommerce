import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, Loader2, Upload, X } from "lucide-react"
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

interface Product {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  status: string
  images: {
    url: string
  }[]
}

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [sellerId, setSellerId] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sellers, setSellers] = useState([])
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

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0])
  }

  const handleSellerChange = (e) => {
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

  const handleImport = async (e) => {
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
    } catch (error) {
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
          <p className="text-muted-foreground">Manage your product inventory</p>
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
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell>
                  {product.images && product.images.length > 0 && (
                    <img 
                      src={product.images[0].url} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  )}
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>NGN {product.price.toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
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
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                    {uploadStats.createdProducts.slice(0, 5).map((product) => (
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
