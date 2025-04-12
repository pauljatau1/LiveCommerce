import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, Percent, Package2, ShoppingCart, Eye, BarChart2, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import AddCategoryModal from "@/components/dashboard/add-category-modal"
import { toast } from "sonner"
import { api } from "@/api/axios"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface SubSubCategory {
  name: string
  _id: string
}

interface SubCategory {
  name: string
  _id: string
  subSubCategories: SubSubCategory[]
}

interface CategoryStatistics {
  orders?: {
    pending?: number;
    completed?: number;
  };
  items?: {
    pending?: number;
    sold?: number;
  };
  streams?: {
    active?: number;
    scheduled?: number;
    ended?: number;
  };
  totalProducts?: number;
}

interface Category {
  _id: string
  name: string
  image: {
    url: string
    public_id?: string
  }
  platformFee: number
  subCategories: SubCategory[]
  statistics?: CategoryStatistics
  createdAt?: string
  updatedAt?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [loading, setLoading] = useState(true)
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({})
  const [editingFee, setEditingFee] = useState<{id: string, fee: number} | null>(null)

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/admin/categories")
      setCategories(response.data)
    } catch (error) {
      toast.error("Failed to fetch categories" + error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/categories/${id}`)
      toast.success("Category deleted successfully")
      fetchCategories()
    } catch (error) {
      toast.error("Failed to delete category" + error)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCategory(undefined)
    setModalMode('add')
  }

  const handleAddNew = () => {
    setSelectedCategory(undefined)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const toggleSubCategory = (categoryId: string) => {
    setExpandedSubCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handleUpdatePlatformFee = async (categoryId: string) => {
    if (!editingFee) return;
    
    try {
      await api.put(`/api/admin/categories/${categoryId}/platform-fee`, {
        platformFee: Number(editingFee.fee)
      });
      toast.success("Platform fee updated successfully");
      setEditingFee(null);
      fetchCategories();
    } catch (error) {
      toast.error("Failed to update platform fee: " + error);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl text-white font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories ({categories.length} total)</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add New Category
        </Button>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <Card key={category._id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
              <div className="w-full md:w-32 h-40 md:h-32 flex-shrink-0">
                <img
                  src={category.image.url}
                  alt={category.name}
                  className="object-cover rounded-md w-full h-full"
                />
              </div>
              
              <div className="flex-grow space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    {category.createdAt && (
                      <p className="text-xs text-muted-foreground">Created: {formatDate(category.createdAt)}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editingFee?.id === category._id ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingFee.fee}
                            onChange={(e) => setEditingFee({ id: category._id, fee: parseFloat(e.target.value) })}
                            className="w-24"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePlatformFee(category._id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFee(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-secondary px-3 py-1 rounded-md flex items-center gap-1">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span>{category.platformFee}% Platform Fee</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingFee({ id: category._id, fee: category.platformFee })}
                        >
                          Edit Fee
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics Section */}
                {category.statistics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-secondary/20 rounded-md p-3 flex flex-col">
                      <div className="flex items-center gap-1 text-xs md:text-sm font-medium mb-2">
                        <Package2 className="h-4 w-4 text-blue-500" />
                        <span>Products</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">{category.statistics.totalProducts || 0}</span>
                        <Badge variant="outline" className="text-xs">Total</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-secondary/20 rounded-md p-3 flex flex-col">
                      <div className="flex items-center gap-1 text-xs md:text-sm font-medium mb-2">
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                        <span>Orders</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
                            Pending
                          </span>
                          <span>{category.statistics.orders?.pending || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
                            Completed
                          </span>
                          <span>{category.statistics.orders?.completed || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-secondary/20 rounded-md p-3 flex flex-col">
                      <div className="flex items-center gap-1 text-xs md:text-sm font-medium mb-2">
                        <BarChart2 className="h-4 w-4 text-purple-500" />
                        <span>Sales</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-1"></div>
                            Pending
                          </span>
                          <span>{category.statistics.items?.pending || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
                            Sold
                          </span>
                          <span>{category.statistics.items?.sold || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-secondary/20 rounded-md p-3 flex flex-col">
                      <div className="flex items-center gap-1 text-xs md:text-sm font-medium mb-2">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        <span>Streams</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
                            Active
                          </span>
                          <span>{category.statistics.streams?.active || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-1"></div>
                            Scheduled
                          </span>
                          <span>{category.statistics.streams?.scheduled || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400 mr-1"></div>
                            Ended
                          </span>
                          <span>{category.statistics.streams?.ended || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Subcategories:</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category.subCategories.map((sub) => (
                      <Badge 
                        key={sub._id} 
                        variant="secondary"
                        className="px-2 py-1 text-xs font-medium rounded-md cursor-pointer hover:bg-secondary/80"
                        title={sub.subSubCategories?.length > 0 ? `${sub.subSubCategories.length} sub-subcategories` : ''}
                      >
                        {sub.name}
                        {sub.subSubCategories?.length > 0 && (
                          <span className="ml-1.5 bg-primary/20 text-primary text-[10px] rounded-full px-1.5">
                            {sub.subSubCategories.length}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 md:w-24"
                  onClick={() => handleEdit(category)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex-1 md:w-24"
                  onClick={() => handleDelete(category._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AddCategoryModal 
        open={isModalOpen} 
        onClose={handleCloseModal}
        onSuccess={fetchCategories}
        initialData={selectedCategory}
        mode={modalMode}
      />
    </div>
  )
}
