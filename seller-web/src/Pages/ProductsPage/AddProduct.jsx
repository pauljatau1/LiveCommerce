import { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { useNavigation, useOutletContext } from "react-router-dom";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../Components/ui/popover";
import { Crisp } from "crisp-sdk-web";
import AlertNotification from '../../Components/ui/AlertNotification';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../../Components/ui/collapsible";
import { Button } from "../../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Label } from "../../Components/ui/label";
import { Input } from "../../Components/ui/input2";
import { Textarea } from "../../Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select";
import UploadImage from '../../assets/upload-image.png';

const AddProduct = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const [notification, setNotification] = useState(true);
    const [open, setOpen] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const WEBSITE_ID = "1e433cca-97ba-42a7-bac7-b3ea79d648f1";
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [images, setImages] = useState([]);
    const [shippingDetails, setShippingDetails] = useState({
        pricing: '',
        salePrice: '',
        weight: '',
        weightUnit: 'kg',
        inventory: '',
        condition: 'fairly-used',
        dimensions: {
            length: '',
            width: '',
            height: ''
        }
    });
    const [showVariants, setShowVariants] = useState(false);
    const [variants, setVariants] = useState([]);
    const [newVariant, setNewVariant] = useState({
        size: '',
        price: '',
        stock: ''
    });

    useEffect(() => {
        // Configure Crisp
        Crisp.configure(WEBSITE_ID, {
            autoLoad: false,
        });

        // Hide the default Crisp button initially
        window.$crisp.push(["do", "chat:hide"]);

        // Add event listener for chat close
        window.$crisp.push(["on", "chat:closed", () => {
            setIsChatVisible(false);
            // Hide the default Crisp button when chat is closed
            window.$crisp.push(["do", "chat:hide"]);
        }]);

        // Optional: Reset visibility when component unmounts
        return () => {
            window.$crisp.push(["off", "chat:closed"]);
        };
    }, []);

    const handleChatOpen = () => {
        setIsChatVisible(true);
        // Show the Crisp widget when opening chat
        window.$crisp.push(["do", "chat:show"]);
        Crisp.chat.open();
    };

    const handleShippingChange = (field, value) => {
        setShippingDetails(prev => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value
                    }
                };
            }
            return {
                ...prev,
                [field]: value
            };
        });
    };

    // handle variant change
    const handleVariantChange = (field, value) => {
        setNewVariant(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // handle add variant
    const handleAddVariant = () => {
        if (variants.length >= 2) return; // Prevent adding more than 2 variants
        if (newVariant.size && newVariant.price && newVariant.stock) {
            setVariants(prev => [...prev, { ...newVariant, id: Date.now() }]);
            setNewVariant({ size: '', price: '', stock: '' }); // Reset form
        }
    };

    // handle remove variant
    const handleRemoveVariant = (variantId) => {
        setVariants(prev => prev.filter(variant => variant.id !== variantId));
    };

    console.log(variants)

    return (
        <>
            <div className="flex flex-col justify-between gap-4 py-6">
                <div className="flex justify-between items-center w-full ">
                    {
                        !isSidebarOpen && (
                            <Icon icon="pepicons-pencil:menu" width="34" height="34" color="#05031F" className='md:hidden' onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                        )
                    }
                    <h1 className="text-2xl font-bold font-lexend">Add Product</h1>
                    <div className=' items-center hidden xl:flex bg-[#0BB24847] py-2 lg:py-4 px-3 lg:px-5 rounded-full gap-5' >
                        <Icon icon="bi:info-circle" width="20" height="20" color='#05031F' />
                        <p className='text-sm font-cabin lg:text-base text-[#05031F] '>Need help? Visit the seller university for detailed guides</p>
                    </div>

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <button className='bg-[#DF0707] lg:hidden items-center justify-center w-fit text-white text-base font-bold font-lexend px-6 py-3 rounded-full xl:ml-[56px] xl:mr-[30px] relative overflow-hidden transition-all duration-150 hover:shadow-lg group isolate before:absolute before:bg-white/30 before:content-[""] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]'>
                                <Icon icon="ri:live-fill" width="24" height="24" color="#FFFFFF" className="lg:hidden" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => {
                                            // Handle Go Live action
                                            setOpen(false)
                                        }}>
                                            <Icon icon="fluent:live-20-filled" width="20" height="20" color="#05031F" />
                                            <span className="ml-2 text-[#05031F]">Go Live</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => {
                                            handleChatOpen();
                                            setOpen(false);
                                        }}>
                                            <Icon icon="solar:chat-line-bold" width="24" height="24" color='#05031F' />
                                            <span className="ml-2 text-[#05031F]">Live Chat</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => {
                                            // Handle Notification action
                                            setOpen(false)
                                        }}>
                                            <Icon icon="mingcute:notification-fill" width="24" height="24" color='#05031F' />
                                            <span className="ml-2 text-[#05031F]">Notification</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => {
                                            // Handle Profile action
                                            setOpen(false)
                                        }}>
                                            <Icon icon="iconamoon:profile-fill" width="24" height="24" color='#05031F' />
                                            <span className="ml-2 text-[#05031F]">Profile</span>
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <div className='items-center gap-7 hidden lg:flex'>
                            <button onClick={handleChatOpen} className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                                <span className="relative z-10">
                                    <Icon icon="solar:chat-line-bold" width="24" height="24" color='#FFFFFF' />
                                </span>
                            </button>
                        <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                            <span className="relative z-10">
                                <Icon icon="si:notifications-thick-duotone" width="24" height="24" color='#FFFFFF' />
                            </span>
                        </button>
                        <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                            <span className="relative z-10">
                                <Icon icon="iconamoon:profile-fill" width="24" height="24" color='#FFFFFF' />
                            </span>
                        </button>
                    </div>
                </div>
                <div className=' items-center flex xl:hidden bg-[#0BB24847] py-2 lg:py-4 px-3 lg:px-5 rounded-full gap-5' >
                    <Icon icon="bi:info-circle" width="20" height="20" color='#05031F' />
                    <p className='text-sm font-cabin lg:text-base text-[#05031F] '>Need help? Visit the seller university for detailed guides</p>
                </div>

                <div className="flex flex-col lg:flex-row mt-[15.5px] xl:mt-[91px] gap-4 relative">
                    {/* Left Section */}
                    <div className="flex-1 space-y-4 bg-[#F7F7F7] border border-[#00000024] rounded-lg py-3 lg:py-7 px-3 lg:px-6 ">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-cabin font-base" >Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter product title"
                                className='bg-[#FFFFFF] border border-[#02020238] rounded-full'
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2  ">
                            <Label htmlFor="description" className="font-cabin font-base" >Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter product description"
                                className="min-h-[226px] rounded-2xl py-4 border border-[#02020238] "
                            />
                        </div>

                        {/* Product Images */}
                        <div>
                        <Card className="border border-[#02020238]">
                            <CardHeader>
                                <CardTitle className='text-base lg:text-lg font-cabin font-medium'>Product Images</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                                    <div className="flex flex-col items-center justify-center gap-4 lg:gap-7 mb-7 lg:mb-14">
                                        <img src={UploadImage} alt="Upload Image" className="w-12 h-12 lg:w-28 lg:h-28 mx-auto mb-2" />
                                        <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F96]">Upload Up To 5 Square Images With Dimensions Min Of 1024 X 1024, Max: 3200 X 3200</p>
                                    </div>
                                    <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
                                        {images.map((image, index) => (
                                            <div key={index} className="relative sm:w-24 sm:h-24 w-16 h-16">
                                                <img
                                                    src={URL.createObjectURL(image)}
                                                    alt={`Product image ${index + 1}`}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <button
                                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                                                    onClick={() => {
                                                        const newImages = [...images];
                                                        newImages.splice(index, 1);
                                                        setImages(newImages);
                                                    }}
                                                >
                                                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {images.length < 5 && (
                                            <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col text-sm space-y-2 font-cabin text-[#05031F]/80 items-center justify-center cursor-pointer">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            setImages([...images, e.target.files[0]]);
                                                        }
                                                    }}
                                                />
                                                Add Image
                                                <Icon icon="solar:add-circle-bold" className="w-6 h-6" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        </div>

                        {/* Shipping & Pricing */}
                        <Card>
                            <CardHeader>
                                <CardTitle className='text-base lg:text-lg font-cabin font-medium mb-5'>Shipping & Pricing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Pricing</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                            <Input
                                                type="number"
                                                className="pl-8"
                                                placeholder="0.00"
                                                value={shippingDetails.pricing}
                                                onChange={(e) => handleShippingChange('pricing', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>On Sale Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                            <Input
                                                type="number"
                                                className="pl-8"
                                                placeholder="0.00"
                                                value={shippingDetails.salePrice}
                                                onChange={(e) => handleShippingChange('salePrice', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Weight (Optional)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="0.0"
                                                value={shippingDetails.weight}
                                                onChange={(e) => handleShippingChange('weight', e.target.value)}
                                            />
                                            <Select
                                                value={shippingDetails.weightUnit}
                                                onValueChange={(value) => handleShippingChange('weightUnit', value)}
                                            >
                                                <SelectTrigger className="w-20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kg">kg</SelectItem>
                                                    <SelectItem value="g">g</SelectItem>
                                                    <SelectItem value="lb">lb</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <Label>Inventory</Label>
                                        <Input
                                            type="number"
                                            placeholder="102"
                                            value={shippingDetails.inventory}
                                            onChange={(e) => handleShippingChange('inventory', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Condition</Label>
                                        <Select
                                            value={shippingDetails.condition}
                                            onValueChange={(value) => handleShippingChange('condition', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fairly-used">Fairly Used</SelectItem>
                                                <SelectItem value="new">New</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Dimensions</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder="L"
                                                    value={shippingDetails.dimensions.length}
                                                    onChange={(e) => handleShippingChange('dimensions.length', e.target.value)}
                                                    className="rounded-full text-center"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder="W"
                                                    value={shippingDetails.dimensions.width}
                                                    onChange={(e) => handleShippingChange('dimensions.width', e.target.value)}
                                                    className="rounded-full text-center"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder="H"
                                                    value={shippingDetails.dimensions.height}
                                                    onChange={(e) => handleShippingChange('dimensions.height', e.target.value)}
                                                    className="rounded-full text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Variants Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        className="rounded" 
                                        checked={showVariants}
                                        onChange={(e) => setShowVariants(e.target.checked)}
                                    />
                                    <CardTitle>Variants (Optional)</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {showVariants ? (
                                    <div className="space-y-4">
                                        {variants.map((variant) => (
                                            <div key={variant.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                                <div className="w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center">
                                                    <Icon icon="solar:upload-linear" className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <Input 
                                                        value={variant.size} 
                                                        placeholder="Size" 
                                                        disabled 
                                                        className="rounded-full"
                                                    />
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                                        <Input 
                                                            value={variant.price} 
                                                            placeholder="0.00" 
                                                            disabled 
                                                            className="pl-8 rounded-full"
                                                        />
                                                    </div>
                                                    <Input 
                                                        value={variant.stock} 
                                                        placeholder="Stock" 
                                                        disabled 
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleRemoveVariant(variant.id)}
                                                    className="text-red-500"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold" className="w-10 h-10" />
                                                </Button>
                                            </div>
                                        ))}

                                        {variants.length < 2 && (
                                            <div className="flex items-center gap-4 p-4 border rounded-lg">
                                                <div className="w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center">
                                                    <Icon icon="solar:upload-linear" className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <Input 
                                                        value={newVariant.size} 
                                                        onChange={(e) => handleVariantChange('size', e.target.value)}
                                                        placeholder="Size" 
                                                        className="rounded-full"
                                                    />
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                                                        <Input 
                                                            value={newVariant.price}
                                                            onChange={(e) => handleVariantChange('price', e.target.value)}
                                                            placeholder="0.00" 
                                                            type="number"
                                                            className="pl-8 rounded-full"
                                                        />
                                                    </div>
                                                    <Input 
                                                        value={newVariant.stock}
                                                        onChange={(e) => handleVariantChange('stock', e.target.value)}
                                                        placeholder="Stock" 
                                                        type="number"
                                                        className="rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {variants.length < 2 && (
                                            <Button 
                                                onClick={handleAddVariant}
                                                variant="outline"
                                                className="mt-4 bg-[#05031F] text-white rounded-full px-4 py-2 flex items-center gap-2 hover:bg-[#05031F]/80"
                                            >
                                                <Icon icon="simple-line-icons:plus" className="w-4 h-4" />
                                                Add 
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                            <p className="mt-2 text-gray-500">Add a new variant, there are none yet!!</p>
                                        </div>
                                        <Button 
                                            onClick={() => setShowVariants(true)}
                                            variant="outline"
                                            className="mt-4 lg:mt-12 bg-[#05031F] w-fit flex items-center justify-center gap-2 text-white rounded-full px-3 py-3 text-[11px] md:text-sm lg:px-3 lg:py-5 hover:bg-[#05031F]/80"
                                        >
                                            <Icon icon="simple-line-icons:plus" className="w-4 h-4" />
                                            Add New
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Size Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Size Options</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                    <p className="mt-2 text-gray-500">Add a new size variant, there are none yet!!</p>
                                </div>
                                <Button variant="outline" className="mt-4 lg:mt-12 bg-[#05031F] flex items-center justify-center gap-0 text-white rounded-full px-3 py-3 text-[11px] md:text-sm lg:px-3 lg:py-5 hover:bg-[#05031F]/80 hover:scale-95 transition-all duration-300 ease-in-out hover:text-white ">
                                    <Icon icon="simple-line-icons:plus" className="mr-2" color="#FFFFFF" />
                                    Add New
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Color Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Color Options</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                    <p className="mt-2 text-gray-500">Add a new color variant, there are none yet!!</p>
                                </div>
                                <Button variant="outline" className="mt-4 lg:mt-12 bg-[#05031F] flex items-center justify-center gap-0 text-white rounded-full px-3 py-3 text-[11px] md:text-sm lg:px-3 lg:py-5 hover:bg-[#05031F]/80 hover:scale-95 transition-all duration-300 ease-in-out hover:text-white ">
                                    <Icon icon="simple-line-icons:plus" className="mr-2" color="#FFFFFF" />
                                    Add New
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Product Specifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Specifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Icon icon="solar:widget-add-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                    <p className="mt-2 text-gray-500">No categories selected yet, be sure to choose your product category!!</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Blips Section */}
                        <Card>
                            <CardHeader className="flex justify-between items-center">
                                <CardTitle>Blips (Recommended)</CardTitle>
                                <Button variant="link">What are blips?</Button>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                                    onClick={() => document.getElementById('blip-upload').click()}
                                >
                                    <Icon icon="solar:video-add-bold" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="font-medium mb-1">Click To Upload</p>
                                    <p className="text-sm text-gray-500">
                                        Upload A Vertical Video Max 60 Seconds, To Improve Visibility Of Your Products
                                    </p>
                                    <input
                                        type="file"
                                        id="blip-upload"
                                        className="hidden"
                                        accept="video/*"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Section - Collapsible */}
                    <div className="lg:w-[300px]">
                        <Collapsible
                            open={isRightPanelOpen}
                            onOpenChange={setIsRightPanelOpen}
                            className="bg-white rounded-lg shadow-sm"
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-lexend font-medium">Product Details</h3>
                                {/* Mobile Trigger */}
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="lg:hidden">
                                        <Icon
                                            icon={isRightPanelOpen ? "solar:arrow-right-bold" : "solar:arrow-left-bold"}
                                            className="h-4 w-4"
                                        />
                                    </Button>
                                </CollapsibleTrigger>
                                {/* Desktop Trigger */}
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hidden lg:flex"
                                    >
                                        <Icon
                                            icon={isRightPanelOpen ? "solar:arrow-right-bold" : "solar:arrow-left-bold"}
                                            className="h-4 w-4"
                                        />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="p-4 space-y-4">
                                <div>
                                    <Label>Status</Label>
                                    <Select defaultValue="active">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Product Type</Label>
                                    <Input placeholder="Choose a product type..." />
                                </div>

                                <div>
                                    <Label>Vendor</Label>
                                    <Input value="Luxyd Wears And Clothing" disabled />
                                </div>

                                <div>
                                    <Label>Category</Label>
                                    <Input placeholder="Choose a category..." />
                                </div>

                                <div>
                                    <Label>Sub-Category</Label>
                                    <Input placeholder="Choose a sub-category..." />
                                </div>

                                <div>
                                    <Label>Barcode (Optional)</Label>
                                    <Input placeholder="038400" />
                                </div>

                                <div>
                                    <Label>Brand</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a Brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="brand1">Brand 1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Logistics Settings</Label>
                                    <Select defaultValue="auqli">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auqli">Shipped Via Auqli</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Warehouse Location</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="loc1">Location 1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Content Diagnosis */}
                                <div className="bg-[#05031F] text-white p-4 rounded-lg mt-6">
                                    <h3 className="text-lg font-semibold mb-4">Content Diagnosis</h3>
                                    <p>To Be Improved</p>
                                    <div className="h-2 bg-red-600 rounded-full w-3/4 my-2"></div>
                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:check-circle-bold" className="text-green-500" />
                                            <span className="text-sm">Add at least 3 images</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:close-circle-bold" className="text-red-500" />
                                            <span className="text-sm">Choose a product category</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:close-circle-bold" className="text-red-500" />
                                            <span className="text-sm">Add a product title</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:close-circle-bold" className="text-red-500" />
                                            <span className="text-sm">Add a product description</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:close-circle-bold" className="text-red-500" />
                                            <span className="text-sm">Select a warehouse location</span>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="outline">Cancel</Button>
                    <Button variant="outline">Save Draft</Button>
                    <Button className="bg-[#05031F]">Publish Product</Button>
                </div>
            </div>
        </>
    );
};

export default AddProduct;