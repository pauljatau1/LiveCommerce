import { useState, useEffect, useRef } from 'react';
import { Icon } from "@iconify/react";
import { BASE_URL } from '../../Constants/Server';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select";
import { Autocomplete, TextField, Chip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerProducts } from '../../Redux/Slices/ProductSlice';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { NavLink, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Header from "../../Components/ui/Header/Header";
import CreateAuctionIcon from '../../assets/Upload icon.png';

const CreateLiveAuction = () => {
  const { setHeaderName, setNavName } = useOutletContext()
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dispatch: livestreamDispatch, livestream } = useLivestreamContext();
  const { products, isLoading, message } = useSelector((state) => state.product);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});

  useEffect(() => {
    setHeaderName('Live Streams')
    setNavName('Create Live Auction')
  }, [])

  const MAX_CHARS = 250;

  const inputRef = useRef(null);

  // Predefined tags
  const availableTags = [
    { id: 1, label: 'Fashion' },
    { id: 2, label: 'Shoes' },
    { id: 3, label: 'Trending' },
    { id: 4, label: 'Electronics' },
    { id: 5, label: 'Accessories' },
    { id: 6, label: 'Sports' },
    // Add more tags as needed
  ];

  // Fixed tags that cannot be removed
  const fixedTags = [availableTags[0]]; // Fashion is fixed

  useEffect(() => {
    dispatch(fetchSellerProducts());
  }, [dispatch]);

  useEffect(() => {
    if (message === 'Products fetched successfully') {
      livestreamDispatch({
        type: 'SET_LIVESTREAM_DATA',
        payload: {
          products: products.map(product => {
            return {
              productId: product?._id,
              name: product?.name,
              category: product?.category,
              images: product?.images,
              sku: product?.sku,
              quantity: product?.stock,
              minBid: 0,
              maxBid: 0,
              selected: true
            }
          })
        }
      });
    }
  }, [message])

  console.log('filteredProducts', filteredProducts);

  // Initialize tags if they're undefined
  useEffect(() => {
    if (!livestream?.tags) {
      livestreamDispatch({
        type: 'SET_LIVESTREAM_DATA',
        payload: { tags: [] }
      });
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/public/categories`);
        if (response.status === 200) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleOnChange = (e, productId) => {
    const { name, value } = e.target;
    setProductQuantities(prev => ({ ...prev, [productId]: value }));
  }

  // Sample data
  const sampleProducts = [
    {
      id: 1,
      name: "Men's Male Shoe",
      category: "Footwear",
      image: "/path/to/shoe-image.jpg",
      sku: "SHOE001",
    },
    {
      id: 2,
      name: "Men's Male Shoe",
      category: "Footwear",
      image: "/path/to/shoe-image.jpg",
      sku: "SHOE002",
    },
    // Add more sample products as needed
  ];

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Triggers when file is dropped
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Triggers when file is selected with click
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle both selected and dropped files
  const handleFile = (file) => {
    // Add file type validation here
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid file type (JPEG, PNG, GIF, MP4)');
      return;
    }
    livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { coverPhoto: file } });
  };

  // Handle button click
  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleDescriptionChange = (e) => {
    const input = e.target.value;
    // Only update if we're under max chars or if we're deleting
    if (input.length <= MAX_CHARS) {
      livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { description: input } });
    }
  };

  const handleContinue = () => {
    if (livestream?.title && livestream?.description && livestream?.category && livestream?.tags.length > 0 && livestream?.coverPhoto && livestream?.products.some(product => product.selected)) {
      navigate('/dashboard/live-streams/submit-live-auction');
    } else {
      toast.error('Please fill all fields', {
        description: 'Please fill all fields to continue',
      });
    }
  }

  const handleBidChange = (productId, field, value) => {
    livestreamDispatch({
      type: 'SET_LIVESTREAM_DATA',
      payload: {
        products: livestream.products.map(product => {
          if (product.productId === productId) {
            return {
              ...product,
              [field]: value ? Number(value) : ''
            };
          }
          return product;
        })
      }
    });
  };

  const handleSelectProduct = (productId) => {
    livestreamDispatch({
      type: 'SET_LIVESTREAM_DATA',
      payload: {
        products: livestream.products.map(product => {
          if (product.productId === productId) {
            return {
              ...product,
              selected: !product.selected
            };
          }
          return product;
        })
      }
    });
  };

  return (
    <div className="pt-4 md:pt-6">
      <div className=" bg-white p-3 lg:p-10 space-y-6">
        {/* Stream Title */}
        <div className="space-y-2">
          <h1 className="text-sm md:text-base font-inter font-bold text-[#27272E]">Auction Stream Title</h1>
          <input
            type="text"
            value={livestream?.title}
            onChange={(e) => livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { title: e.target.value } })}
            placeholder="Enter title"
            className="w-full px-4 py-2 border text-sm md:text-base border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2"
          />
        </div>

        {/* Stream Cover Photo */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">Stream Cover Photo</label>
          <div
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer
                        ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            {livestream?.coverPhoto ? (
              <div className="flex flex-col items-center">
                <img
                  src={URL.createObjectURL(livestream?.coverPhoto)}
                  alt="Preview"
                  className="w-[250px] object-contain md:w-full h-20 rounded-lg mb-2"
                />
                <p className="text-sm text-gray-600">{livestream?.coverPhoto.name}</p>
              </div>
            ) : (
              <>
                <img src={CreateAuctionIcon} alt="Upload" className="w-13 h-12 mb-2" />
                <div className="text-center px-4">
                  <p className="text-sm text-gray-600">
                    Drop & drop files or <span className="text-green-600">Browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPEG, PNG, GIF, MP4
                  </p>
                </div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/gif,video/mp4"
              onChange={handleChange}
            />
          </div>
          <p className="text-xs text-gray-500">
            Make sure the image uploaded fits to appear for best results. Wrong images will be removed automatically.
          </p>
        </div>

        {/* Stream Description */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">
            Stream Description
          </label>
          <textarea
            placeholder="Enter description"
            rows={4}
            value={livestream?.description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-2 border text-sm md:text-base border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2"
          />
          <div className="flex justify-end">
            <span
              className={`text-xs ${livestream?.description?.length === MAX_CHARS
                ? 'text-red-500 font-medium'
                : 'text-gray-500'
                }`}
            >
              {livestream?.description?.length}/{MAX_CHARS} Characters
            </span>
          </div>
        </div>

        {/* Stream Category */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">Stream Category</label>
          <Select
            value={livestream?.category}
            onValueChange={(value) => {
              livestreamDispatch({ type: 'SET_LIVESTREAM_DATA', payload: { category: value } });
            }}
          >
            <SelectTrigger className="border border-gray-300 rounded-lg">
              <SelectValue placeholder="Choose a category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category._id}
                  value={category.name}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Livestream Tags */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-inter font-bold text-[#27272E]">
            Livestream Tags
          </label>
          <Autocomplete
            multiple
            id="tags-standard"
            options={availableTags}
            value={livestream?.tags || []}
            onChange={(event, newValue) => {
              livestreamDispatch({
                type: 'SET_LIVESTREAM_DATA',
                payload: { tags: [...newValue] }
              });
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  {...getTagProps({ index })}
                  disabled={fixedTags.find(tag => tag.id === option.id)}
                  sx={{
                    backgroundColor: '#f3f4f6',
                    '&.MuiChip-root': {
                      borderRadius: '9999px',
                      height: '28px',
                    },
                    '&.Mui-disabled': {
                      opacity: 1,
                      backgroundColor: '#e5e7eb',
                    }
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Search for tags..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '4px 8px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                      borderRadius: '8px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d1d5db',
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            )}
            sx={{
              width: '100%',
              '& .MuiAutocomplete-tag': {
                margin: '2px',
              },
            }}
          />
          <p className="text-xs text-gray-500">
            Select relevant tags for your stream. Some tags are fixed and cannot be removed.
          </p>
        </div>

        {/* Select Products */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm md:text-base font-inter font-bold text-[#27272E]">Select Products for Stream</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-semibold text-[#8492A6] uppercase tracking-wider">
                    Select
                  </th>
                  <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-semibold text-[#8492A6] uppercase tracking-wider">
                    Products
                  </th>
                  <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-semibold text-[#8492A6] uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-semibold text-[#8492A6] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-semibold text-[#8492A6] uppercase tracking-wider">
                    Min Bid
                  </th>
                  <th className="sticky top-0 bg-[#FAFAFB] px-4 py-3 text-left text-xs font-semibold text-[#8492A6] uppercase tracking-wider">
                    Max Bid
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {livestream?.products.map((product) => (
                  <tr
                    key={product.productId}
                    className={`transition-colors ${!product.selected ? 'bg-gray-50 opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={product.selected}
                        onChange={() => handleSelectProduct(product.productId)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          <span className="text-xs text-gray-500">{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={product.quantity || ''}
                        disabled={true}
                        className={`w-16 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 
                          ${!product.selected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 font-medium">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={product.minBid || ''}
                          disabled={!product.selected}
                          onChange={(e) => handleBidChange(product.productId, 'minBid', e.target.value)}
                          className={`w-16 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500
                            ${!product.selected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 font-medium">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={product.maxBid || ''}
                          disabled={!product.selected}
                          onChange={(e) => handleBidChange(product.productId, 'maxBid', e.target.value)}
                          className={`w-16 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500
                            ${!product.selected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between flex-wrap gap-10 lg:gap-0 items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {products.length} items out of {products.length} results found
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLiveAuction;
