"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  image: z.string().min(1, "Image URL is required"),
  subCategories: z.array(z.object({ name: z.string() })).min(1, "At least one subcategory is required"),
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
  const [subCategory, setSubCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: initialData?.image.url || "",
      subCategories: initialData?.subCategories || [],
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        image: initialData.image.url,
        subCategories: initialData.subCategories,
      })
    }
  }, [initialData, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (mode === 'edit' && initialData) {
        await api.put(`/api/admin/categories/${initialData._id}`, values)
        toast.success("Category updated successfully")
      } else {
        await api.post("/api/admin/categories", values)
        toast.success("Category created successfully")
      }
      form.reset()
      onSuccess()
      onClose()
    } catch (error) {
      const errorMessage = 'Something went wrong' + error
      setError(errorMessage)
      toast.error(`Failed to ${mode} category: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSubCategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && subCategory.trim()) {
      e.preventDefault()
      form.setValue("subCategories", [
        ...form.getValues("subCategories"),
        { name: subCategory.trim() },
      ])
      setSubCategory("")
    }
  }

  const removeSubCategory = (index: number) => {
    const current = form.getValues("subCategories")
    form.setValue(
      "subCategories",
      current.filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-none bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === 'edit' ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter category name" className="bg-gray-800 text-white border-gray-700" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter image URL" type="url" className="bg-gray-800 text-white border-gray-700" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-white">Sub Categories</FormLabel>
              <Input
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                onKeyDown={handleAddSubCategory}
                placeholder="Type and press Enter to add"
                className="bg-gray-800 text-white border-gray-700"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {form.watch("subCategories").map((sub, index) => (
                  <span
                    key={index}
                    className="bg-gray-800 px-2 py-1 rounded-md text-sm flex items-center border border-gray-700"
                  >
                    {sub.name}
                    <X
                      className="ml-2 h-4 w-4 cursor-pointer text-gray-400 hover:text-white"
                      onClick={() => removeSubCategory(index)}
                    />
                  </span>
                ))}
              </div>
              <FormMessage className="text-red-400">
                {form.formState.errors.subCategories?.message}
              </FormMessage>
            </div>

            {error && (
              <div className="text-red-400 text-sm">
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