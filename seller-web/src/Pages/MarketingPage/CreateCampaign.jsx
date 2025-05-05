import { Card, CardContent } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Button } from "@/Components/ui/button"
import { Textarea } from "@/Components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Checkbox } from "@/Components/ui/checkbox"
import { Search, Trash2, HelpCircle } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { BASE_URL } from "@/Constants/Server"
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
    audienceType: "all",
    message: "",
    selectedProducts: [],
    scheduledFor: null
  })

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data

          const profileResponse = await axios.get(`${BASE_URL}/seller/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          const sellerId = profileResponse.data._id
          console.log("Current Seller ID:", sellerId)

          // Fetch seller's products
          const productsResponse = await axios.get(`${BASE_URL}/products/seller/${sellerId}`)
          setProducts(productsResponse.data.products)
        }
      } catch (error) {
        setError("Failed to fetch data: " + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerData()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
      await axios.post(
        `${BASE_URL}/campaigns`,
        formData,
        {
          headers: { Authorization: `Bearer ${sellerToken}` }
        }
      )
      
      toast.success("Campaign created successfully")
      navigate("/dashboard/inbox-campaigns/list")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create campaign")
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
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Select
            name="audienceType"
            value={formData.audienceType}
            onValueChange={(value) => handleInputChange({ target: { name: 'audienceType', value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All followers</SelectItem>
              <SelectItem value="active">Active followers</SelectItem>
              <SelectItem value="inactive">Inactive followers</SelectItem>
            </SelectContent>
          </Select>
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

        {/* Send Frequency */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Send Frequency</h2>
            <RadioGroup defaultValue="recipient-time">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time">One-time (Default)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recipient-time" id="recipient-time" />
                <Label htmlFor="recipient-time">Send based on recipient's local time</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Select Products */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Select Products</h2>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input className="pl-10" placeholder="Search" />
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
                  <div className="p-4 text-center">Loading products...</div>
                ) : error ? (
                  <div className="p-4 text-center text-red-500">{error}</div>
                ) : (
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
                      <div className="col-span-3">{product.stock}</div>
                      <div className="col-span-3">N {product.price.toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>Showing 10 items out of 250 results found</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Previous page</span>←
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Next page</span>→
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate("/dashboard/inbox-campaigns/list")}
          >
            Cancel
          </Button>
          <Button type="submit">Publish Campaign</Button>
        </div>
      </form>
    </div>
  )
}

