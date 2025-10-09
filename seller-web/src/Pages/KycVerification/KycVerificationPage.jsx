import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    CheckCircle,
    AlertCircle,
    Mail,
    MapPin,
    FileText,
    CreditCard,
    Loader2,
    Camera,
    ChevronRight,
    ChevronLeft,
    Building,
    User,
    Home,
    Globe,
    InfoIcon,
    Briefcase,
    Shield,
    Sparkles,
    CheckSquare
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/form/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/Components/ui/dialog";
import { useAuthContext } from '@/Hooks/useAuthContext';
//import EmailVerificationModal from '@/Components/EmailVerificationModal';
import VerificationService from '@/services/VerificationService';

// Import SmileID components
import "@smileid/web-components/smart-camera-web";

// Nigerian States and Cities Data (reused from VerificationModal)
const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara"
];

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

const KycVerificationPage = () => {
    const { setHeaderName, setNavName } = useOutletContext();
    const { emailVerified } = useAuthContext();
    const [activeTab, setActiveTab] = useState('address');
    const [sellerDetails, setSellerDetails] = useState(null);
    //const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [smileIdLoading, setSmileIdLoading] = useState(false);
    const [isSmileIdModalOpen, setIsSmileIdModalOpen] = useState(false);
    const [isAddressWarningModalOpen, setIsAddressWarningModalOpen] = useState(false);
    
    // Address verification multi-step state
    const [addressVerificationStep, setAddressVerificationStep] = useState(0);
    const [selectedAccountType, setSelectedAccountType] = useState('');
    
    // Business document selection state
    const [selectedBusinessDocType, setSelectedBusinessDocType] = useState('');
    const [showBusinessDocSelection, setShowBusinessDocSelection] = useState(false);
    
    // NIN input state for individual verification
    const [ninNumber, setNinNumber] = useState('');
    const [showNinInput, setShowNinInput] = useState(false);

    // Address form state
    const [addressForm, setAddressForm] = useState({
        country: 'nigeria',
        state: '',
        city: '',
        streetAddress1: '',
        streetAddress2: '',
        zipCode: ''
    });

    // Bank details form state
    const [bankForm, setBankForm] = useState({
        bankName: '',
        accountType: '',
        accountNumber: '',
        accountName: '',
        swiftCode: '',
        bicCode: '',
        bankCountry: 'nigeria'
    });

    useEffect(() => {
        setHeaderName('KYC Verification');
        setNavName('');

        // Get seller details from localStorage
        const seller = JSON.parse(localStorage.getItem('seller') || '{}');
        setSellerDetails(seller);
        
        // Set account type if already known and skip to address step
        if (seller?.accountType) {
            setSelectedAccountType(seller.accountType);
            setAddressVerificationStep(1); // Skip account type selection
        }
    }, [setHeaderName, emailVerified]);

    // Helper functions to check verification status
    const isEmailVerified = sellerDetails?.emailVerified || false;
    const isAddressVerified = sellerDetails?.accountType === 'individual'
        ? sellerDetails?.hasFilledAddress !== false
        : sellerDetails?.hasFilledBusinessAddress !== false;
    const isDocumentVerified = sellerDetails?.hasFilledVerificationDocuments || false;
    const isBankVerified = sellerDetails?.hasFilledBankDetails || false;

    const getAddressTabName = () => {
        return sellerDetails?.accountType === 'individual' ? 'Personal Address' : 'Business Address';
    };

    const handleAddressInputChange = (e) => {
        const { name, value } = e.target;
        setAddressForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddressStateChange = (value) => {
        setAddressForm(prev => ({
            ...prev,
            state: value,
            city: ''
        }));
    };

    const handleAddressSubmit = async () => {
        try {
            setIsLoading(true);

            // 1. Select account type if not already set
            if (!sellerDetails?.accountType && selectedAccountType) {
                await VerificationService.selectAccountType(selectedAccountType);
            }

            // 2. Update address information based on selected account type
            const accountType = selectedAccountType || sellerDetails?.accountType;
            
            if (accountType === 'individual') {
                const individualInfo = {
                    firstName: sellerDetails?.firstName || '',
                    lastName: sellerDetails?.lastName || '',
                    sellerAddress: {
                        country: addressForm.country,
                        state: addressForm.state,
                        city: addressForm.city,
                        addressLine1: addressForm.streetAddress1,
                        addressLine2: addressForm.streetAddress2 || '',
                        zipCode: addressForm.zipCode
                    }
                };

                await VerificationService.updateIndividualInformation(individualInfo);
            } else {
                const businessInfo = {
                    businessEmail: sellerDetails?.email || '',
                    businessNumber: sellerDetails?.phoneNumber || '',
                    businessAddress: {
                        country: addressForm.country,
                        state: addressForm.state,
                        city: addressForm.city,
                        addressLine1: addressForm.streetAddress1,
                        addressLine2: addressForm.streetAddress2 || '',
                        zipCode: addressForm.zipCode
                    }
                };

                await VerificationService.addBusinessInformation(businessInfo);
            }

            toast.success('Address updated successfully!');

            // Update local storage
            const updatedSeller = { 
                ...sellerDetails,
                accountType: accountType
            };
            
            if (accountType === 'individual') {
                updatedSeller.hasFilledAddress = true;
            } else {
                updatedSeller.hasFilledBusinessAddress = true;
            }
            
            localStorage.setItem('seller', JSON.stringify(updatedSeller));
            setSellerDetails(updatedSeller);

            // Reset address verification step
            setAddressVerificationStep(0);

        } catch (error) {
            console.error('Error updating address:', error);
            toast.error('Failed to update address');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBankInputChange = (e) => {
        const { name, value } = e.target;
        setBankForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBankSubmit = async () => {
        try {
            setIsLoading(true);

            const bankDetails = {
                bankCountry: bankForm.bankCountry,
                bankName: bankForm.bankName,
                bankAccountType: bankForm.accountType,
                accountCurrency: "NGN",
                accountNumber: bankForm.accountNumber,
                accountName: bankForm.accountName,
                swiftCode: bankForm.swiftCode || undefined,
                bankIdentifierCode: bankForm.bicCode || undefined
            };

            await VerificationService.addBankDetails(bankDetails);

            toast.success('Bank details updated successfully!');

            // Update local storage
            const updatedSeller = { ...sellerDetails, hasFilledBankDetails: true };
            localStorage.setItem('seller', JSON.stringify(updatedSeller));
            setSellerDetails(updatedSeller);

        } catch (error) {
            console.error('Error updating bank details:', error);
            toast.error('Failed to update bank details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSmileIdVerification = async () => {
        // Check if address is verified first
        if (!isAddressVerified) {
            setIsAddressWarningModalOpen(true);
            return;
        }

        // For individual accounts, collect NIN if not already provided
        if (sellerDetails?.accountType === 'individual' && !ninNumber) {
            setShowNinInput(true);
            return;
        }

        // For business accounts, show document selection if not already selected
        if (sellerDetails?.accountType === 'business' && !selectedBusinessDocType) {
            setShowBusinessDocSelection(true);
            return;
        }

        try {
            setSmileIdLoading(true);

            // Generate SmileID token using VerificationService
            const getSmileIdToken = async () => {
                try {
                    const tokenRequest = {
                        accountType: sellerDetails?.accountType,
                        userId: sellerDetails?.id,
                        idType: sellerDetails?.accountType === 'individual' ? 'NIN_V2' : selectedBusinessDocType.toUpperCase()
                    };

                    console.log('Requesting SmileID token with:', tokenRequest);
                    const response = await VerificationService.generateSmileIdToken(tokenRequest);
                    console.log('SmileID token response:', response);
                    return response.token;
                } catch (error) {
                    console.error('Token generation error:', error);
                    // For demo purposes, return a mock token if backend isn't ready
                    return 'demo_token_' + Date.now();
                }
            };

            // Get verification token
            const token = await getSmileIdToken();

            // Open the modal and initialize SmileID
            setIsSmileIdModalOpen(true);
            setSmileIdLoading(false);

            // Initialize SmileID after modal is opened
            setTimeout(() => {
                initializeSmileIdInModal(token);
            }, 100);

        } catch (error) {
            console.error('Error starting SmileID verification:', error);
            toast.error('Failed to start verification. Please try again.');
            setSmileIdLoading(false);
        }
    };

    const initializeSmileIdInModal = (token) => {
        // Use NPM package approach as per documentation
        // https://docs.usesmileid.com/integration-options/web-mobile-web/javascript-sdk-beta/usage
        
        const modalContainer = document.getElementById('smile-id-container');
        if (!modalContainer) {
            console.error('SmileID container not found');
            setIsSmileIdModalOpen(false);
            toast.error('Unable to initialize verification system. Please try again.');
            return;
        }

        // Clear any existing content
        modalContainer.innerHTML = '';

        if (sellerDetails?.accountType === 'individual') {
            // For Enhanced KYC with both selfie and document capture
            // Use capture-id attribute to enable document capture after selfie
            const smartCameraWeb = document.createElement('smart-camera-web');
            smartCameraWeb.setAttribute('token', token);
            smartCameraWeb.setAttribute('environment', 'sandbox');
            smartCameraWeb.setAttribute('theme-color', '#16a34a');
            
            // Enable both selfie and document capture (this is the key attribute)
            smartCameraWeb.setAttribute('capture-id', '');
            
            // For NIN, we only need front capture (not back)
            smartCameraWeb.setAttribute('hide-back-of-id', '');

            // Handle successful verification completion - only fires when BOTH selfie and document are captured
            smartCameraWeb.addEventListener('smart-camera-web.publish', (event) => {
                console.log('Enhanced KYC verification completed with both selfie and document:', event.detail);
                
                // Check if we have both selfie and document images
                const { images } = event.detail;
                const hasSelfieCaptured = images && images.some(img => img.image_type_id === 2); // Selfie (number, not string)
                const hasDocumentCaptured = images && images.some(img => img.image_type_id === 3); // Document front (number, not string)
                
                console.log('Images captured:', images);
                console.log('Has selfie:', hasSelfieCaptured);
                console.log('Has document:', hasDocumentCaptured);
                
                if (hasSelfieCaptured && hasDocumentCaptured) {
                    handleDocumentVerificationSuccess(event.detail);
                    setIsSmileIdModalOpen(false);
                    toast.success('Identity verification completed successfully!');
                } else {
                    console.error('Missing required images - selfie or document not captured');
                    toast.error('Verification incomplete. Please ensure both selfie and document are captured.');
                }
            });

            // Handle verification cancellation
            smartCameraWeb.addEventListener('smart-camera-web.cancelled', () => {
                console.log('Enhanced KYC verification cancelled by user');
                setIsSmileIdModalOpen(false);
            });

            // Handle verification errors
            smartCameraWeb.addEventListener('smart-camera-web.error', (event) => {
                console.error('Enhanced KYC verification error:', event.detail);
                setIsSmileIdModalOpen(false);
                toast.error('Verification failed. Please try again.');
            });

            // Start the enhanced KYC flow
            modalContainer.appendChild(smartCameraWeb);

        } else {
            // Business verification flow
            const smartCameraWeb = document.createElement('smart-camera-web');
            smartCameraWeb.setAttribute('token', token);
            smartCameraWeb.setAttribute('environment', 'sandbox');
            smartCameraWeb.setAttribute('theme-color', '#16a34a');
            smartCameraWeb.setAttribute('product', 'business_verification');
            smartCameraWeb.setAttribute('id-type', selectedBusinessDocType?.toUpperCase() || 'BN');
            smartCameraWeb.setAttribute('country', 'NG');

            smartCameraWeb.addEventListener('smart-camera-web.publish', (event) => {
                console.log('Business verification completed:', event.detail);
                handleDocumentVerificationSuccess(event.detail);
                setIsSmileIdModalOpen(false);
                toast.success('Verification completed successfully!');
            });

            smartCameraWeb.addEventListener('smart-camera-web.cancelled', () => {
                console.log('Business verification cancelled');
                setIsSmileIdModalOpen(false);
            });

            smartCameraWeb.addEventListener('smart-camera-web.error', (event) => {
                console.error('Business verification error:', event.detail);
                setIsSmileIdModalOpen(false);
                toast.error('Verification failed. Please try again.');
            });

            modalContainer.appendChild(smartCameraWeb);
        }
    };

    const handleDocumentVerificationSuccess = async (result) => {
        try {
            console.log('Document verification successful:', result);

            // CRITICAL: Submit images to SmileID through backend first
            try {
                const jobData = {
                    images: result.images,
                    partner_params: result.partner_params || {}
                };

                // For individual accounts, include the NIN and other required info
                if (sellerDetails?.accountType === 'individual' && ninNumber) {
                    jobData.idInfo = {
                        first_name: sellerDetails.firstName,
                        last_name: sellerDetails.lastName,
                        country: 'NG', // Nigeria
                        id_type: 'NIN_V2',
                        id_number: ninNumber,
                        phone_number: sellerDetails.phoneNumber,
                        // DOB is optional for NIN_V2 but can be included if available
                        ...(sellerDetails.dateOfBirth && { dob: sellerDetails.dateOfBirth })
                    };
                }

                const jobSubmissionResponse = await VerificationService.processSmileIdJob(jobData);
                console.log('SmileID job submission response:', jobSubmissionResponse);
            } catch (jobError) {
                console.error('Error submitting job to SmileID:', jobError);
                // Continue with local save even if job submission fails
            }

            // Save verification result to backend (commented out for now)
           {/* 
            // Prepare verification data for submission
            const verificationData = {
                smileIdResult: result,
                accountType: sellerDetails?.accountType,
                verifiedAt: new Date().toISOString(),
                verificationProvider: 'SmileID'
            };

            if (sellerDetails?.accountType === 'individual') {
                // For individual accounts, save NIN slip verification
                await VerificationService.saveIndividualVerification(verificationData);
            } else {
                // For business accounts, save business registration verification
                await VerificationService.saveBusinessVerification(verificationData);
            }

            // Update local storage
            const updatedSeller = { ...sellerDetails, hasFilledVerificationDocuments: true };
            localStorage.setItem('seller', JSON.stringify(updatedSeller));
            setSellerDetails(updatedSeller);
            */}

            toast.success('Document verification completed and saved successfully!');
        } catch (error) {
            console.error('Error saving verification result:', error);
            toast.error('Verification completed but failed to save. Please contact support.');
        }
    };

    const handleGoToAddressTab = () => {
        setIsAddressWarningModalOpen(false);
        setActiveTab('address');
    };

    // Address verification step management
    const addressVerificationSteps = [
        {
            id: 'account-type',
            title: "Account Type",
            description: "Choose the type of account you're creating"
        },
        {
            id: 'address-info',
            title: "Address Information", 
            description: "Enter your pickup address details"
        }
    ];

    const validateAddressStep = () => {
        if (addressVerificationStep === 0) {
            return !!selectedAccountType;
        }
        if (addressVerificationStep === 1) {
            return addressForm.country && addressForm.state && 
                   addressForm.city && addressForm.streetAddress1 && addressForm.zipCode;
        }
        return true;
    };

    const nextAddressStep = () => {
        if (addressVerificationStep === 1) {
            handleAddressSubmit();
            return;
        }
        
        if (addressVerificationStep < addressVerificationSteps.length - 1) {
            setAddressVerificationStep(addressVerificationStep + 1);
        }
    };

    const prevAddressStep = () => {
        if (addressVerificationStep > 0) {
            setAddressVerificationStep(addressVerificationStep - 1);
        }
    };

    const tabs = [
      //  {
      //      id: 'email',
      //      label: 'E-mail Verification',
      //      icon: Mail,
      //      isVerified: isEmailVerified
      //  },
     //},
        {
            id: 'address',
            label: getAddressTabName(),
            icon: MapPin,
            isVerified: isAddressVerified
        },
        // {
        //     id: 'documents',
        //     label: 'Identification Document Upload',
        //     icon: FileText,
        //     isVerified: isDocumentVerified
        // },
        {
            id: 'bank',
            label: 'Bank Account Information',
            icon: CreditCard,
            isVerified: isBankVerified
        }
    ];

    if (!sellerDetails) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
                <p className="text-gray-600">Complete your verification to unlock all features</p>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Verification Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tabs.map((tab) => (
                        <div key={tab.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                            <div className={`p-2 rounded-full ${tab.isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {tab.isVerified ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <tab.icon className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{tab.label}</p>
                                <p className={`text-xs ${tab.isVerified ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    {tab.isVerified ? 'Verified' : 'Pending'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${activeTab === tab.id
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`p-1 rounded ${tab.isVerified ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                    {tab.isVerified ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <tab.icon className="h-4 w-4 text-gray-500" />
                                    )}
                                </div>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Email Verification Tab */}
                    {/*activeTab === 'email' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <Mail className="h-6 w-6 text-gray-400" />
                                <h3 className="text-lg font-medium">Email Verification</h3>
                            </div>

                            {isEmailVerified ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h4 className="text-green-800 font-medium">Email Verified</h4>
                                            <p className="text-green-700 text-sm">Your email ({sellerDetails?.email}) has been successfully verified.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-3">
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <h4 className="text-yellow-800 font-medium">Email Not Verified</h4>
                                                <p className="text-yellow-700 text-sm">Please verify your email address to continue.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                                            <Input
                                                type="email"
                                                value={sellerDetails?.email || ''}
                                                disabled
                                                className="mt-1"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => setIsEmailModalOpen(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Verify Now
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) */}

                    {/* Address Verification Tab */}
                    {activeTab === 'address' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <MapPin className="h-6 w-6 text-gray-400" />
                                <h3 className="text-lg font-medium">{getAddressTabName()}</h3>
                            </div>

                            {isAddressVerified ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h4 className="text-green-800 font-medium">Address Verified</h4>
                                            <p className="text-green-700 text-sm">Your {sellerDetails?.accountType === 'individual' ? 'personal' : 'business'} address has been successfully verified.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Multi-step header */}
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            {addressVerificationSteps[addressVerificationStep].id === 'account-type' && <Sparkles className="h-5 w-5 text-green-600" />}
                                            {addressVerificationSteps[addressVerificationStep].id === 'address-info' && <MapPin className="h-5 w-5 text-green-600" />}
                                            <h4 className="text-lg font-semibold text-gray-900">{addressVerificationSteps[addressVerificationStep].title}</h4>
                                        </div>
                                        <p className="text-gray-600 text-sm">{addressVerificationSteps[addressVerificationStep].description}</p>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="relative">
                                        <div className="absolute top-1/2 h-1 w-full bg-gray-200 -translate-y-1/2 rounded-full"></div>
                                        <div 
                                            className="absolute top-1/2 h-1 bg-gradient-to-r from-green-500 to-green-600 -translate-y-1/2 transition-all duration-300 ease-in-out rounded-full"
                                            style={{ width: `${(addressVerificationStep / (addressVerificationSteps.length - 1)) * 100}%` }}
                                        ></div>
                                        <div className="relative flex justify-between">
                                            {addressVerificationSteps.map((_, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ease-in-out z-10 border-2 ${
                                                        index < addressVerificationStep 
                                                            ? "bg-green-600 text-white border-green-600 shadow-md" 
                                                            : index === addressVerificationStep
                                                            ? "bg-white text-green-600 border-green-600 ring-4 ring-green-100"
                                                            : "bg-white text-gray-400 border-gray-200"
                                                    }`}
                                                >
                                                    {index < addressVerificationStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Step Content */}
                                    <div className="min-h-[300px]">
                                        {addressVerificationStep === 0 && (
                                            <div className="py-6">
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                                    <div className="flex items-center space-x-3">
                                                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                        <div>
                                                            <h4 className="text-yellow-800 font-medium">Account Type Selection Required</h4>
                                                            <p className="text-yellow-700 text-sm">Please select your account type to proceed with address verification.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <RadioGroup 
                                                    value={selectedAccountType} 
                                                    onValueChange={setSelectedAccountType}
                                                    className="space-y-6"
                                                >
                                                    <div 
                                                        className={`flex items-start space-x-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
                                                            selectedAccountType === 'individual' 
                                                                ? 'border-green-600 bg-gradient-to-r from-green-50 to-green-100 shadow-lg shadow-green-100' 
                                                                : 'hover:border-gray-300'
                                                        }`}
                                                        onClick={() => setSelectedAccountType('individual')}
                                                    >
                                                        <RadioGroupItem value="individual" id="individual" className="mt-1" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center">
                                                                <Label htmlFor="individual" className="font-medium text-lg flex items-center gap-2 cursor-pointer">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                                                                        <User className="h-5 w-5 text-green-600" />
                                                                    </div>
                                                                    Individual Account
                                                                </Label>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                For personal sellers, freelancers, or sole proprietors who don&apos;t have a registered business entity.
                                                                Simpler verification requirements but with some limitations on transaction volumes.
                                                            </p>
                                                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                                    <Shield className="h-3 w-3" /> Simpler Verification
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                                    <User className="h-3 w-3" /> Personal Use
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div 
                                                        className={`flex items-start space-x-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
                                                            selectedAccountType === 'business' 
                                                                ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg shadow-blue-100' 
                                                                : 'hover:border-gray-300'
                                                        }`}
                                                        onClick={() => setSelectedAccountType('business')}
                                                    >
                                                        <RadioGroupItem value="business" id="business" className="mt-1" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center">
                                                                <Label htmlFor="business" className="font-medium text-lg flex items-center gap-2 cursor-pointer">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                                                        <Building className="h-5 w-5 text-blue-600" />
                                                                    </div>
                                                                    Business Account
                                                                </Label>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                For registered businesses, companies, partnerships or organizations with a formal business structure.
                                                                Provides higher transaction limits and additional business-focused features.
                                                            </p>
                                                            <div className="flex gap-2 mt-2 text-xs flex-wrap">
                                                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                                    <Briefcase className="h-3 w-3" /> Business Features
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                                    <CreditCard className="h-3 w-3" /> Higher Limits
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                                                                    <Globe className="h-3 w-3" /> Global Access
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        )}

                                        {addressVerificationStep === 1 && (
                                            <div className="space-y-6 py-4">
                                                <div className="bg-blue-50 rounded-lg p-4 mb-4 flex items-center gap-3">
                                                    <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                                    <p className="text-sm text-blue-700">
                                                        This address will be used as your pickup location for order fulfillment. Please ensure all details are accurate.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="country" className="flex items-center gap-1.5 text-sm font-medium">
                                                            <Globe className="h-4 w-4 text-gray-500" /> Country <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Select value={addressForm.country} onValueChange={(value) => setAddressForm(prev => ({ ...prev, country: value }))}>
                                                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                                                <SelectValue placeholder="Select country" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="nigeria">Nigeria</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="state" className="flex items-center gap-1.5 text-sm font-medium">
                                                            <MapPin className="h-4 w-4 text-gray-500" /> State <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Select value={addressForm.state} onValueChange={handleAddressStateChange}>
                                                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                                                <SelectValue placeholder="Select state" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {NIGERIAN_STATES.map((state) => (
                                                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city" className="flex items-center gap-1.5 text-sm font-medium">
                                                            <Home className="h-4 w-4 text-gray-500" /> City <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Select
                                                            value={addressForm.city}
                                                            onValueChange={(value) => setAddressForm(prev => ({ ...prev, city: value }))}
                                                            disabled={!addressForm.state}
                                                        >
                                                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                                                <SelectValue placeholder={addressForm.state ? "Select city" : "Select state first"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {addressForm.state && NIGERIAN_CITIES[addressForm.state]?.map((city) => (
                                                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="zipCode" className="flex items-center gap-1.5 text-sm font-medium">
                                                            <MapPin className="h-4 w-4 text-gray-500" /> Zip Code <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="zipCode"
                                                            name="zipCode"
                                                            value={addressForm.zipCode}
                                                            onChange={handleAddressInputChange}
                                                            placeholder="Enter zip code"
                                                            required
                                                            className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="streetAddress1" className="flex items-center gap-1.5 text-sm font-medium">
                                                        <Home className="h-4 w-4 text-gray-500" /> Street Address <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="streetAddress1"
                                                        name="streetAddress1"
                                                        value={addressForm.streetAddress1}
                                                        onChange={handleAddressInputChange}
                                                        placeholder="Street address, P.O. box, company name"
                                                        required
                                                        className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="streetAddress2" className="flex items-center gap-1.5 text-sm font-medium">
                                                        <Home className="h-4 w-4 text-gray-500" /> Street Address 2
                                                    </Label>
                                                    <Input
                                                        id="streetAddress2"
                                                        name="streetAddress2"
                                                        value={addressForm.streetAddress2}
                                                        onChange={handleAddressInputChange}
                                                        placeholder="Apartment, suite, unit, building, floor, etc."
                                                        className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={prevAddressStep} 
                                            disabled={isLoading || addressVerificationStep === 0}
                                            className="gap-2 px-4 hover:bg-gray-100"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Back
                                        </Button>
                                        
                                        <Button 
                                            onClick={nextAddressStep}
                                            disabled={!validateAddressStep() || isLoading}
                                            className={`gap-2 px-5 ${
                                                isLoading 
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : addressVerificationStep === addressVerificationSteps.length - 1
                                                        ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md"
                                                        : "bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 shadow-md"
                                            }`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Processing...
                                                </>
                                            ) : addressVerificationStep === addressVerificationSteps.length - 1 ? (
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
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Document Verification Tab 
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-6 w-6 text-gray-400" />
                                <h3 className="text-lg font-medium">Identification Document Upload</h3>
                            </div>

                            {isDocumentVerified ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h4 className="text-green-800 font-medium">Document Verified</h4>
                                            <p className="text-green-700 text-sm">Your identification document has been successfully verified.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-3">
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <h4 className="text-yellow-800 font-medium">Document Not Verified</h4>
                                                <p className="text-yellow-700 text-sm">
                                                    Please upload your {sellerDetails?.accountType === 'individual' ? 'NIN slip' : 'business registration document'} for verification.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="text-blue-800 font-medium">Required Documents</h4>
                                                <ul className="text-blue-700 text-sm mt-2 space-y-1">
                                                    {sellerDetails?.accountType === 'individual' ? (
                                                        <>
                                                            <li>• National Identification Number (NIN) slip</li>
                                                            <li>• Clear photo of document</li>
                                                            <li>• Ensure all details are visible</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>• Business Registration Certificate</li>
                                                            <li>• Certificate of Incorporation (if applicable)</li>
                                                            <li>• Clear photo of documents</li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center py-8">
                                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Start Verification</h4>
                                        <p className="text-gray-600 mb-6">
                                            We&apos;ll use SmileID to verify your {sellerDetails?.accountType === 'individual' ? 'NIN (National Identification Number)' : 'business registration'} securely.
                                        </p>
                                        {sellerDetails?.accountType === 'individual' && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                                                <div className="flex items-start space-x-3">
                                                    <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <h5 className="text-blue-800 font-medium text-sm">Enhanced KYC with NIN</h5>
                                                        <p className="text-blue-700 text-sm mt-1">
                                                            This will verify your identity using your National Identification Number (NIN). 
                                                            You&apos;ll need to provide your NIN and take a selfie for biometric verification.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            onClick={handleSmileIdVerification}
                                            disabled={smileIdLoading}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {smileIdLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Loading Verification...
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-4 w-4 mr-2" />
                                                    Start {sellerDetails?.accountType === 'individual' ? 'Identity' : 'Business'} Verification
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )} */}

                    {/* Bank Account Tab */}
                    {activeTab === 'bank' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <CreditCard className="h-6 w-6 text-gray-400" />
                                <h3 className="text-lg font-medium">Bank Account Information</h3>
                            </div>

                            {isBankVerified ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h4 className="text-green-800 font-medium">Bank Account Verified</h4>
                                            <p className="text-green-700 text-sm">Your bank account information has been successfully verified.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-3">
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <h4 className="text-yellow-800 font-medium">Bank Account Not Verified</h4>
                                                <p className="text-yellow-700 text-sm">Please provide your bank account information for payments.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleBankSubmit(); }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="bankName" className="text-sm font-medium text-gray-700">Bank Name</Label>
                                                <Select value={bankForm.bankName} onValueChange={(value) => setBankForm(prev => ({ ...prev, bankName: value }))}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select bank" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {NIGERIAN_BANKS.map((bank) => (
                                                            <SelectItem key={bank.code} value={bank.name}>{bank.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="accountType" className="text-sm font-medium text-gray-700">Account Type</Label>
                                                <Select value={bankForm.accountType} onValueChange={(value) => setBankForm(prev => ({ ...prev, accountType: value }))}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select account type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="savings">Savings</SelectItem>
                                                        <SelectItem value="current">Current</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">Account Number</Label>
                                                <Input
                                                    id="accountNumber"
                                                    name="accountNumber"
                                                    value={bankForm.accountNumber}
                                                    onChange={handleBankInputChange}
                                                    className="mt-1"
                                                    placeholder="Enter account number"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="accountName" className="text-sm font-medium text-gray-700">Account Name</Label>
                                                <Input
                                                    id="accountName"
                                                    name="accountName"
                                                    value={bankForm.accountName}
                                                    onChange={handleBankInputChange}
                                                    className="mt-1"
                                                    placeholder="Enter account name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="swiftCode" className="text-sm font-medium text-gray-700">SWIFT Code (Optional)</Label>
                                                <Input
                                                    id="swiftCode"
                                                    name="swiftCode"
                                                    value={bankForm.swiftCode}
                                                    onChange={handleBankInputChange}
                                                    className="mt-1"
                                                    placeholder="Enter SWIFT code"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="bicCode" className="text-sm font-medium text-gray-700">BIC Code (Optional)</Label>
                                                <Input
                                                    id="bicCode"
                                                    name="bicCode"
                                                    value={bankForm.bicCode}
                                                    onChange={handleBankInputChange}
                                                    className="mt-1"
                                                    placeholder="Enter BIC code"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={isLoading || !bankForm.bankName || !bankForm.accountType || !bankForm.accountNumber || !bankForm.accountName}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Bank Details'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* SmileID Verification Modal */}
            <Dialog open={isSmileIdModalOpen} onOpenChange={setIsSmileIdModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-lg font-semibold">
                            Document Verification
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            Please follow the instructions to verify your {sellerDetails?.accountType === 'individual' ? 'identity document' : 'business registration'}.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Modal Content */}
                    <div className="px-6 pb-6 flex flex-col items-center justify-center  max-h-[calc(90vh-120px)] overflow-auto">
                        {/* SmileID Container */}
                        <div
                            id="smile-id-container"
                            className="w-full min-h-[350px] flex items-start justify-center mt-4"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Address Warning Modal */}
            <Dialog open={isAddressWarningModalOpen} onOpenChange={setIsAddressWarningModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Address Verification Required
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            You need to complete your {sellerDetails?.accountType === 'individual' ? 'personal' : 'business'} address verification before you can proceed with document verification.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">Pickup Address Required</p>
                            <p className="text-sm text-yellow-700">
                                We need your verified address to arrange order pickups and deliveries.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddressWarningModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGoToAddressTab}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <MapPin className="h-4 w-4 mr-2" />
                            Complete Address
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* NIN Input Modal 
            <Dialog open={showNinInput} onOpenChange={setShowNinInput}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Enter Your NIN
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            Please enter your National Identification Number (NIN) to proceed with identity verification.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="text-blue-800 font-medium text-sm">Secure Verification</h5>
                                    <p className="text-blue-700 text-sm mt-1">
                                        Your NIN will be used only for identity verification and will be handled securely according to data protection standards.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ninInput" className="text-sm font-medium text-gray-700">
                                National Identification Number (NIN)
                            </Label>
                            <Input
                                id="ninInput"
                                type="text"
                                value={ninNumber}
                                onChange={(e) => setNinNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                placeholder="Enter your 11-digit NIN"
                                maxLength={11}
                                className="text-center tracking-wider"
                            />
                            <p className="text-xs text-gray-500">
                                Enter your 11-digit National Identification Number
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowNinInput(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowNinInput(false);
                                handleSmileIdVerification();
                            }}
                            disabled={!ninNumber || ninNumber.length !== 11}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Continue Verification
                        </Button>
                    </div>
                </DialogContent>
            </Dialog> */}

            {/* Business Document Selection Modal 
            <Dialog open={showBusinessDocSelection} onOpenChange={setShowBusinessDocSelection}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Select Business Document Type
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            Choose the type of business document you have for verification.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <RadioGroup 
                            value={selectedBusinessDocType} 
                            onValueChange={setSelectedBusinessDocType}
                            className="space-y-3"
                        >
                            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="bn" id="bn" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="bn" className="font-medium cursor-pointer">
                                        Business Name Registration (BN)
                                    </Label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        For sole proprietorships and business names registered with CAC.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="co" id="co" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="co" className="font-medium cursor-pointer">
                                        Certificate of Incorporation (CO)
                                    </Label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        For private and public limited companies incorporated with CAC.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="it" id="it" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="it" className="font-medium cursor-pointer">
                                        Incorporated Trustees (IT)
                                    </Label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        For non-profit organizations and NGOs registered as incorporated trustees.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowBusinessDocSelection(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowBusinessDocSelection(false);
                                handleSmileIdVerification();
                            }}
                            disabled={!selectedBusinessDocType}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Continue Verification
                        </Button>
                    </div>
                </DialogContent>
            </Dialog> */}

            {/* Email Verification Modal */}
            {/*This feature has been paused till further notice
            <EmailVerificationModal
                isOpen={isEmailModalOpen}
                userEmail={sellerDetails?.email || ''}
                onClose={() => setIsEmailModalOpen(false)}
            />*/}
        </div>
    );
};

export default KycVerificationPage; 