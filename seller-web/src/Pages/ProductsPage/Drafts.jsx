import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Link } from 'react-router-dom'

const Drafts = () => {
  const {setHeaderName, setNavName} = useOutletContext();

  useEffect(() => {
    setHeaderName("Products");
    setNavName("Drafts");
  }, []);

  return (
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
        <Link to="/dashboard/products/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create New Product
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Drafts
