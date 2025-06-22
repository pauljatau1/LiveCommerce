import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import AddMajorCategoryModal from "@/components/dashboard/add-major-category-modal"
import { api } from "@/api/axios"

// Define interfaces for the major category structure
interface Category {
  _id: string
  name: string
  image: {
    url: string
  }
}

interface MajorCategory {
  _id: string
  name: string
  image: {
    url: string
    public_id?: string
  }
  categories: Category[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export default function MajorCategoriesPage() {
  const [majorCategories, setMajorCategories] = useState<MajorCategory[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMajorCategory, setSelectedMajorCategory] = useState<MajorCategory | undefined>()
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  // State for search, pagination and filter
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState<"all" | "withCategories" | "noCategories" | "active" | "inactive">("all")
  const itemsPerPage = 5

  // Fetch major categories from API
  const fetchMajorCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/admin/major-categories")
      
      // Ensure response.data is an array
      if (response.data && Array.isArray(response.data)) {
        setMajorCategories(response.data)
      } else if (response.data && typeof response.data === 'object') {
        // If the API returns an object with a data property that is an array
        if (Array.isArray(response.data.data)) {
          setMajorCategories(response.data.data)
        } else {
          console.error("Unexpected API response format:", response.data)
          setMajorCategories([])
          toast.error("Invalid data format received from server")
        }
      } else {
        console.error("Unexpected API response format:", response.data)
        setMajorCategories([])
        toast.error("Invalid data format received from server")
      }
    } catch (error) {
      toast.error("Failed to fetch major categories")
      console.error("Error fetching major categories:", error)
      setMajorCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMajorCategories()
  }, [])

  // Filter and search major categories - ensure majorCategories is always an array
  const filteredMajorCategories = Array.isArray(majorCategories) 
    ? majorCategories.filter(majorCategory => {
        // Search filter
        const matchesSearch = majorCategory.name.toLowerCase().includes(searchTerm.toLowerCase())
        
        // Categories filter
        if (filter === "withCategories") {
          return matchesSearch && (majorCategory.categories?.length || 0) > 0
        } else if (filter === "noCategories") {
          return matchesSearch && (majorCategory.categories?.length || 0) === 0
        } else if (filter === "active") {
          return matchesSearch && majorCategory.isActive === true
        } else if (filter === "inactive") {
          return matchesSearch && majorCategory.isActive === false
        }
        
        return matchesSearch
      })
    : [];

  // Pagination logic
  const totalPages = Math.ceil(filteredMajorCategories.length / itemsPerPage)
  const paginatedMajorCategories = filteredMajorCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filter])

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this major category?")) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/major-categories/${id}`)
      toast.success("Major category deleted successfully")
      fetchMajorCategories()
    } catch (error) {
      toast.error("Failed to delete major category")
      console.error("Error deleting major category:", error)
    }
  }

  const handleEdit = (majorCategory: MajorCategory) => {
    setSelectedMajorCategory(majorCategory)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMajorCategory(undefined)
    setModalMode('add')
  }

  const handleAddNew = () => {
    setSelectedMajorCategory(undefined)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const toggleCategory = (majorCategoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [majorCategoryId]: !prev[majorCategoryId]
    }))
  }

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
          <h1 className="text-2xl md:text-3xl text-white font-bold">Major Categories</h1>
          <p className="text-muted-foreground mt-1">Manage top-level product categories ({majorCategories?.length || 0} total)</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add New Major Category
        </Button>
      </div>

      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search major categories..."
            className="pl-10 bg-gray-800 text-white border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(value: "all" | "withCategories" | "noCategories" | "active" | "inactive") => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px] bg-gray-800 text-white border-gray-700">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter categories" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Major Categories</SelectItem>
            <SelectItem value="withCategories">With Categories</SelectItem>
            <SelectItem value="noCategories">No Categories</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {paginatedMajorCategories.length > 0 ? (
          paginatedMajorCategories.map((majorCategory) => (
            <Card key={majorCategory._id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                <div className="w-full md:w-32 h-40 md:h-32 flex-shrink-0">
                  <img
                    src={majorCategory.image?.url || 'https://placehold.co/200x200?text=No+Image'}
                    alt={majorCategory.name}
                    className="object-cover rounded-md w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image';
                    }}
                  />
                </div>
                
                <div className="flex-grow space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{majorCategory.name}</h2>
                        {majorCategory.isActive !== undefined && (
                          <Badge variant={majorCategory.isActive ? "secondary" : "destructive"} className="text-xs">
                            {majorCategory.isActive ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                      {majorCategory.createdAt && (
                        <p className="text-xs text-muted-foreground">Created: {formatDate(majorCategory.createdAt)}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(majorCategory)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(majorCategory._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div
                      className="flex items-center text-sm font-medium cursor-pointer"
                      onClick={() => toggleCategory(majorCategory._id)}
                    >
                      {expandedCategories[majorCategory._id] ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      <span>Categories ({majorCategory.categories?.length || 0})</span>
                    </div>

                    {expandedCategories[majorCategory._id] && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {majorCategory.categories && majorCategory.categories.length > 0 ? (
                          majorCategory.categories.map((category) => (
                            <div
                              key={category._id}
                              className="flex items-center p-2 bg-gray-800 rounded-md"
                            >
                              <div className="w-10 h-10 rounded-md overflow-hidden mr-2">
                                <img
                                  src={category.image?.url || 'https://placehold.co/100x100?text=No+Image'}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                  }}
                                />
                              </div>
                              <span className="text-sm">{category.name}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 col-span-3">No categories assigned</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No major categories found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AddMajorCategoryModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchMajorCategories}
        initialData={selectedMajorCategory}
        mode={modalMode}
      />
    </div>
  )
} 