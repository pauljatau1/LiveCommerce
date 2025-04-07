import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Archive, ArrowLeft } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Link } from 'react-router-dom'

const Inactive = () => {
  const {setHeaderName, setNavName} = useOutletContext();

  useEffect(() => {
    setHeaderName("Products");
    setNavName("Inactive");
  }, []);

  return (
    <div className='flex flex-col justify-center items-center h-[80dvh] px-4'>
      <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-50 p-4 rounded-full">
            <Archive className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">No Inactive Products</h2>
        <p className="text-slate-600 mb-6">
          You don't have any inactive products. Inactive products are those that have been temporarily removed from your store but can be reactivated at any time.
        </p>
        <Link to="/dashboard/products">
          <Button variant="outline" className="border-slate-300 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Active Products
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Inactive
