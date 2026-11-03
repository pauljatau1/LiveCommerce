import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileText, Plus, PenIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSellerProducts, deleteProduct } from '../../Redux/Slices/ProductSlice'
import LinearProgress from '@mui/material/LinearProgress'
import { Icon } from '@iconify/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog'
import NotFound from '../../assets/not-found-icon2.png'

const Drafts = () => {
  const {setHeaderName, setNavName} = useOutletContext();
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.product);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setHeaderName("Products");
    setNavName("Drafts");
    
    // Fetch draft products on component mount
    fetchDraftProducts();
  }, []);

  // Function to fetch draft products
  const fetchDraftProducts = () => {
    const params = {
      page: 1,
      limit: 100,
      sortBy: 'newest',
      status: 'draft',
    };
    
    dispatch(fetchSellerProducts(params));
  };

  // Get draft products from the product list
  const draftProducts = products.filter(product => product.status === 'draft');

  // Handle product deletion
  const handleDeleteProduct = () => {
    if (productToDelete) {
      dispatch(deleteProduct(productToDelete._id));
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[80dvh]">
          <div className="w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4">
            <LinearProgress color="success" />
          </div>
        </div>
      ) : (
        <>
          {draftProducts.length === 0 ? (
            <div className='flex flex-col justify-center items-center h-[80dvh] px-4'>
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 max-w-md text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-50 p-4 rounded-full">
                    <FileText className="w-10 h-10 text-blue-500" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Drafts Found</h2>
                <p className="text-slate-600 mb-6">
                  You don't have any product drafts saved. Drafts are useful for saving your work in progress before publishing.
                </p>
                <Link to="/dashboard/add-products">
                  <Button className="bg-[#0BB248] hover:bg-[#0BB248]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Product
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">Draft Products ({draftProducts.length})</h1>
                <Link to="/dashboard/add-products">
                  <Button className="bg-[#0BB248] hover:bg-[#0BB248]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
              </div>
              
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {draftProducts.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="relative">
                      <img 
                        src={product.images[0]?.url || NotFound} 
                        alt={product.name} 
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="bg-[#FFA500]/10 text-[#FFA500] px-2 py-1 rounded-full text-xs font-medium">
                          Draft
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 text-lg mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-base font-semibold">{formatCurrency(product.price)}</p>
                        <p className="text-sm text-gray-500">Stock: {product.stock || 0}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Link 
                          to={`/dashboard/edit-product/${product._id}`}
                          className="flex-1 flex items-center justify-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md transition-colors"
                        >
                          <PenIcon className="w-4 h-4" />
                          Edit
                        </Link>
                        <button 
                          onClick={() => {
                            setProductToDelete(product);
                            setShowDeleteDialog(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-md transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px] max-w-[90vw] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-red-600">Confirm Product Deletion</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this draft product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {productToDelete && (
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <img
                  src={productToDelete?.images[0]?.url || NotFound}
                  alt={productToDelete?.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain bg-white"
                />
                <div>
                  <h3 className="font-medium text-[#17171B] text-sm sm:text-base line-clamp-2">{productToDelete?.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">SKU: {productToDelete?.sku || 'N/A'}</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
              >
                <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                Delete Draft
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Drafts
