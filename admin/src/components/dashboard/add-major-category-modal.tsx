"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, Plus, Trash2, Check, Search } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/api/axios"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

// Define the form schema with zod
const formSchema = z.object({
  name: z.string().min(1, "Major category name is required").optional().or(z.literal("")),
  image: z.instanceof(File)
    .refine(file => !file || file.size <= 3 * 1024 * 1024, "Image size must be less than 3MB")
    .optional()
    .or(z.string()),
  categories: z.array(z.object({ 
    id: z.string().optional(),
    name: z.string()
  })).optional(),
  isActive: z.boolean().optional()
})

// Define the props for the component
interface AddMajorCategoryModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: {
    _id: string
    name: string
    image?: {
      url?: string
    }
    categories: {
      _id: string
      name: string
    }[]
    isActive?: boolean
  }
  mode?: 'add' | 'edit'
}

interface Category {
  _id: string
  name: string
  image?: {
    url?: string
  }
}

export default function AddMajorCategoryModal({ 
  open, 
  onClose, 
  onSuccess, 
  initialData,
  mode = 'add' 
}: AddMajorCategoryModalProps) {
  const [categoryInput, setCategoryInput] = useState("")
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: initialData?.image?.url || "",
      categories: initialData?.categories.map(cat => ({
        id: cat._id,
        name: cat.name
      })) || [],
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true
    },
  })

  // Fetch unassigned categories - wrapped in useCallback to prevent infinite loops
  const fetchUnassignedCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const response = await api.get("/api/admin/unassigned-categories")
      
      // Ensure we have valid data
      const unassignedCategories = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data && Array.isArray(response.data.data)) 
          ? response.data.data 
          : [];
      
      // If we're in edit mode, we need to include the categories that are already assigned to this major category
      if (mode === 'edit' && initialData) {
        const currentCategoryIds = initialData.categories.map(cat => cat._id)
        const allCategoriesResponse = await api.get("/api/admin/categories")
        
        // Ensure we have valid data for all categories
        const allCategories = Array.isArray(allCategoriesResponse.data) 
          ? allCategoriesResponse.data 
          : (allCategoriesResponse.data?.data && Array.isArray(allCategoriesResponse.data.data))
            ? allCategoriesResponse.data.data
            : [];
        
        // Filter out categories that are already assigned to other major categories
        // but include the ones assigned to the current major category
        const availableCats = allCategories.filter((cat: Category) => {
          if (!cat || typeof cat !== 'object') return false;
          
          const isUnassigned = unassignedCategories.some((unassignedCat: Category) => 
            unassignedCat && unassignedCat._id === cat._id
          );
          const isAssignedToCurrentMajor = currentCategoryIds.includes(cat._id);
          return isUnassigned || isAssignedToCurrentMajor;
        });
        
        setAvailableCategories(availableCats)
        setFilteredCategories(availableCats)
      } else {
        setAvailableCategories(unassignedCategories)
        setFilteredCategories(unassignedCategories)
      }
    } catch (error) {
      console.error("Error fetching unassigned categories:", error)
      toast.error("Failed to fetch available categories")
      setAvailableCategories([])
      setFilteredCategories([])
    } finally {
      setIsLoadingCategories(false)
    }
  }, [initialData, mode])

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        image: initialData.image?.url || "",
        categories: initialData.categories.map(cat => ({
          id: cat._id,
          name: cat.name
        })),
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      })
      
      // Initialize selected category IDs with a new Set
      const categoryIds = initialData.categories.map(cat => cat._id);
      setSelectedCategoryIds(new Set(categoryIds));
    } else {
      form.reset({
        name: "",
        image: "",
        categories: [],
        isActive: true
      })
      setSelectedCategoryIds(new Set());
    }
    
    // Fetch unassigned categories when the modal opens
    if (open) {
      fetchUnassignedCategories();
    }
  }, [initialData, form, open, fetchUnassignedCategories])

  // Filter available categories based on input
  useEffect(() => {
    if (!Array.isArray(availableCategories)) return;
    
    if (categoryInput.trim() === "") {
      setFilteredCategories(availableCategories)
    } else {
      setFilteredCategories(
        availableCategories.filter(cat => 
          cat && cat.name && cat.name.toLowerCase().includes(categoryInput.toLowerCase())
        )
      )
    }
  }, [categoryInput, availableCategories])

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData();
      
      // Only append name if it exists
      if (values.name) {
        formData.append('name', values.name);
      }
      
      // Extract category IDs from the selected set if any are selected
      if (selectedCategoryIds.size > 0) {
        const categoryIds = Array.from(selectedCategoryIds);
        formData.append('categoryIds', JSON.stringify(categoryIds));
      }
      
      // Add isActive if in edit mode
      if (mode === 'edit' && values.isActive !== undefined) {
        formData.append('isActive', String(values.isActive));
      }
      
      // Add image if it's a File object
      if (values.image instanceof File) {
        formData.append('image', values.image);
      }

      if (mode === 'edit' && initialData) {
        await api.put(`/api/admin/major-categories/${initialData._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Major category updated successfully");
      } else {
        await api.post("/api/admin/major-categories", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Major category created successfully");
      }
      
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      let errorMessage = 'Something went wrong';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      toast.error(`Failed to ${mode} major category: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle category selection
  const toggleCategorySelection = (category: Category) => {
    if (!category || !category._id) return;
    
    // Create a new Set to avoid direct mutation
    const newSelectedIds = new Set([...selectedCategoryIds]);
    
    if (newSelectedIds.has(category._id)) {
      newSelectedIds.delete(category._id);
    } else {
      newSelectedIds.add(category._id);
    }
    
    // Update the state with the new Set
    setSelectedCategoryIds(newSelectedIds);
    
    // Update form values to match selected categories
    if (Array.isArray(availableCategories)) {
      const selectedCategoriesArray = availableCategories
        .filter(cat => cat && cat._id && newSelectedIds.has(cat._id))
        .map(cat => ({
          id: cat._id,
          name: cat.name
        }));
      
      form.setValue("categories", selectedCategoriesArray);
    }
  }

  // Remove a category from selection
  const removeCategory = (categoryId: string) => {
    if (!categoryId) return;
    
    // Create a new Set to avoid direct mutation
    const newSelectedIds = new Set([...selectedCategoryIds]);
    newSelectedIds.delete(categoryId);
    
    // Update the state with the new Set
    setSelectedCategoryIds(newSelectedIds);
    
    // Update form values to match selected categories
    if (Array.isArray(availableCategories)) {
      const selectedCategoriesArray = availableCategories
        .filter(cat => cat && cat._id && newSelectedIds.has(cat._id))
        .map(cat => ({
          id: cat._id,
          name: cat.name
        }));
      
      form.setValue("categories", selectedCategoriesArray);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-none bg-gray-900 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-white">
            {mode === 'edit' ? 'Edit Major Category' : 'Add New Major Category'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Fill in the details below to {mode === 'edit' ? 'update' : 'create'} a major category. You can add multiple categories to it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-auto">
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="px-6 py-4 space-y-6">
                {/* Basic Details Section */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Major Category Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter major category name" 
                            className="bg-gray-800 text-white border-gray-700" 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Category Image</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {typeof value === 'string' && value && (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                <img
                                  src={value}
                                  alt="Category preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image';
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => onChange("")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  // Check if file size exceeds 3MB (3 * 1024 * 1024 bytes)
                                  if (file.size > 3 * 1024 * 1024) {
                                    toast.error("Image size must be less than 3MB")
                                    e.target.value = ''
                                    return
                                  }
                                  onChange(file)
                                }
                              }}
                              {...field}
                              className="bg-gray-800 text-white border-gray-700"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {mode === 'edit' && (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <FormDescription className="text-sm text-gray-400">
                              Set whether this major category is active and visible to users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Categories Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-lg">Categories</FormLabel>
                    <Badge variant="outline" className="text-xs text-white">
                      {selectedCategoryIds.size} selected
                    </Badge>
                  </div>
                  
                  {/* Selected Categories */}
                  <div className="bg-gray-800 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-3">Selected Categories</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Array.isArray(availableCategories) && availableCategories.length > 0 ? (
                        availableCategories
                          .filter(category => category && category._id && selectedCategoryIds.has(category._id))
                          .map((category) => (
                            <Badge
                              key={category._id}
                              variant="secondary"
                              className="px-3 py-2 flex items-center gap-2"
                            >
                              {category.name}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeCategory(category._id)}
                              />
                            </Badge>
                          ))
                      ) : null}
                      {selectedCategoryIds.size === 0 && (
                        <p className="text-sm text-gray-400">No categories selected yet</p>
                      )}
                    </div>
                  </div>

                  {/* Search Categories */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      placeholder="Search categories..."
                      className="pl-10 bg-gray-800 text-white border-gray-700"
                    />
                  </div>

                  {/* Available Categories */}
                  <div className="bg-gray-800 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-3">Available Categories</h3>
                    
                    {isLoadingCategories ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                        {Array.isArray(filteredCategories) && filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            category && category._id ? (
                              <div
                                key={category._id}
                                className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                                  selectedCategoryIds.has(category._id) 
                                    ? 'bg-blue-800 border border-primary/30 text-primary-foreground' 
                                    : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                                onClick={() => toggleCategorySelection(category)}
                              >
                                <div className="flex-1 flex items-center gap-3">
                                  {category.image && category.image.url && (
                                    <div className="w-10 h-10 rounded-md overflow-hidden">
                                      <img 
                                        src={category.image.url} 
                                        alt={category.name || 'Category'} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <span>{category.name || 'Unnamed Category'}</span>
                                </div>
                                {selectedCategoryIds.has(category._id) && (
                                  <Check className="h-4 w-4 text-white ml-2" />
                                )}
                              </div>
                            ) : null
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 col-span-2 p-4 text-center">
                            No categories found matching your search
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {error && (
              <div className="text-red-400 text-sm px-6 pt-2">{error}</div>
            )}

            <div className="sticky bottom-0 bg-gray-900 p-6 border-t border-gray-700 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-gray-500 text-white"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-500 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  mode === 'edit' ? 'Update Major Category' : 'Create Major Category'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 