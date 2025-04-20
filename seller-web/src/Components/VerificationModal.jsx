import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ChevronLeft, 
  Building, 
  User, 
  Upload, 
  CheckCircle, 
  ListChecks, 
  FileText, 
  Home, 
  MapPin, 
  Mail, 
  Phone, 
  CreditCard, 
  AlertCircle, 
  Copy, 
  FileCheck, 
  Shield, 
  ShieldCheck, 
  Tag, 
  BookOpen, 
  Store, 
  Sparkles,
  CheckSquare,
  Award,
  Star,
  Briefcase,
  Globe,

  InfoIcon,
  Calendar,
  Tv,
  Camera,
  X,
  ImageIcon,
  Loader2
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VerificationService from '@/services/VerificationService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Nigerian States and Cities Data
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara"
];

// Cities object mapping states to their major cities
const NIGERIAN_CITIES = {
  Abia: ["Aba", "Umuahia", "Arochukwu", "Bende", "Ohafia"],
  Adamawa: ["Yola", "Mubi", "Jimeta", "Ganye", "Numan"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak"],
  Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Aguata"],
  Bauchi: ["Bauchi", "Azare", "Misau", "Jama'are", "Katagum"],
  Bayelsa: ["Yenagoa", "Brass", "Nembe", "Ogbia", "Sagbama"],
  Benue: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya"],
  Borno: ["Maiduguri", "Biu", "Gwoza", "Dikwa", "Bama"],
  "Cross River": ["Calabar", "Ogoja", "Ikom", "Obudu", "Ugep"],
  Delta: ["Asaba", "Warri", "Sapele", "Ughelli", "Agbor"],
  Ebonyi: ["Abakaliki", "Afikpo", "Onueke", "Ishiagu", "Uburu"],
  Edo: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Igarra"],
  Ekiti: ["Ado Ekiti", "Ikere", "Efon", "Ijero", "Ikole"],
  Enugu: ["Enugu", "Nsukka", "Oji River", "Aguobu-Owa", "Awgu"],
  FCT: ["Abuja", "Gwagwalada", "Kuje", "Bwari", "Kwali"],
  Gombe: ["Gombe", "Billiri", "Kaltungo", "Kumo", "Dukku"],
  Imo: ["Owerri", "Orlu", "Okigwe", "Mbaise", "Oguta"],
  Jigawa: ["Dutse", "Hadejia", "Birnin Kudu", "Gumel", "Kazaure"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan", "Kagoro", "Birnin Gwari"],
  Kano: ["Kano", "Dambatta", "Gaya", "Wudil", "Rano"],
  Katsina: ["Katsina", "Daura", "Funtua", "Dutsin-Ma", "Jibia"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega"],
  Kogi: ["Lokoja", "Okene", "Kabba", "Idah", "Ankpa"],
  Kwara: ["Ilorin", "Offa", "Patigi", "Lafiagi", "Omu-Aran"],
  Lagos: ["Lagos Island", "Ikeja", "Lekki", "Badagry", "Epe", "Ikorodu", "Alimosho", "Surulere", "Apapa", "Mushin"],
  Nasarawa: ["Lafia", "Keffi", "Akwanga", "Nasarawa", "Doma"],
  Niger: ["Minna", "Bida", "Kontagora", "Suleja", "Lapai"],
  Ogun: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ilaro", "Ota"],
  Ondo: ["Akure", "Owo", "Ondo", "Okitipupa", "Ikare"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo"],
  Oyo: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin", "Saki"],
  Plateau: ["Jos", "Pankshin", "Shendam", "Langtang", "Barkin Ladi"],
  Rivers: ["Port Harcourt", "Bonny", "Degema", "Bori", "Eleme"],
  Sokoto: ["Sokoto", "Tambuwal", "Illela", "Gwadabawa", "Rabah"],
  Taraba: ["Jalingo", "Wukari", "Bali", "Takum", "Gembu"],
  Yobe: ["Damaturu", "Potiskum", "Gashua", "Nguru", "Geidam"],
  Zamfara: ["Gusau", "Kaura Namoda", "Anka", "Talata Mafara", "Zurmi"]
};

// Add the Nigerian banks array at the top of the file, after the NIGERIAN_CITIES
const NIGERIAN_BANKS = [
  { name: 'Access Bank Nigeria Plc', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Enterprise Bank Plc', code: '084' },
  { name: 'Fidelity Bank Plc', code: '070' },
  { name: 'First Bank of Nigeria Plc', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank Plc', code: '058' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank Ltd', code: '082' },
  { name: 'Mainstreet Bank Plc', code: '014' },
  { name: 'Skye Bank Plc', code: '076' },
  { name: 'Stanbic IBTC Plc', code: '039' },
  { name: 'Sterling Bank Plc', code: '232' },
  { name: 'Union Bank Nigeria Plc', code: '032' },
  { name: 'United Bank for Africa Plc', code: '033' },
  { name: 'Unity Bank Plc', code: '215' },
  { name: 'WEMA Bank Plc', code: '035' },
  { name: 'Zenith Bank International', code: '057' },
  { name: 'Providus Bank', code: '101' },
  { name: 'PARALLEX BANK LIMITED', code: '104' },
  { name: 'LOTUS BANK LIMITED', code: '303' },
  { name: 'PREMIUM TRUST BANK LTD', code: '105' },
  { name: 'SIGNATURE BANK LTD', code: '106' },
  { name: 'GLOBUS BANK', code: '103' },
  { name: 'TITAN TRUST BANK', code: '102' },
  { name: 'Polaris Bank', code: '067' },
  { name: 'OPTIMUS BANK LTD', code: '107' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Suntrust Bank', code: '100' }
];

const VerificationModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState(null);
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  const [formData, setFormData] = useState({
    // Personal Information (Individual)
    firstName: '',
    lastName: '',
    country: '',
    state: '',
    city: '',
    streetAddress1: '',
    streetAddress2: '',
    zipCode: '',
    
    // Documentation (Individual)
    taxId: null,
    governmentId: null,
    proofOfAddress: null,
    
    // Business Details
    businessName: '',
    businessType: '',
    cacNumber: '',
    
    // Business Contact
    businessEmail: '',
    businessPhone: '',
    
    // Business Address (uses the same fields as personal address)
    
    // Business Documentation
    certificateOfIncorporation: null,
    businessTaxId: null,
    
    // Categories (shared)
    categories: [],
    
    // Bank Information (shared)
    bankName: '',
    accountType: '',
    accountNumber: '',
    accountName: '',
    swiftCode: '',
    bicCode: '',
    bankCountry: '',
    accountCurrency: 'NGN',
    
    // Store Bio (shared)
    storeName: '',
    storeBio: '',
    
    // Store Images (shared)
    storeBanner: null,
    storeProfileImage: null,
    
    // Terms (shared)
    acceptedTerms: false,
  });
  
  // Preview image URLs for the store banner and profile image
  const [previewUrls, setPreviewUrls] = useState({
    storeBanner: null,
    storeProfileImage: null
  });
  
  // State for categories from API
  const [apiCategories, setApiCategories] = useState([]);
  const [isLoading, setIsLoading] = useState({
    categories: false,
    submission: false
  });

  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Custom close handler to show confirmation dialog
  const handleCloseAttempt = () => {
    // If we're on the final success step or haven't started (no account type), just close
    if (currentStep === getTotalSteps() - 1 || !accountType) {
      onClose();
    } else {
      // Otherwise show confirmation dialog
      setShowConfirmDialog(true);
    }
  };

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(prev => ({ ...prev, categories: true }));
        const categoriesData = await VerificationService.getCategories();
        setApiCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load product categories');
      } finally {
        setIsLoading(prev => ({ ...prev, categories: false }));
      }
    };
    
    fetchCategories();
  }, []);

  // Update preview URLs when files are selected
  useEffect(() => {
    if (formData.storeBanner) {
      const bUrl = URL.createObjectURL(formData.storeBanner);
      setPreviewUrls(prev => ({ ...prev, storeBanner: bUrl }));
      return () => URL.revokeObjectURL(bUrl);
    }
  }, [formData.storeBanner]);
  
  useEffect(() => {
    if (formData.storeProfileImage) {
      const pUrl = URL.createObjectURL(formData.storeProfileImage);
      setPreviewUrls(prev => ({ ...prev, storeProfileImage: pUrl }));
      return () => URL.revokeObjectURL(pUrl);
    }
  }, [formData.storeProfileImage]);

  // Prevent opening modal if account is already pending review
  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        const seller = JSON.parse(localStorage.getItem('seller'));
        
        // If account is pending review, close the modal and notify the user
        if (seller?.accountPending) {
          setInternalIsOpen(false);
          if (onClose) onClose();
          
          toast.info("Your account is already under review. You'll be notified when it's approved or declined.", {
            duration: 5000,
          });
        } else {
          setInternalIsOpen(isOpen);
        }
      } catch (error) {
        console.error('Error checking account status:', error);
        setInternalIsOpen(isOpen);
      }
    };
    
    checkAccountStatus();
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // First, let's fix the handleFileChange function to make it more responsive
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData({
        ...formData,
        [name]: files[0]
      });
      // Show a success toast to give feedback that upload was registered
      toast.success(`${files[0].name} selected successfully!`, {
        duration: 3000,
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Add handleStateChange function here, before it's used in the UI
  const handleStateChange = (value) => {
    setFormData({
      ...formData,
      state: value,
      city: '' // Reset city when state changes
    });
  };

  const handleCategoryToggle = (category) => {
    const updatedCategories = formData.categories.includes(category)
      ? formData.categories.filter(c => c !== category)
      : [...formData.categories, category];
    
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(prev => ({ ...prev, submission: true }));
      
      // 1. Select account type
      await VerificationService.selectAccountType(accountType);
      
      // 2. Process steps based on account type
      if (accountType === 'individual') {
        // Update individual information
        const individualInfo = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          sellerAddress: {
            country: formData.country,
            state: formData.state,
            city: formData.city,
            addressLine1: formData.streetAddress1,
            addressLine2: formData.streetAddress2 || '',
            zipCode: formData.zipCode
          }
        };
        
        await VerificationService.updateIndividualInformation(individualInfo);
        
        // Upload individual verification documents
        if (formData.taxId || formData.governmentId || formData.proofOfAddress) {
          const documents = {
            individualTaxId: formData.taxId,
            governmentId: formData.governmentId,
            proofOfAddress: formData.proofOfAddress
          };
          
          await VerificationService.uploadIndividualVerification(documents);
        }
      } else {
        // Handle business verification
        // Step 1: Add business details
        const businessDetails = {
          businessName: formData.businessName,
          businessType: formData.businessType,
          taxInformation: formData.cacNumber // Using cacNumber for taxInformation
        };
        
        await VerificationService.addBusinessDetails(businessDetails);
        
        // Step 2: Add business contact and address information
        const businessInfo = {
          businessEmail: formData.businessEmail,
          businessNumber: formData.businessPhone,
          businessAddress: {
            country: formData.country,
            state: formData.state,
            city: formData.city,
            addressLine1: formData.streetAddress1,
            addressLine2: formData.streetAddress2 || '',
            zipCode: formData.zipCode
          }
        };
        
        await VerificationService.addBusinessInformation(businessInfo);
        
        // Step 3: Upload business verification documents
        if (formData.certificateOfIncorporation || formData.businessTaxId) {
          const documents = {
            certificateOfIncorporation: formData.certificateOfIncorporation,
            businessTaxId: formData.businessTaxId
          };
          
          await VerificationService.uploadCompanyVerification(documents);
        }
      }
      
      // 3. Select categories
      const categoryData = formData.categories.map(cat => {
        const apiCategory = apiCategories.find(c => c.name === cat);
        return {
          name: cat,
          id: apiCategory?._id || '',
          subCategories: [] // We would implement sub-category selection if needed
        };
      });
      
      await VerificationService.selectCategories(categoryData);
      
      // 4. Update bank details
      const bankDetails = {
        bankCountry: formData.bankCountry,
        bankName: formData.bankName,
        bankAccountType: formData.accountType,
        accountCurrency: formData.accountCurrency,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        swiftCode: formData.swiftCode || undefined,
        bankIdentifierCode: formData.bicCode || undefined
      };
      
      await VerificationService.addBankDetails(bankDetails);
      
      // 5. Upload store images if they exist
      if (formData.storeProfileImage) {
        await VerificationService.uploadStoreAvatar(formData.storeProfileImage);
      }
      
      if (formData.storeBanner) {
        await VerificationService.uploadStoreBanner(formData.storeBanner);
      }
      
      // 6. Update store profile
      const storeProfile = {
        storeName: formData.storeName || undefined,
        aboutStore: formData.storeBio
      };
      
      await VerificationService.updateStoreProfile(storeProfile);
      
      // 7. Set account status to pending for review
      await VerificationService.updateAccountPendingStatus(true);
      
      // Success notification
      toast.success("Verification application submitted successfully!");
      
      // Go to final step
      setCurrentStep(getTotalSteps() - 1);
      
      // Close the modal automatically after showing success
      setTimeout(() => {
        onClose();
      }, 3000); // Close after 3 seconds to give user time to see the success message
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error(error.response?.data?.message || "Failed to submit verification");
    } finally {
      setIsLoading(prev => ({ ...prev, submission: false }));
    }
  };

  // Now add a new helper function to create a better file upload component
  const FileUploadComponent = ({ 
    id, 
    name, 
    label, 
    description, 
    icon, 
    color, 
    value, 
    accept = "application/pdf,image/png,image/jpeg,image/jpg" 
  }) => {
    const Icon = icon;
    const onClickUpload = () => {
      document.getElementById(id).click();
    };
    
    return (
      <div className="rounded-xl border border-dashed p-6 space-y-2 transition-all duration-200 hover:border-green-300 dark:border-gray-700 dark:hover:border-green-700 bg-gray-50 dark:bg-gray-800/50">
        <Label htmlFor={id} className="font-medium flex items-center gap-2">
          <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-500`} />
          {label}
        </Label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{description}</p>
        <div className="flex items-center gap-3">
          <div 
            className={`flex-1 rounded-lg border-2 border-dashed transition-colors duration-200 flex flex-col items-center justify-center py-4 px-2 cursor-pointer ${value ? `border-${color}-300 bg-${color}-50 dark:border-${color}-700 dark:bg-${color}-900/20` : 'border-gray-300 dark:border-gray-700'}`}
            onClick={onClickUpload}
          >
            <Upload className={`h-6 w-6 mb-2 ${value ? `text-${color}-600 dark:text-${color}-500` : 'text-gray-400 dark:text-gray-500'}`} />
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {value ? 'File selected' : 'Drag & drop or click to upload'}
            </p>
            <Input
              id={id}
              name={name}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {value && (
            <div className={`flex items-center gap-1 bg-${color}-100 dark:bg-${color}-900/30 px-3 py-2 rounded-md text-${color}-700 dark:text-${color}-400 text-xs`}>
              <CheckCircle className="h-4 w-4" /> 
              <span>File uploaded</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Let's update the validateCurrentStep function to require all document uploads
  const validateCurrentStep = () => {
    // Account Type selection validation
    if (currentStep === 0) {
      return !!accountType;
    }
    
    // For steps that are displayed for both account types
    const individualSpecificSteps = getIndividualSteps();
    const businessSpecificSteps = getBusinessSteps();
    
    // Get the current step data based on account type
    const stepsList = accountType === 'individual' 
      ? [steps[0], ...individualSpecificSteps, ...getCommonEndingSteps()]
      : [steps[0], ...businessSpecificSteps, ...getCommonEndingSteps()];
    
    const currentStepInfo = stepsList[currentStep];
    
    // Individual specific validations
    if (accountType === 'individual') {
      // Personal Information
      if (currentStepInfo.id === 'personal-info') {
        return formData.firstName && formData.lastName && formData.country && formData.state && 
               formData.city && formData.streetAddress1 && formData.zipCode;
      }
      
      // Documentation - require all three documents
      if (currentStepInfo.id === 'documentation') {
        // Ensure all required documents are uploaded
        return formData.taxId && formData.governmentId && formData.proofOfAddress;
      }
    }
    
    // Business specific validations
    if (accountType === 'business') {
      // Business Details
      if (currentStepInfo.id === 'business-details') {
        return formData.businessName && formData.businessType && formData.cacNumber;
      }
      
      // Business Contact and Address
      if (currentStepInfo.id === 'business-contact') {
        return formData.businessEmail && formData.businessPhone && 
               formData.country && formData.state && formData.city && 
               formData.streetAddress1 && formData.zipCode;
      }
      
      // Business Documentation - require both documents
      if (currentStepInfo.id === 'business-documentation') {
        return formData.certificateOfIncorporation && formData.businessTaxId;
      }
    }
    
    // Common validations for both account types
    // Categories
    if (currentStepInfo.id === 'categories') {
      return formData.categories.length > 0;
    }
    
    // Bank Information
    if (currentStepInfo.id === 'bank-information') {
      return formData.bankName && 
             formData.accountType && 
             formData.accountNumber && 
             formData.accountName &&
             formData.bankCountry;
    }
    
    // Store Bio
    if (currentStepInfo.id === 'store-bio') {
      // Require store name and store bio text and profile image
      return formData.storeName && 
             formData.storeBio.length >= 10 && 
             formData.storeProfileImage;
    }
    
    // Terms
    if (currentStepInfo.id === 'terms-conditions') {
      return formData.acceptedTerms;
    }
    
    return true;
  };

  // Helper functions to get steps based on account type
  const getIndividualSteps = () => [
    {
      id: 'personal-info',
      title: "Personal Information",
      description: "Enter your address and contact details",
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-center gap-3">
            <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This information will be used to verify your identity and for payment processing. Please ensure all details are accurate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" /> First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Your first name"
                required
                className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" /> Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Your last name"
                required
                className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="h-4 w-4 text-gray-500" /> Country <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({...formData, country: value})}
                  defaultValue="nigeria"
                >
                  <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-100">
                    <SelectItem value="nigeria">Nigeria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-4 w-4 text-gray-500" /> State/Province <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Select
                  value={formData.state}
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-100 max-h-[300px]">
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1.5 text-sm font-medium">
                <Home className="h-4 w-4 text-gray-500" /> City <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({...formData, city: value})}
                  disabled={!formData.state}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10">
                    <SelectValue placeholder={formData.state ? "Select your city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-100 max-h-[300px]">
                    {formData.state && NIGERIAN_CITIES[formData.state]?.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10"
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
              className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10"
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
              className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'documentation',
      title: "Documentation",
      description: "Upload required verification documents",
      content: (
        <div className="space-y-6 py-4">
          
          
          <div className="space-y-5">
            <FileUploadComponent 
              id="taxId"
              name="taxId"
              label="Tax ID or VAT Number"
              description="Upload a document showing your tax identification number"
              icon={Copy}
              color="green"
              value={formData.taxId}
            />
            
            <FileUploadComponent 
              id="governmentId"
              name="governmentId"
              label="Government ID"
              description="Upload a valid passport, driver's license, or national ID card"
              icon={CreditCard}
              color="blue"
              value={formData.governmentId}
            />
            
            <FileUploadComponent 
              id="proofOfAddress"
              name="proofOfAddress"
              label="Proof of Address"
              description="Upload a utility bill, bank statement, or official document showing your address"
              icon={MapPin}
              color="purple"
              value={formData.proofOfAddress}
            />
          </div>
        </div>
      ),
    },
  ];

  const getBusinessSteps = () => [
    {
      id: 'business-details',
      title: "Business Details",
      description: "Tell us about your business",
      content: (
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-center gap-3">
            <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Provide your business details for verification. This information will also appear on invoices and receipts.
            </p>
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-1.5 text-sm font-medium">
              <Building className="h-4 w-4 text-gray-500" /> Business Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Your business name"
              required
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessType" className="flex items-center gap-1.5 text-sm font-medium">
              <Briefcase className="h-4 w-4 text-gray-500" /> Business Type <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.businessType}
              onValueChange={(value) => setFormData({...formData, businessType: value})}
            >
              <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-100">
                <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="limited_liability_company">Limited Liability Company (LLC)</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="nonprofit">Nonprofit Organization</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cacNumber" className="flex items-center gap-1.5 text-sm font-medium">
              <FileText className="h-4 w-4 text-gray-500" /> Tax Information / CAC Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cacNumber"
              name="cacNumber"
              value={formData.cacNumber}
              onChange={handleInputChange}
              placeholder="Your business registration number"
              required
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your Corporate Affairs Commission (CAC) registration number or equivalent business tax ID
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'business-contact',
      title: "Business Contact Information",
      description: "How customers can reach your business",
      content: (
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-center gap-3">
            <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This contact information will be used for business communications and may be displayed to customers.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessEmail" className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="h-4 w-4 text-gray-500" /> Business Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessEmail"
              name="businessEmail"
              type="email"
              value={formData.businessEmail}
              onChange={handleInputChange}
              placeholder="contact@yourbusiness.com"
              required
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your official business email for communication with Auqli and customers
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessPhone" className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-4 w-4 text-gray-500" /> Business Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessPhone"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleInputChange}
              placeholder="+234 000 0000 000"
              required
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code (e.g., +234 for Nigeria)
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" /> Business Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="h-4 w-4 text-gray-500" /> Country <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({...formData, country: value})}
                    defaultValue="nigeria"
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100">
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state" className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-gray-500" /> State/Province <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    value={formData.state}
                    onValueChange={handleStateChange}
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 max-h-[300px]">
                      {NIGERIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1.5 text-sm font-medium">
                  <Home className="h-4 w-4 text-gray-500" /> City <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData({...formData, city: value})}
                    disabled={!formData.state}
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10">
                      <SelectValue placeholder={formData.state ? "Select your city" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 max-h-[300px]">
                      {formData.state && NIGERIAN_CITIES[formData.state]?.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
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
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
              />
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="streetAddress2" className="flex items-center gap-1.5 text-sm font-medium">
                <Home className="h-4 w-4 text-gray-500" /> Street Address Line 2
              </Label>
              <Input
                id="streetAddress2"
                name="streetAddress2"
                value={formData.streetAddress2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'business-documentation',
      title: "Business Documentation",
      description: "Upload required business verification documents",
      content: (
        <div className="space-y-6 py-4">
          
          
          <div className="space-y-5">
            <FileUploadComponent 
              id="certificateOfIncorporation"
              name="certificateOfIncorporation"
              label="Certificate of Incorporation / Business Registration"
              description="Upload your official business registration document"
              icon={FileCheck}
              color="blue"
              value={formData.certificateOfIncorporation}
            />
            
            <FileUploadComponent 
              id="businessTaxId"
              name="businessTaxId"
              label="Business Tax ID Document"
              description="Upload a document showing your business tax identification number"
              icon={FileText}
              color="purple"
              value={formData.businessTaxId}
            />
          </div>
        </div>
      ),
    },
  ];

  const getCommonEndingSteps = () => [
    {
      id: 'categories',
      title: "Product Categories",
      description: "Select the categories of products you'll be selling",
      content: (
        <div className="py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 flex items-center gap-3 border border-blue-100 dark:border-blue-800">
            <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Choose the categories that best match the products you plan to sell on Auqli.
              You can select multiple categories.
            </p>
          </div>
          
          {isLoading.categories ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading categories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {apiCategories
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort categories alphabetically
                .map(category => (
                <div 
                  key={category._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                    formData.categories.includes(category.name) 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => handleCategoryToggle(category.name)}
                >
                  <div className={`p-2 rounded-full ${
                    formData.categories.includes(category.name)
                      ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {category.image?.url ? (
                      <img 
                        src={category.image.url} 
                        alt={category.name} 
                        className="h-4 w-4 object-cover"
                      />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor={`category-${category._id}`} 
                      className="cursor-pointer font-medium text-sm"
                    >
                      {category.name}
                    </Label>
                  </div>
                  <Checkbox 
                    id={`category-${category._id}`}
                    checked={formData.categories.includes(category.name)}
                    className={`h-5 w-5 ${
                      formData.categories.includes(category.name)
                        ? 'text-green-600 dark:text-green-500'
                        : ''
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
          
          {formData.categories.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Selected Categories ({formData.categories.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.categories
                  .sort((a, b) => a.localeCompare(b)) // Sort selected categories alphabetically
                  .map(cat => (
                  <div key={cat} className="bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full border border-green-200 dark:border-green-700 flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3" /> {cat}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'bank-information',
      title: "Bank Information",
      description: "Enter your bank details for receiving payments",
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-start gap-3 border border-blue-100 dark:border-blue-800">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Secure Payment Information</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your bank details will be used for receiving payments from sales on Auqli. This information is securely stored and only used for payment processing.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="flex items-center gap-1.5 text-sm font-medium">
                <Building className="h-4 w-4 text-gray-500" /> Bank Name <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.bankName}
                onValueChange={(value) => {
                  const selectedBank = NIGERIAN_BANKS.find(bank => bank.name === value);
                  setFormData({
                    ...formData,
                    bankName: value,
                    bicCode: selectedBank.code // Automatically set the BIC code based on selected bank
                  });
                }}
              >
                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 max-h-[300px]">
                  {NIGERIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.name}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankCountry" className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="h-4 w-4 text-gray-500" /> Bank Country <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.bankCountry}
                onValueChange={(value) => setFormData({...formData, bankCountry: value})}
                defaultValue="nigeria"
              >
                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select bank country" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100">
                  <SelectItem value="nigeria">Nigeria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountType" className="flex items-center gap-1.5 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-gray-500" /> Account Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.accountType}
                onValueChange={(value) => setFormData({...formData, accountType: value})}
              >
                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100">
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountCurrency" className="flex items-center gap-1.5 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-gray-500" /> Account Currency <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.accountCurrency}
                onValueChange={(value) => setFormData({...formData, accountCurrency: value})}
              >
                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100">
                  <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                  <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                  <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="flex items-center gap-1.5 text-sm font-medium">
                <Copy className="h-4 w-4 text-gray-500" /> Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Your account number"
                required
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountName" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" /> Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                placeholder="Name as it appears on your bank account"
                required
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="swiftCode" className="flex items-center gap-1.5 text-sm font-medium">
              <FileCheck className="h-4 w-4 text-gray-500" /> SWIFT Code
            </Label>
            <Input
              id="swiftCode"
              name="swiftCode"
              value={formData.swiftCode}
              onChange={handleInputChange}
              placeholder="SWIFT code (if applicable)"
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
            />
            <p className="text-xs text-gray-500 mt-1">Required for international transfers (8-11 characters).</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bicCode" className="flex items-center gap-1.5 text-sm font-medium">
              <FileCheck className="h-4 w-4 text-gray-500" /> Bank Identifier Code (CBN Code)
            </Label>
            <Input
              id="bicCode"
              name="bicCode"
              value={formData.bicCode || ''}
              disabled
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 bg-gray-100"
              placeholder="Will be set automatically based on bank selection"
            />
            <p className="text-xs text-gray-500 mt-1">This code is automatically set based on your selected bank.</p>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mt-4 border border-yellow-100 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Important Note</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Please double-check your banking information to ensure it's accurate. Incorrect bank details can result in failed payments or delays in receiving your funds.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'store-bio',
      title: "Store Bio & Images",
      description: "Tell us about your store and upload images",
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 flex items-start gap-3 border border-purple-100 dark:border-purple-800">
            <Store className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Store Presentation</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Customize how your store appears to customers by uploading a profile image, banner, and writing a compelling description.
              </p>
            </div>
          </div>
          
          {/* Store name */}
          <div className="space-y-2">
            <Label htmlFor="storeName" className="flex items-center gap-1.5 text-sm font-medium">
              <Store className="h-4 w-4 text-gray-500" /> Store Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="storeName"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              placeholder="Your store name"
              required
              className="border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-10"
            />
            <p className="text-xs text-gray-500 mt-1">This is how your store will appear to customers.</p>
          </div>
          
          {/* Store Images Upload Section */}
          <div className="space-y-6 rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" /> Store Images
            </h4>
            
            {/* Store Banner Upload */}
            <div className="space-y-3">
              <Label htmlFor="storeBanner" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-gray-500" /> 
                Store Banner <span className="text-xs text-gray-500 ml-1">(Recommended size: 1200 x 300px)</span>
              </Label>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-1 transition-all duration-200 relative ${
                  previewUrls.storeBanner 
                    ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700' 
                    : 'border-gray-300 hover:border-purple-400 dark:border-gray-700 dark:hover:border-purple-600'
                }`}
              >
                {previewUrls.storeBanner ? (
                  <div className="relative rounded-md overflow-hidden">
                    <img 
                      src={previewUrls.storeBanner} 
                      alt="Store Banner Preview" 
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setFormData(prev => ({...prev, storeBanner: null}));
                        setPreviewUrls(prev => ({...prev, storeBanner: null}));
                      }}
                    >
                      <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </Button>
                  </div>
                ) : (
                  <label 
                    htmlFor="storeBanner" 
                    className="flex flex-col items-center justify-center h-32 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-center text-gray-500">
                      Drag & drop a banner image or <span className="text-purple-600 dark:text-purple-400">browse</span>
                    </p>
                    <p className="text-xs text-center text-gray-400 mt-1">
                      PNG, JPG or JPEG (max. 2MB)
                    </p>
                    <Input
                      id="storeBanner"
                      name="storeBanner"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Store Profile Image Upload */}
            <div className="space-y-3">
              <Label htmlFor="storeProfileImage" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <User className="h-4 w-4 text-gray-500" /> 
                Store Profile Image <span className="text-xs text-gray-500 ml-1">(Square image, min 400 x 400px)</span>
              </Label>
              
              <div className="flex items-center gap-6">
                <div 
                  className={`border-2 border-dashed rounded-lg p-1 transition-all duration-200 ${
                    previewUrls.storeProfileImage 
                      ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700' 
                      : 'border-gray-300 hover:border-purple-400 dark:border-gray-700 dark:hover:border-purple-600'
                  }`}
                >
                  {previewUrls.storeProfileImage ? (
                    <div className="relative rounded-md overflow-hidden">
                      <img 
                        src={previewUrls.storeProfileImage} 
                        alt="Store Profile Preview" 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setFormData(prev => ({...prev, storeProfileImage: null}));
                          setPreviewUrls(prev => ({...prev, storeProfileImage: null}));
                        }}
                      >
                        <X className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                      </Button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="storeProfileImage" 
                      className="flex flex-col items-center justify-center w-24 h-24 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-gray-400 mb-1" />
                      <p className="text-xs text-center text-gray-500">
                        Upload logo
                      </p>
                      <Input
                        id="storeProfileImage"
                        name="storeProfileImage"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Your profile image will be used as your store's logo and will appear on:
                  </p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Your store profile
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Search results
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Product listings
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Store Description */}
          <div className="relative">
            <Label 
              htmlFor="storeBio" 
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
            >
              <FileText className="h-4 w-4 text-gray-500" /> 
              Store Description <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="storeBio"
                name="storeBio"
                value={formData.storeBio}
                onChange={handleInputChange}
                placeholder="Describe your store and products..."
                className="min-h-[180px] w-full rounded-lg border border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 p-4"
              />
              <div className="absolute bottom-3 right-3">
                <div className={`text-xs px-2 py-1 rounded-full ${
                  formData.storeBio.length < 10 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {formData.storeBio.length} / 10 min characters
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Tips for a Great Store Description:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Describe your products and your expertise in creating/sourcing them</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Mention materials, quality standards, and unique features of your products</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Share your brand's story, values, and what makes you stand out</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Include relevant details like shipping timeframes or customization options</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'terms-conditions',
      title: "Terms & Conditions",
      description: "Review and accept our terms of service",
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-start gap-3 border border-blue-100 dark:border-blue-800">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please review and accept our terms of service before submitting your application. 
              This agreement defines the legal relationship between you and Auqli.
            </p>
          </div>
        
          <div className="rounded-xl border p-5 max-h-[250px] overflow-y-auto mb-5 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-md font-medium mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <FileText className="h-5 w-5 text-green-600" /> 
              Auqli Seller Terms of Service
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                By checking the box below, you agree to the following terms:
              </p>
              <ol className="list-decimal text-sm text-gray-600 dark:text-gray-300 pl-5 space-y-3">
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You confirm that all information provided during the verification process is <span className="font-medium text-green-600 dark:text-green-400">true, accurate, and complete</span>.
                </li>
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You understand that Auqli may require additional verification steps or documents before approving your account.
                </li>
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You agree to comply with all applicable laws and regulations related to selling products online.
                </li>
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You acknowledge that Auqli takes a commission on sales as outlined in our fee structure.
                </li>
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You will maintain the confidentiality of your account information and notify Auqli of any unauthorized access.
                </li>
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You grant Auqli permission to verify your identity and business information with third-party services.
                </li>
                <li className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  You understand that Auqli may suspend or terminate your account for violations of our terms or policies.
                </li>
                <li>
                  You agree to our Privacy Policy regarding how we collect, use, and share your information.
                </li>
              </ol>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-5 rounded-xl border border-green-100 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <Checkbox 
              id="acceptedTerms" 
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onCheckedChange={(checked) => setFormData({...formData, acceptedTerms: checked})}
              className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500 rounded"
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="acceptedTerms" className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I accept the terms and conditions
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                By checking this box, you agree to our <span className="text-blue-600 dark:text-blue-400 underline">Terms of Service</span> and <span className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'application-submitted',
      title: "Application Submitted",
      description: "Your verification is being processed",
      content: (
        <div className="py-8 text-center">
          {formData.storeProfileImage ? (
            <div className="mx-auto w-24 h-24 mb-6 rounded-full overflow-hidden border-4 border-green-100 dark:border-green-800 shadow-lg">
              <img 
                src={previewUrls.storeProfileImage} 
                alt="Store Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100 dark:shadow-none">
              <CheckSquare className="h-10 w-10 text-white" />
            </div>
          )}
          
          <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">Verification Submitted!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Thank you for submitting your verification information. Our team will review your application and get back to you within 1-3 business days.
          </p>
          
          <div className="text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 max-w-lg mx-auto">
            <h4 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              What happens next?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">1</span>
                </div>
                <span>Our team will review your submitted information</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">2</span>
                </div>
                <span>You may receive an email requesting additional information if needed</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">3</span>
                </div>
                <span>Once approved, you'll receive a confirmation email</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">4</span>
                </div>
                <span>You'll gain full access to all Auqli seller features</span>
              </li>
            </ul>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <InfoIcon className="h-4 w-4" />
            <span>Your reference ID: <span className="font-mono">AUQ-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span></span>
          </div>
        </div>
      ),
    },
  ];

  // Define base step for account type
  const steps = [
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
                  For personal sellers, freelancers, or sole proprietors who don't have a registered business entity.
                  Simpler verification requirements but with some limitations on transaction volumes.
                </p>
                <div className="flex gap-2 mt-2 text-xs">
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
  ];

  // Get the current step data based on account type
  const getCurrentStepData = () => {
    if (currentStep === 0) {
      return steps[0]; // Account type selection is always the first step
    }
    
    const individualSpecificSteps = getIndividualSteps();
    const businessSpecificSteps = getBusinessSteps();
    const commonEndingSteps = getCommonEndingSteps();
    
    const allSteps = accountType === 'individual' 
      ? [...steps, ...individualSpecificSteps, ...commonEndingSteps]
      : [...steps, ...businessSpecificSteps, ...commonEndingSteps];
    
    return allSteps[currentStep];
  };
  
  // Get total step count based on account type
  const getTotalSteps = () => {
    const individualSpecificSteps = getIndividualSteps();
    const businessSpecificSteps = getBusinessSteps();
    const commonEndingSteps = getCommonEndingSteps();
    
    return 1 + (accountType === 'individual' 
      ? individualSpecificSteps.length 
      : businessSpecificSteps.length) + commonEndingSteps.length;
  };

  const currentStepData = getCurrentStepData();
  
  const nextStep = () => {
    const totalSteps = getTotalSteps();
    const isTermsStep = currentStepData.id === 'terms-conditions';
    
    if (isTermsStep) {
      // Submit the form if on Terms & Conditions step
      handleSubmit();
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <Dialog open={internalIsOpen} onOpenChange={handleCloseAttempt} className="max-h-[90vh]">
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-xl border-0 p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b">
            <div className="flex items-center gap-2 mb-1">
              {currentStepData.id === 'account-type' && <Sparkles className="h-5 w-5 text-green-600" />}
              {currentStepData.id === 'personal-info' && <User className="h-5 w-5 text-green-600" />}
              {currentStepData.id === 'documentation' && <FileCheck className="h-5 w-5 text-green-600" />}
              {currentStepData.id === 'business-details' && <Building className="h-5 w-5 text-blue-600" />}
              {currentStepData.id === 'business-contact' && <Phone className="h-5 w-5 text-blue-600" />}
              {currentStepData.id === 'business-address' && <MapPin className="h-5 w-5 text-blue-600" />}
              {currentStepData.id === 'business-documentation' && <FileText className="h-5 w-5 text-blue-600" />}
              {currentStepData.id === 'categories' && <Tag className="h-5 w-5 text-purple-600" />}
              {currentStepData.id === 'bank-information' && <CreditCard className="h-5 w-5 text-blue-600" />}
              {currentStepData.id === 'store-bio' && <Store className="h-5 w-5 text-purple-600" />}
              {currentStepData.id === 'terms-conditions' && <ShieldCheck className="h-5 w-5 text-purple-600" />}
              {currentStepData.id === 'application-submitted' && <Award className="h-5 w-5 text-green-600" />}
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">{currentStepData.title}</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {currentStepData.description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="relative mx-6 my-4">
            <div className="absolute top-1/2 h-1 w-full bg-gray-200 dark:bg-gray-700 -translate-y-1/2 rounded-full"></div>
            <div 
              className="absolute top-1/2 h-1 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-500 -translate-y-1/2 transition-all duration-300 ease-in-out rounded-full"
              style={{ width: `${(currentStep / (getTotalSteps() - 1)) * 100}%` }}
            ></div>
            <div className="relative flex justify-between">
              {Array.from({ length: getTotalSteps() }).map((_, index) => (
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
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {currentStepData.content}
          </div>

          {/* Navigation Buttons */}
          <DialogFooter className="flex justify-between sm:justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 sticky bottom-0 left-0 right-0 z-10 shadow-md">
            {currentStep > 0 && currentStepData.id !== 'application-submitted' ? (
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={isLoading.submission}
                className="gap-2 px-4 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div></div> // Empty div to maintain layout
            )}
            
            {currentStepData.id !== 'application-submitted' ? (
              <Button 
                onClick={nextStep}
                disabled={!validateCurrentStep() || isLoading.submission}
                className={`gap-2 px-5 ${
                  isLoading.submission 
                    ? "bg-gray-400 cursor-not-allowed"
                    : currentStepData.id === 'terms-conditions' 
                      ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md shadow-green-100 dark:shadow-none"
                      : "bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 shadow-md shadow-blue-100/50 dark:shadow-none"
                }`}
              >
                {isLoading.submission ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : currentStepData.id === 'terms-conditions' ? (
                  <>
                    Submit Application
                    <CheckSquare className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={onClose} className="gap-2 bg-blue-600 hover:bg-blue-700 px-5">
                Close
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              If you leave now, all your verification progress will be lost. 
              Are you sure you want to quit the verification process?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0">Return to Verification</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onClose}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Leave Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VerificationModal; 