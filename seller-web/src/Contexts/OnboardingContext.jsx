import { createContext, useContext, useReducer } from 'react';
import { toast } from "sonner"
import axios from 'axios';
import { BASE_URL, BASE_URL_V2 } from '../Constants/Server';
import { useNavigate } from 'react-router-dom';

const OnboardingContext = createContext();

const OnboardingProvider = ({ children }) => {
    const navigate = useNavigate();
    const initialState = {
        isLoading: false,
        isImageUploading: false,
        error: null,
        token: null,
        imageUploadSuccess: false,
    }

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'SET_LOADING':
                return {
                    ...state,
                    isLoading: action.payload
                }
            case "SET_IMAGE_UPLOADING":
                return {
                    ...state,
                    isImageUploading: action.payload
                }
            case "SET_TOKEN":
                return {
                    ...state,
                    token: action.payload
                }
            case "SET_IMAGE_UPLOAD_SUCCESS":
                return {
                    ...state,
                    imageUploadSuccess: action.payload
                }

            default:
                return state;
        }
    }, initialState);


    const storeOnboardingProcess = async (onboardingProcess) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.put(`${BASE_URL}/seller/onboarding-process`, onboardingProcess, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            })
            if (response.status === 200) {
                dispatch({ type: "SET_TOKEN", payload: response.data.token });
                console.log(response.data.message);
            }
        } catch (error) {
            console.log(error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }

    const registerAccountType = async (accountType) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.put(`${BASE_URL_V2}/sellers/profile/account-type`, {
                accountType
            },
                {
                    headers: {
                        Authorization: `Bearer ${data}`
                    }
                }
            );
            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.data.token });
                toast.success('Business Account Type Submitted', {
                    description: 'We will use this information to create your business profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: accountType === 'business' ? 'business-onboarding' : 'individual-onboarding'
                });
                if (accountType === 'business') {
                    navigate("/onboarding/business-onboarding")
                } else {
                    navigate("/onboarding/individual-onboarding")

                }
            }
        } catch (AxiosError) {
            console.log(AxiosError);
            toast.error('Error submitting business Account Type', {
                description: AxiosError.response.data.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }

    const registerBusinessBasicDetails = async (businessName, businessType, businessTaxInformation) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            console.log(data);
            const response = await axios.put(`${BASE_URL_V2}/sellers/business-details`, {
                businessName,
                businessType,
                taxInformation: businessTaxInformation
            },
                {
                    headers: {
                        Authorization: `Bearer ${data}`
                    }
                }
            );
            if (response.status === 200) {
                console.log(response);
                dispatch({ type: 'SET_TOKEN', payload: response.data.data.token });
                toast.success('Business name submitted', {
                    description: 'We will use this information to create your business profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'business-information-onboarding'
                });
                navigate('/onboarding/business-information-onboarding')
            }
        } catch (AxiosError) {
            console.log(AxiosError);
            toast.error('Error submitting business details', {
                description: AxiosError.response.data.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const registerBusinessInformation = async (businessData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.put(`${BASE_URL_V2}/sellers/business-information`, businessData, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.data.token });
                toast.success('Business information submitted', {
                    description: 'We will use this information to create your business profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                return response;
            }
            return null;
        } catch (AxiosError) {
            console.log(AxiosError);
            toast.error('Error submitting business information', {
                description: AxiosError.response.data.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
            return null;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const registerBusinessWarehouse = async (warehouseData, businessInformationData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const businessInfoResponse = await registerBusinessInformation(businessInformationData);

            if (!businessInfoResponse) {
                toast.error('Error submitting business information', {
                    description: 'Please try again',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                return;
            }

            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const warehouseResponse = await axios.put(`${BASE_URL}/seller/shipping-warehouse`, warehouseData, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });

            if (warehouseResponse.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: warehouseResponse.data.token });
                toast.success('Business warehouse submitted', {
                    description: 'We will use this information to create your business profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'business-verification-onboarding'
                });
                navigate('/onboarding/business-verification-onboarding');
            }
        } catch (error) {
            console.log(error);
            toast.error('Error submitting business warehouse', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const submitBusinessVerification = async (formData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);

            const response = await axios.post(
                `${BASE_URL_V2}/sellers/verification/company`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${data}`
                    }
                }
            );

            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.data.token });
                toast.success('Documents submitted successfully', {
                    description: 'Your verification documents have been uploaded',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'business-bank-onboarding'
                });
                navigate('/onboarding/business-bank-onboarding');
            }
        } catch (error) {
            toast.error('Error submitting documents', {
                description: error.response?.data?.errors[0]?.message || error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const submitBankDetails = async (bankDetails) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.put(`${BASE_URL_V2}/sellers/profile/bank-details`, bankDetails, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.data.token });
                toast.success('Bank details submitted', {
                    description: 'We will use this information to create your business profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'business-category-onboarding'
                });
                navigate('/onboarding/business-category-onboarding');
            }
        } catch (error) {
            console.log(error);
            toast.error('Error submitting bank details', {
                description: error.response?.data?.errors[0]?.message || error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });

        }
    };



    const submitBusinessCategory = async (selectedCategories) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.post(`${BASE_URL}/seller/select-categories`, selectedCategories, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.token });
                toast.success('Business Onboarding Completed', {
                    description: 'Your onboarding is complete and your account is being reviewed',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'create-profile'
                });
                navigate('/onboarding/create-profile');
            }
        } catch (error) {
            console.log(error);
            toast.error('Error submitting business category', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const submitShippingOptions = async (shippingOptions) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.put(`${BASE_URL}/seller/shipping-warehouse`, shippingOptions, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.token });
                toast.success('Shipping options submitted', {
                    description: 'We will use this information to create your business profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });

            }
        } catch (error) {
            console.log(error);
            toast.error('Error submitting shipping options', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const registerIndividualBasicDetails = async (individualData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);
            const response = await axios.put(`${BASE_URL}/seller/individual-information`, individualData, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.token });
                toast.success('Individual information submitted', {
                    description: 'We will use this information to create your individual profile',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'individual-verification-onboarding'
                });
                navigate('/onboarding/individual-verification-onboarding');
            }
        } catch (error) {
            console.log(error);
            toast.error('Error submitting individual information', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const submitIndividualVerification = async (formData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);

            const response = await axios.post(
                `${BASE_URL_V2}/sellers/verification/individual`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${data}`
                    }
                }
            );

            if (response.status === 200) {
                dispatch({ type: 'SET_TOKEN', payload: response.data.data.token });
                toast.success('Documents submitted successfully', {
                    description: 'Your individual verification documents have been uploaded',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });
                await storeOnboardingProcess({
                    onboardingProcess: 'create-profile'
                })
                navigate('/onboarding/create-profile');

            }
        } catch (error) {
            toast.error('Error submitting documents', {
                description: error.response?.data?.errors[0]?.message ||error.response?.data?.message || error.message,
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const submitProfileImages = async (profileImage, bannerImage) => {
        try {
            dispatch({ type: 'SET_IMAGE_UPLOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            const { data } = JSON.parse(token);

            // Convert both images to blobs
            const [profileBlob, bannerBlob] = await Promise.all([
                fetch(profileImage).then(r => r.blob()),
                fetch(bannerImage).then(r => r.blob())
            ]);

            // Create FormData for both images
            const profileFormData = new FormData();
            const bannerFormData = new FormData();

            profileFormData.append('avatar', profileBlob, 'profile-image.jpg');
            bannerFormData.append('banner', bannerBlob, 'banner-image.jpg');

            // Make both API calls simultaneously
            const [profileResponse, bannerResponse] = await Promise.all([
                axios.post(`${BASE_URL}/seller/profile/avatar`, profileFormData, {
                    headers: {
                        Authorization: `Bearer ${data}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }),
                axios.post(`${BASE_URL}/seller/profile/banner`, bannerFormData, {
                    headers: {
                        Authorization: `Bearer ${data}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })
            ]);

            // Check if both responses are successful
            if (profileResponse.status === 200 && bannerResponse.status === 200) {
                dispatch({ type: 'SET_IMAGE_UPLOAD_SUCCESS', payload: true });
                toast.success('Profile images submitted successfully', {
                    description: 'Your profile and banner images have been uploaded',
                    style: {
                        background: '#2D3748',
                        color: '#fff',
                    }
                });

                console.log(profileResponse.data);
                console.log(bannerResponse.data);

                // Navigate after successful upload
                await storeOnboardingProcess({
                    onboardingProcess: 'account-approval'
                })
                navigate('/onboarding/account-approval');
            }
        } catch (error) {
            console.log(error);
            dispatch({ type: 'SET_IMAGE_UPLOAD_SUCCESS', payload: false });
            toast.error('Error submitting images', {
                description: error.response?.data?.message || 'Failed to upload images. Please try again.',
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_IMAGE_UPLOADING', payload: false });
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                ...state,
                dispatch,
                registerBusinessBasicDetails,
                registerAccountType,
                registerBusinessWarehouse,
                submitBusinessVerification,
                submitBankDetails,
                submitBusinessCategory,
                submitShippingOptions,
                registerIndividualBasicDetails,
                submitIndividualVerification,
                submitProfileImages
            }}
        >
            {children}
        </OnboardingContext.Provider>
    )
};



export { OnboardingProvider, OnboardingContext };


