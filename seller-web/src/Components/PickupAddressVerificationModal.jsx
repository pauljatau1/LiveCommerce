import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from "@/Components/ui/button";
import { 
  ChevronRight, 
  ChevronLeft, 
  Building, 
  User, 
  CheckCircle, 
  Home, 
  MapPin, 
  Globe, 
  InfoIcon,
  Briefcase,
  CreditCard,
  Shield,
  Sparkles,
  CheckSquare,
  Loader2
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { toast } from "sonner";
import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import VerificationService from '@/services/VerificationService';
import { Icon } from '@iconify/react';
import { trackEvent } from '@/util/analytics';

// Extract YouTube video ID from URL
const getYoutubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Create thumbnail URL from video ID
const getYoutubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const PickupAddressVerificationModal = ({ 
  isOpen, 
  onClose, 
  isPending = false,
  title,
  message
}) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [currentView, setCurrentView] = useState('initial'); // 'initial' or 'verification'
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    city: '',
    streetAddress1: '',
    streetAddress2: '',
    zipCode: ''
  });
  
  // Country-state-city data
  const [countryId, setCountryId] = useState(0);
  const [stateId, setStateId] = useState(0);

  // Onboarding video details
  const onboardingVideoUrl = "https://www.youtube.com/watch?v=nAMdwpL_u90";
  const videoId = getYoutubeVideoId(onboardingVideoUrl);
  const thumbnailUrl = videoId ? getYoutubeThumbnail(videoId) : null;
  
  // Set default title and message based on status
  const defaultTitle = "Pickup Address Required";
  const defaultMessage = "Your seller account does not have a pickup address yet. To access product listing features and start selling on Auqli, you need to add a pickup address.";
  
  // Use provided values or defaults
  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handler functions for new package
  const handleCountrySelect = (selectedCountry) => {
    setCountryId(selectedCountry.id);
    setStateId(0); // Reset state when country changes
    setFormData({
      ...formData,
      country: selectedCountry.name,
      state: '',
      city: ''
    });
  };

  const handleStateSelect = (selectedState) => {
    setStateId(selectedState.id);
    setFormData({
      ...formData,
      state: selectedState.name,
      city: ''
    });
  };

  const handleCitySelect = (selectedCity) => {
    setFormData({
      ...formData,
      city: selectedCity.name
    });
  };

  const handleStartVerification = () => {
    setCurrentView('verification');
    setCurrentStep(0);
  };

  const openVideoModal = (e) => {
    e.stopPropagation();
    setActiveVideo(videoId);
  };

  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  // Create a portal target for the video modal
  useEffect(() => {
    if (!document.getElementById('video-modal-container')) {
      const modalContainer = document.createElement('div');
      modalContainer.id = 'video-modal-container';
      document.body.appendChild(modalContainer);
    }
    
    return () => {
      const container = document.getElementById('video-modal-container');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // Initialize with default country (Nigeria)
  useEffect(() => {
    if (countryId === 0) {
      // Set Nigeria as default (ID: 161 in the new package)
      setCountryId(161);
      setFormData(prev => ({
        ...prev,
        country: 'Nigeria'
      }));
    }
  }, [countryId]);

  // Verification steps
  const verificationSteps = [
    {
      id: 'account-type',
      title: "Account Type",
      description: "Choose the type of account you're creating",
      content: (
        <div className="py-6">
          <RadioGroup 
            value={accountType} 
            onValueChange={setAccountType}
            className="space-y-6"
          >
            <div 
              className={`flex items-start space-x-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
                accountType === 'individual' 
                  ? 'border-green-600 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg shadow-green-100 dark:shadow-none' 
                  : 'hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
              onClick={() => setAccountType('individual')}
            >
              <RadioGroupItem value="individual" id="individual" className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="individual" className="font-medium text-lg flex items-center gap-2 cursor-pointer">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40">
                      <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Individual Account
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  For personal sellers, freelancers, or sole proprietors who don&apos;t have a registered business entity.
                  Simpler verification requirements but with some limitations on transaction volumes.
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Simpler Verification
                  </span>
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 flex items-center gap-1">
                    <User className="h-3 w-3" /> Personal Use
                  </span>
                </div>
              </div>
            </div>
            
            <div 
              className={`flex items-start space-x-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
                accountType === 'business' 
                  ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg shadow-blue-100 dark:shadow-none' 
                  : 'hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
              onClick={() => setAccountType('business')}
            >
              <RadioGroupItem value="business" id="business" className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="business" className="font-medium text-lg flex items-center gap-2 cursor-pointer">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40">
                      <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Business Account
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  For registered businesses, companies, partnerships or organizations with a formal business structure.
                  Provides higher transaction limits and additional business-focused features.
                </p>
                <div className="flex gap-2 mt-2 text-xs flex-wrap">
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Business Features
                  </span>
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Higher Limits
                  </span>
                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Global Access
                  </span>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>
      ),
    },
    {
      id: 'address-info',
      title: "Address Information",
      description: "Enter your pickup address details",
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-center gap-3">
            <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This address will be used as your pickup location for order fulfillment. Please ensure all details are accurate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="h-4 w-4 text-gray-500" /> Country <span className="text-red-500">*</span>
              </Label>
              <div className="w-full">
                <CountrySelect
                  onChange={handleCountrySelect}
                  placeHolder="Select Country"
                  defaultValue={countryId}
                  containerClassName="w-full"
                  inputClassName="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10 rounded-md"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-4 w-4 text-gray-500" /> State/Province <span className="text-red-500">*</span>
              </Label>
              <div className="w-full">
                <StateSelect
                  countryid={countryId}
                  onChange={handleStateSelect}
                  placeHolder="Select State"
                  defaultValue={stateId}
                  containerClassName="w-full"
                  inputClassName="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1.5 text-sm font-medium">
                <Home className="h-4 w-4 text-gray-500" /> City <span className="text-red-500">*</span>
              </Label>
              <div className="w-full">
                <CitySelect
                  countryid={countryId}
                  stateid={stateId}
                  onChange={handleCitySelect}
                  placeHolder="Select City"
                  containerClassName="w-full"
                  inputClassName="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10 rounded-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-4 w-4 text-gray-500" /> Zip/Postal Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="Zip/Postal code"
                required
                className="border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 h-10 "
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="streetAddress1" className="flex items-center gap-1.5 text-sm font-medium">
              <Home className="h-4 w-4 text-gray-500" /> Street Address Line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="streetAddress1"
              name="streetAddress1"
              value={formData.streetAddress1}
              onChange={handleInputChange}
              placeholder="Street address, P.O. box, company name"
              required
              className="border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="streetAddress2" className="flex items-center gap-1.5 text-sm font-medium">
              <Home className="h-4 w-4 text-gray-500" /> Street Address Line 2
            </Label>
            <Input
              id="streetAddress2"
              name="streetAddress2"
              value={formData.streetAddress2}
              onChange={handleInputChange}
              placeholder="Apartment, suite, unit, building, floor, etc."
              className="border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 h-10"
            />
          </div>
        </div>
      ),
    }
  ];

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      return !!accountType;
    }
    if (currentStep === 1) {
      return formData.country && formData.state && 
             formData.city && formData.streetAddress1 && formData.zipCode;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      handleSubmit();
      return;
    }
    
    if (currentStep < verificationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentView('initial');
      setCurrentStep(0);
      setAccountType('');
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // 1. Select account type
      await VerificationService.selectAccountType(accountType);
      
      // 2. Update address information based on account type
      if (accountType === 'individual') {
        // Get seller data from localStorage for name
        const seller = JSON.parse(localStorage.getItem('seller')) || {};
        
        // Update individual information
        const individualInfo = {
          firstName: seller.firstName || '',
          lastName: seller.lastName || '',
          sellerAddress: {
            country: formData.country,
            state: formData.state,
            city: formData.city,
            addressLine1: formData.streetAddress1,
            addressLine2: formData.streetAddress2 || '',
            zipCode: formData.zipCode
          }
        };
        
        const result = await VerificationService.updateIndividualInformation(individualInfo);
        const sellerDetails = JSON.parse(localStorage.getItem('seller')) || {};

        if (result.status === 200) {
          trackEvent("seller pickup address verification completed", {
            "seller id": sellerDetails._id,
            "seller email": sellerDetails.email,
            "seller store name": sellerDetails.storeName,
            "seller first name": sellerDetails.firstName,
            "seller last name": sellerDetails.lastName,
            "seller phone number": sellerDetails.phoneNumber,
            "Country": individualInfo.sellerAddress.country,
            "State": individualInfo.sellerAddress.state,
            "City": individualInfo.sellerAddress.city,
            "Address Line 1": individualInfo.sellerAddress.addressLine1,
            "Address Line 2": individualInfo.sellerAddress.addressLine2,
            "Zip Code": individualInfo.sellerAddress.zipCode,
          });
        }
      } else {
        // Handle business address
        const seller = JSON.parse(localStorage.getItem('seller')) || {};
        
        const businessInfo = {
          businessEmail: seller.email || '',
          businessNumber: seller.phoneNumber || '',
          businessAddress: {
            country: formData.country,
            state: formData.state,
            city: formData.city,
            addressLine1: formData.streetAddress1,
            addressLine2: formData.streetAddress2 || '',
            zipCode: formData.zipCode
          }
        };
        
       const result = await VerificationService.addBusinessInformation(businessInfo);
       const sellerDetails = JSON.parse(localStorage.getItem('seller')) || {};

       if (result.status === 200) {
         trackEvent("seller pickup address adddress verification completed", {
           "seller id": sellerDetails._id,
           "seller email": sellerDetails.email,
           "seller store name": sellerDetails.storeName,
           "seller first name": sellerDetails.firstName,
           "seller last name": sellerDetails.lastName,
           "seller phone number": sellerDetails.phoneNumber,
           "Country": businessInfo.businessAddress.country,
           "State": businessInfo.businessAddress.state,
           "City": businessInfo.businessAddress.city,
           "Address Line 1": businessInfo.businessAddress.addressLine1,
           "Address Line 2": businessInfo.businessAddress.addressLine2,
           "Zip Code": businessInfo.businessAddress.zipCode,
         });
       }
      }
      
      // Success notification
      toast.success("Pickup address added successfully!", {
        duration: 5000,
      });
      
      // Close the modal and reload
      onClose();
      
      // Force refresh the parent component
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('seller-verification-completed'));
      }
      
      // Reload the page after modal closes
      setTimeout(() => {
        window.location.reload();
      }, 300);
      
    } catch (error) {
      console.error("Error submitting address:", error);
      toast.error(error.response?.data?.message || "Failed to add pickup address");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStepData = () => {
    return verificationSteps[currentStep];
  };

  // Add useEffect to scroll to top when step changes
  useEffect(() => {
    const stepContentContainer = document.querySelector('.step-content-container');
    if (stepContentContainer) {
      stepContentContainer.scrollTop = 0;
    }
  }, [currentStep]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${currentView === 'initial' ? 'max-w-xl' : 'sm:max-w-3xl'} max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border-0 p-0 flex flex-col`}>
          {currentView === 'initial' ? (
            // Initial VerificationDialog UI
            <>
              <DialogHeader className="pb-2 mt-10 px-6">
                <DialogTitle className="flex items-center gap-3 flex-nowrap text-orange-600 text-xl font-semibold">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Icon icon={isPending ? "solar:clock-circle-bold" : "solar:shield-warning-bold"} className="h-6 w-6 text-orange-600" />
                  </div>
                  {displayTitle}
                </DialogTitle>
              </DialogHeader>
              
              <div className="pb-5 px-7">
                <p className="text-gray-700 text-base mb-4 leading-relaxed">
                  {displayMessage}
                </p>
                {!isPending && (
                  <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                    <Icon icon="solar:info-circle-bold" className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">
                      Please add a pickup address to continue with your product listing.
                    </p>
                  </div>
                )}
                
                {!isPending && videoId && (
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm mb-2 font-medium">
                      <Icon icon="solar:play-circle-bold" className="h-4 w-4 text-blue-600 inline mr-1" />
                      Watch our onboarding tutorial to learn how to complete your profile:
                    </p>
                    <div 
                      className="cursor-pointer group relative rounded-lg overflow-hidden"
                      onClick={openVideoModal}
                    >
                      <img 
                        src={thumbnailUrl} 
                        alt="Onboarding Tutorial" 
                        className="w-full aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Icon icon="logos:youtube-icon" className="w-12 h-12" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex justify-end gap-3 pt-2 px-6 pb-6">
                <button 
                  onClick={onClose} 
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
                  {isPending ? "Got it" : "Later"}
                </button>
                {!isPending && (
                  <button 
                    onClick={handleStartVerification}
                    className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-1"
                  >
                    <Icon icon="mdi:location" className="h-4 w-4" />
                    Add Address
                  </button>
                )}
              </DialogFooter>
            </>
          ) : (
            // Verification Modal UI
            <>
              <DialogHeader className="px-6 pt-6 pb-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b">
                <div className="flex items-center gap-2 mb-1">
                  {getCurrentStepData().id === 'account-type' && <Sparkles className="h-5 w-5 text-green-600" />}
                  {getCurrentStepData().id === 'address-info' && <MapPin className="h-5 w-5 text-green-600" />}
                  <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">{getCurrentStepData().title}</DialogTitle>
                </div>
                <DialogDescription className="text-gray-600 text-left dark:text-gray-300">
                  {getCurrentStepData().description}
                </DialogDescription>
              </DialogHeader>

              {/* Progress Indicator */}
              <div className="relative mx-6 mt-4">
                <div className="absolute top-1/2 h-1 w-full bg-gray-200 dark:bg-gray-700 -translate-y-1/2 rounded-full"></div>
                <div 
                  className="absolute top-1/2 h-1 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-500 -translate-y-1/2 transition-all duration-300 ease-in-out rounded-full"
                  style={{ width: `${(currentStep / (verificationSteps.length - 1)) * 100}%` }}
                ></div>
                <div className="relative flex justify-between">
                  {verificationSteps.map((_, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium transition-all duration-200 ease-in-out z-10 border-2 ${
                        index < currentStep 
                          ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-100 dark:shadow-none" 
                          : index === currentStep
                          ? "bg-white text-green-600 border-green-600 ring-4 ring-green-100 dark:ring-green-900 dark:bg-gray-800"
                          : "bg-white text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      }`}
                    >
                      {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="px-6 pb-4 flex-1 overflow-y-auto step-content-container">
                {getCurrentStepData().content}
              </div>

              {/* Navigation Buttons */}
              <DialogFooter className="flex justify-between sm:justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 sticky bottom-0 left-0 right-0 z-10 shadow-md">
                <Button 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={isLoading}
                  className="gap-2 px-4 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Button 
                  onClick={nextStep}
                  disabled={!validateCurrentStep() || isLoading}
                  className={`gap-2 px-5 ${
                    isLoading 
                      ? "bg-gray-400 cursor-not-allowed"
                      : currentStep === verificationSteps.length - 1
                        ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md shadow-green-100 dark:shadow-none"
                        : "bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 shadow-md shadow-blue-100/50 dark:shadow-none"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : currentStep === verificationSteps.length - 1 ? (
                    <>
                      Submit Address
                      <CheckSquare className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Video Modal - Placed outside Dialog and rendered at document body level */}
      {activeVideo && (
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" 
          onClick={closeVideoModal}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="relative w-full max-w-4xl" 
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <button 
              className="absolute -top-10 right-0 text-white hover:text-gray-300" 
              onClick={closeVideoModal}
            >
              <Icon icon="mdi:close" className="w-8 h-8" />
            </button>
            <div className="relative pb-[56.25%] h-0" style={{ pointerEvents: 'auto' }}>
              <iframe 
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                title="Onboarding Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ pointerEvents: 'auto' }}
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

PickupAddressVerificationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isPending: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string
};

export default PickupAddressVerificationModal; 