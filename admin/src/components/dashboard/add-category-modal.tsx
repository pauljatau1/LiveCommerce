"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Plus, ChevronDown, ChevronRight } from "lucide-react"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/api/axios"

const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  image: z.instanceof(File).optional().or(z.string()),
  subCategories: z.array(z.object({ 
    name: z.string(),
    subSubCategories: z.array(z.object({ name: z.string() })).default([])
  })).min(1, "At least one subcategory is required"),
})

interface AddCategoryModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: {
    _id: string
    name: string
    image: {
      url: string
    }
    subCategories: {
      name: string
      _id: string
    }[]
  }
  mode?: 'add' | 'edit'
}

export default function AddCategoryModal({ 
  open, 
  onClose, 
  onSuccess, 
  initialData,
  mode = 'add' 
}: AddCategoryModalProps) {
  const [subCategory, setSubCategory] = useState<any>("")
  const [selectedSubCategoryIndex, setSelectedSubCategoryIndex] = useState<number | null>(null)
  const [subSubCategory, setSubSubCategory] = useState<any>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: initialData?.image.url || "",
      subCategories: initialData?.subCategories.map(sub => ({
        name: sub.name,
        subSubCategories: []
      })) || [],
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        image: initialData.image.url,
        subCategories: initialData.subCategories.map(sub => ({
          name: sub.name,
          subSubCategories: []
        })),
      })
    }
  }, [initialData, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('subCategories', JSON.stringify(values.subCategories));
      
      if (values.image) {
        formData.append('image', values.image);
      }

      if (mode === 'edit' && initialData) {
        await api.put(`/api/admin/categories/${initialData._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Category updated successfully");
      } else {
        await api.post("/api/admin/categories", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Category created successfully");
      }
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = 'Something went wrong' + error;
      setError(errorMessage);
      toast.error(`Failed to ${mode} category: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubCategory = () => {
    if (subCategory.trim()) {
      form.setValue("subCategories", [
        ...form.getValues("subCategories"),
        { name: subCategory.trim(), subSubCategories: [] },
      ])
      setSubCategory("")
    }
  }

  const handleAddSubSubCategory = () => {
    if (subSubCategory.trim() && selectedSubCategoryIndex !== null) {
      const currentSubCategories = form.getValues("subCategories")
      currentSubCategories[selectedSubCategoryIndex].subSubCategories.push({
        name: subSubCategory.trim()
      })
      form.setValue("subCategories", currentSubCategories)
      setSubSubCategory("")
    }
  }

  const removeSubCategory = (index: number) => {
    const current = form.getValues("subCategories")
    form.setValue(
      "subCategories",
      current.filter((_, i) => i !== index)
    )
    if (selectedSubCategoryIndex === index) {
      setSelectedSubCategoryIndex(null)
    }
  }

  const removeSubSubCategory = (subCategoryIndex: number, subSubCategoryIndex: number) => {
    const current = form.getValues("subCategories")
    current[subCategoryIndex].subSubCategories = current[subCategoryIndex].subSubCategories.filter(
      (_, i) => i !== subSubCategoryIndex
    )
    form.setValue("subCategories", current)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-none bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {mode === 'edit' ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Fill in the details below to {mode === 'edit' ? 'update' : 'create'} a category. Add subcategories and their nested categories to create a hierarchy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Category Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter category name" 
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
                            onChange(file)
                          }
                        }}
                        {...field}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel className="text-white text-lg">Category Hierarchy</FormLabel>
                <p className="text-sm text-gray-400 mb-4">
                  Create a hierarchical structure by adding subcategories and their nested categories.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <FormLabel className="text-white text-sm mb-2">Add Subcategory</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="Enter subcategory name"
                    className="bg-gray-700 text-white border-gray-600 flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={handleAddSubCategory}
                    className="bg-blue-600 hover:bg-blue-700 w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subcategory
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {form.watch("subCategories").map((sub, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="p-3 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => setSelectedSubCategoryIndex(selectedSubCategoryIndex === index ? null : index)}
                        >
                          {selectedSubCategoryIndex === index ? (
                            <ChevronDown className="h-4 w-4 text-blue-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-medium">{sub.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubCategoryIndex(index)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Sub-subcategory
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubCategory(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {selectedSubCategoryIndex === index && (
                      <div className="p-3 bg-gray-900/50">
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={subSubCategory}
                            onChange={(e) => setSubSubCategory(e.target.value)}
                            placeholder="Enter nested category name"
                            className="bg-gray-700 text-white border-gray-600 text-sm flex-1"
                          />
                          <Button 
                            type="button"
                            size="sm"
                            onClick={handleAddSubSubCategory}
                            className="bg-blue-600 hover:bg-blue-700 w-auto"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {sub.subSubCategories.map((subSub, subIndex) => (
                            <div
                              key={subIndex}
                              className="bg-gray-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 border border-gray-600"
                            >
                              {subSub.name}
                              <button
                                type="button"
                                onClick={() => removeSubSubCategory(index, subIndex)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <FormMessage className="text-red-400">
                {form.formState.errors.subCategories?.message}
              </FormMessage>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}