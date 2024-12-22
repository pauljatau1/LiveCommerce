import { useState } from 'react';
import { toast } from "sonner";
import { useOnboardingContext } from '../../Hooks/useOnboardingContext';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../Components/ui/dialog"

const ShippingOptionsOnboarding = () => {
  const navigate = useNavigate();
  const { submitShippingOptions } = useOnboardingContext();
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedReturn, setSelectedReturn] = useState('');
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleNext = async (event) => {
    event.preventDefault();
    if (selectedShipping && selectedReturn) {
      const shippingOptions = {
        shippingOptions: {
          shippingMethod: selectedShipping,
          returnsAndExchangePolicy: selectedReturn
        }
      }
      await submitShippingOptions(shippingOptions);
    }
  }

  const handleBack = () => {
    navigate(-1);
  }

  const handleTermsClick = (e) => {
    e.preventDefault();
    setTermsDialogOpen(true);
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setTermsDialogOpen(false);
  };

  console.log('selectedShipping', selectedShipping);
  console.log('selectedReturn', selectedReturn);

  return (
    <div className="py-[47.5px] lg:py-[135px] px-[32px] lg:px-[203.5px]">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 lg:mb-7">Shipping Options</h1>
        <p className="text-center text-base lg:text-2xl font-light">
          Let us know details about your business, with just these few questions
        </p>

        <div className="w-full mt-14 lg:mt-28">
          {/* Shipping Methods Section */}
          <div className="mb-12">
            <h2 className="text-center text-lg lg:text-xl mb-8">Shipping Methods</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-[600px] md:max-w-full mx-auto">
              <div
                className={`border rounded-lg p-4 cursor-pointer hover:border-[#05031F] transition-all duration-300 ${selectedShipping === 'seller' ? 'border-[#05031F]' : 'border-gray-300'}`}
                onClick={() => setSelectedShipping('seller')}
              >
                <p className="text-center">Shipped by Seller</p>
              </div>
              <div
                className={`border rounded-lg p-4 cursor-pointer hover:border-[#05031F] transition-all duration-300 ${selectedShipping === 'pickup' ? 'border-[#05031F]' : 'border-gray-300'}`}
                onClick={() => setSelectedShipping('pickup')}
              >
                <p className="text-center">Store Pickup</p>
              </div>
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${selectedShipping === 'auqli' ? 'border-[#05031F]' : 'border-gray-300'} md:col-span-1 col-span-2 w-1/2 md:w-full mx-auto md:mx-0`}
              >
                <p className="text-center">Shipped by Auqli</p>
                <span className="text-xs text-red-500">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Returns & Exchanges Section */}
          <div className="mb-12">
            <h2 className="text-center text-lg lg:text-xl mb-8">Returns & Exchanges</h2>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-6 cursor-pointer hover:border-[#05031F] transition-all duration-300 ${selectedReturn === 'auqli' ? 'border-[#05031F]' : 'border-gray-300'}`}
                onClick={() => setSelectedReturn('auqli')}
              >
                <p className="text-center font-medium mb-2">Use Auqli Return Policy</p>
                <p className="text-center text-sm text-gray-600">Default 7-day window for damaged items or discrepancies</p>
              </div>
              <div
                className={`border rounded-lg p-6 cursor-pointer hover:border-[#05031F] transition-all duration-300 ${selectedReturn === 'custom' ? 'border-[#05031F]' : 'border-gray-300'}`}
                onClick={() => setSelectedReturn('custom')}
              >
                <p className="text-center font-medium mb-2">Custom Return Policy</p>
                <p className="text-center text-sm text-gray-600">Options for 7, 14, or 30 days</p>
              </div>
            </div>
          </div>
          <div className='space-x-2'>
            <input type='checkbox' id='privacy' />
            <label>By continuing, you agree to our <span className='text-[#1428FF] underline cursor-pointer'>privacy policy</span></label>
          </div>
          <div className='space-x-2 mt-6'>
            <input 
              type='checkbox' 
              id='terms' 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label>
              I confirm that I have read, and agreed to{' '}
              <span 
                className='text-[#1428FF] underline cursor-pointer'
                onClick={handleTermsClick}
              >
                Auqli's terms and conditions
              </span>
            </label>
          </div>
          <div className='space-x-2 mt-6'>
            <input type='checkbox' id='privacy' />
            <label>By registering as a Seller you agree to comply with our <span className='text-[#1428FF] underline cursor-pointer'>Seller Agreement</span></label>
          </div>
          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-10 mt-20 lg:mt-40">
            <button onClick={handleBack} className="bg-transparent text-[#05031F] border border-[#05031F] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer">
              Back
            </button>
            <button onClick={handleNext} className="bg-[#05031F] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>

      <Dialog 
        open={termsDialogOpen} 
        onOpenChange={setTermsDialogOpen}
      >
        <DialogContent className="px-4 sm:px-6 md:px-10 max-w-[85vw] md:max-w-[85vw] lg:max-w-[65vw] w-full">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-semibold mb-4">
              Terms And Conditions
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto my-4">
            <div className="space-y-4 text-sm md:text-base">
              <p>
                This mixed text will scroll when its as long as it needs to be.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis
                aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam,
                eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam
                voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
                voluptatem sequi nesciunt.
              </p>
              {/* Add more paragraphs as needed */}
            </div>
          </div>

          <DialogFooter className="flex lg:justify-between gap-4 mt-6">
            <button
              onClick={() => setTermsDialogOpen(false)}
              className="flex-1 bg-transparent text-[#05031F] border border-[#05031F] rounded-md py-3 hover:bg-gray-100 transition-all duration-300"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptTerms}
              className="flex-1 bg-[#05031F] text-white rounded-md py-3 hover:bg-opacity-90 transition-all duration-300"
            >
              Accept
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ShippingOptionsOnboarding;
