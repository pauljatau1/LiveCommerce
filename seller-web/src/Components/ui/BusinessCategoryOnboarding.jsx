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
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

const BusinessCategoryOnboarding = () => {
  const categories = useLoaderData();
  const { submitBusinessCategory, submitProfileImage, isLoading } = useOnboardingContext();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [profileImage, setProfileImage] = useState(null);

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

  const handleProfileModalOpen = () => setOpenProfileModal(true);
  const handleProfileModalClose = () => setOpenProfileModal(false);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal style configuration
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '425px',
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: { xs: 2, sm: 4 },
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const handleImageSubmit = () => {
    if (!profileImage) {
      toast.error('Please upload a profile image', {
        description: 'You must upload a profile image to continue',
        style: {
          background: '#05031F',
          color: '#fff',
        }
      });
      return;
    } else {
      submitProfileImage(profileImage);
    }
  }

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
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${selectedSubCategories.includes(subCategory._id)
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

            <div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-5 lg:gap-10 mt-20 lg:mt-44">
                <button
                  onClick={handleProfileModalOpen}
                  className="bg-transparent text-[#0BB248] border border-[#0BB248] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Upload Profile Picture
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-[#0BB248] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
                >
                  {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={openProfileModal}
        onClose={handleProfileModalClose}
        aria-labelledby="modal-store-profile"
        aria-describedby="modal-store-profile-description"
      >
        <Box sx={modalStyle}>
          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleProfileModalClose}
              className="absolute right-0 top-0 rounded-full p-1.5 sm:p-2 hover:bg-gray-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="sm:w-6 sm:h-6">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex flex-col xl:flex-row justify-center items-center gap-5 mb-4 sm:mb-6 mt-4 sm:mt-0">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className="cursor-pointer block"
                >
                  <div className={`w-[131px] h-[131px] rounded-full ${profileImage ? '' : 'bg-gray-100 border-2 border-dashed border-gray-300'
                    } flex items-center justify-center overflow-hidden`}
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="text-gray-400"
                      >
                        <path
                          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="absolute bottom-0 right-0 bg-[#0BB248] rounded-full p-2 shadow-lg">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                </label>
              </div>
              <h1 className="text-base xl:text-lg font-bold">Click To Upload Profile Image</h1>
            </div>
          </div>
          <button
            onClick={handleImageSubmit}
            className="w-full bg-[#0BB248] text-white rounded-md py-2.5 sm:py-3 text-sm sm:text-base hover:bg-opacity-90 transition-all duration-300 mt-2 sm:mt-4"
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
          </button>
        </Box>
      </Modal>
    </div>
  );
};

export async function Loader() {
  const categories = await fetchCategories();
  return categories;
}

export default BusinessCategoryOnboarding;
