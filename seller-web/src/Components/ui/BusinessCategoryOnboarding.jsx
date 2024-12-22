import { useState } from 'react';
import { useOnboardingContext } from '../../Hooks/useOnboardingContext';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchCategories } from '../../Utilities/apiRestaurant';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../Components/ui/dialog"

const BusinessCategoryOnboarding = () => {
  const categories = useLoaderData();
  const { submitBusinessCategory, isLoading } = useOnboardingContext();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategories(
      selectedCategories.find(item => item.categoryId === category._id)?.subCategories || []
    );
    setOpenDialog(true);
  };

  const handleSubCategorySelect = (subCategoryId) => {
    setSelectedSubCategories(prev => {
      const newSubCategories = prev.includes(subCategoryId)
        ? prev.filter(id => id !== subCategoryId)
        : [...prev, subCategoryId];
      
      setSelectedCategories(prevCategories => {
        const existingIndex = prevCategories.findIndex(
          item => item.categoryId === selectedCategory._id
        );
        
        if (newSubCategories.length === 0) {
          return prevCategories.filter(
            item => item.categoryId !== selectedCategory._id
          );
        }

        const newCategory = {
          categoryId: selectedCategory._id,
          subCategories: newSubCategories
        };

        if (existingIndex !== -1) {
          const newCategories = [...prevCategories];
          newCategories[existingIndex] = newCategory;
          return newCategories;
        }

        return [...prevCategories, newCategory];
      });

      setOpenDialog(false);
      return newSubCategories;
    });
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate(-1);
  };

  console.log('selectedCategories', selectedCategories);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category', {
        description: 'You must select at least one category to continue',
        style: {
          background: '#05031F',
          color: '#fff',
        }
      });
      return;
    }

    // Transform the data structure to match server expectations
    const formattedCategories = {
      categories: selectedCategories.map(selected => {
        const category = categories.find(cat => cat._id === selected.categoryId);
        return {
          name: category.name,
          id: category._id,
          subCategories: selected.subCategories.map(subCatId => {
            const subCategory = category.subCategories.find(sub => sub._id === subCatId);
            return {
              name: subCategory.name
            };
          })
        };
      })
    };

    // Send the formatted data to the server
    await submitBusinessCategory(formattedCategories);
  };

  return (
    <div className="py-[17.5px] lg:py-[55px] px-[32px] lg:px-[203.5px]">
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center mt-[64px] lg:mt-[125px]">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 lg:mb-7">
              What Will You Sell On Auqli?
            </h1>
            <p className="text-center text-base lg:text-2xl font-light">
              Choose categories that best describe their products
            </p>

            <div className="grid grid-cols-2 gap-x-10 gap-y-10 lg:gap-x-20 lg:gap-y-40 mt-14 lg:mt-28 w-full max-w-[600px]">
              {categories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => handleCategorySelect(category)}
                  className={`relative cursor-pointer rounded-[20px] lg:rounded-[34px] overflow-hidden aspect-square`}
                >
                  <img
                    src={category.image.url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedCategories.some(item => 
                    item.categoryId === category._id && 
                    item.subCategories.length > 0
                  ) && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2`}>
                    <p className="text-center text-lg font-medium">{category.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <Dialog 
              open={openDialog} 
              onOpenChange={(open) => {
                setOpenDialog(open);
                if (!open) {
                  setSelectedCategory(null);
                }
              }}
            >
              <DialogContent className="px-4 sm:px-6 md:px-10 max-w-[85vw] md:max-w-[85vw] lg:max-w-[65vw] w-full">
                <DialogHeader>
                  <DialogTitle className="text-xl md:text-2xl font-semibold my-8">
                    Select Sub-Categories for {selectedCategory?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                  {selectedCategory?.subCategories?.map((subCategory) => (
                    <div
                      key={subCategory._id}
                      onClick={() => handleSubCategorySelect(subCategory._id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedSubCategories.includes(subCategory._id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm md:text-base">{subCategory.name}</p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center justify-center gap-10 mt-20 lg:mt-44">
              <button
                onClick={handleBack}
                className="bg-transparent text-[#05031F] border border-[#05031F] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#05031F] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
              >
                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export async function Loader() {
  const categories = await fetchCategories();
  return categories;
}

export default BusinessCategoryOnboarding;
