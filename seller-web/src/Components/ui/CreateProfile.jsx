import { useState, useContext } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Icon } from '@iconify/react';
import { OnboardingContext } from '../../Contexts/OnboardingContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';


const CreateProfile = () => {
    const navigate = useNavigate();
    const [bannerPreview, setBannerPreview] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const { submitProfileImages, isImageUploading } = useContext(OnboardingContext);

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await convertToBase64(file);
                setBannerPreview(base64);
            } catch (error) {
                console.error("Error converting banner image:", error);
                toast.error('Error processing banner image');
            }
        }
    };

    const handleProfileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await convertToBase64(file);
                setProfilePreview(base64);
            } catch (error) {
                console.error("Error converting profile image:", error);
                toast.error('Error processing profile image');
            }
        }
    };

    const handleSubmit = async () => {
        if (!profilePreview || !bannerPreview) {
            toast.error('Missing Images', {
                description: 'Please upload both profile and banner images',
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
            return;
        }

        await submitProfileImages(profilePreview, bannerPreview);
    };

    return (
        <div className="w-full min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto">
                {/* Banner Section */}
                <div className="relative">
                    <div className="w-full h-[300px] bg-gray-100 overflow-hidden">
                        {bannerPreview ? (
                            <img
                                src={bannerPreview}
                                alt="Banner"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100">
                                <div className="text-center">
                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 text-lg">Upload Banner Image</p>
                                    <p className="text-gray-400 text-sm mt-1">Recommended size: 1584x396</p>
                                </div>
                            </div>
                        )}
                        <label
                            htmlFor="banner-upload"
                            className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 cursor-pointer flex items-center justify-center group"
                        >
                            <span className="bg-white/80 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                <Camera className="w-6 h-6 text-gray-700" />
                            </span>
                        </label>
                        <input
                            type="file"
                            id="banner-upload"
                            className="hidden"
                            onChange={handleBannerUpload}
                            accept="image/*"
                        />
                    </div>

                    {/* Profile Picture */}
                    <div className="absolute left-8 -bottom-16">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                                {profilePreview ? (
                                    <img
                                        src={profilePreview}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                        <Icon icon="icon-park-outline:people-upload" width="48" height="48" className="text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="profile-upload"
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-full cursor-pointer flex items-center justify-center"
                            >
                                <span className="bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                    <Camera className="w-5 h-5 text-gray-700" />
                                </span>
                            </label>
                            <input
                                type="file"
                                id="profile-upload"
                                className="hidden"
                                onChange={handleProfileUpload}
                                accept="image/*"
                            />
                        </div>
                    </div>
                </div>

                {/* Agreement Section */}
                <div className="max-w-2xl mx-auto mt-28 px-6">
                    <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="privacy"
                                className="mt-1.5 h-4 w-4 rounded border-gray-300 text-[#2D3748] focus:ring-[#2D3748]"
                            />
                            <label htmlFor="privacy" className="text-gray-600">
                                By continuing, you agree to our <a href="#" className="text-[#2D3748] hover:underline hover:text-[#2D3748] font-medium">privacy policy</a>
                            </label>
                        </div>

                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1.5 h-4 w-4 rounded border-gray-300 text-[#2D3748] focus:ring-[#2D3748]"
                            />
                            <label htmlFor="terms" className="text-gray-600">
                                I confirm that I have read, and agree to <a href="#" className="text-[#2D3748] hover:underline hover:text-[#2D3748] font-medium">Auqli&apos;s terms and conditions</a>
                            </label>
                        </div>

                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="seller-agreement"
                                className="mt-1.5 h-4 w-4 rounded border-gray-300 text-[#2D3748] focus:ring-[#2D3748]"
                            />
                            <label htmlFor="seller-agreement" className="text-gray-600">
                                By registering as a Seller you agree to comply with our <a href="#" className="text-[#2D3748] hover:underline hover:text-[#2D3748] font-medium">Seller Agreement</a>
                            </label>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pb-8">
                        <button
                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isImageUploading}
                            className="px-6 py-2.5 bg-[#2D3748] text-white font-medium rounded-lg hover:bg-[#2D3748] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImageUploading ? 'Uploading...' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProfile;
