import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import AddCategoryModal from "@/components/dashboard/add-category-modal"
import { toast } from "sonner"
import { api } from "@/api/axios"

interface SubSubCategory {
  name: string
  _id: string
}

interface SubCategory {
  name: string
  _id: string
  subSubCategories: SubSubCategory[]
}

interface Category {
  _id: string
  name: string
  image: {
    url: string
  }
  subCategories: SubCategory[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [loading, setLoading] = useState(true)
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({})

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-white font-bold">Categories</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Category
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category._id} className="p-4">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={category.image.url}
                  alt={category.name}
                  className="object-cover rounded-md w-full h-full"
                />
              </div>
              
              <div className="flex-grow">
                <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Categories Hierarchy:</h3>
                  <div className="space-y-2">
                    {category.subCategories.map((sub) => (
                      <div key={sub._id} className="space-y-1">
                        <div 
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={() => toggleSubCategory(sub._id)}
                        >
                          {sub.subSubCategories?.length > 0 ? (
                            expandedSubCategories[sub._id] ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <div className="w-4" /> // Spacer for alignment
                          )}
                          <span className="bg-secondary px-2 py-1 rounded-md text-sm">
                            {sub.name}
                          </span>
                        </div>
                        
                        {/* Sub-subcategories */}
                        {expandedSubCategories[sub._id] && sub.subSubCategories?.length > 0 && (
                          <div className="ml-6 flex flex-wrap gap-2">
                            {sub.subSubCategories.map((subSub) => (
                              <span
                                key={subSub._id}
                                className="bg-secondary/50 px-2 py-1 rounded-md text-xs"
                              >
                                {subSub.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-24"
                  onClick={() => handleEdit(category)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="w-24"
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
