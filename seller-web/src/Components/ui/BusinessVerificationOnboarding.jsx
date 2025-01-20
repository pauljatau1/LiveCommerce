import React, { useState, useContext } from 'react'
import { CircularProgress } from '@mui/material';
import Step3 from '../../assets/Step3.png'
import { useOnboardingContext } from '../../Hooks/useOnboardingContext'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom';

const BusinessVerificationOnboarding = () => {
    const [documents, setDocuments] = useState({
        certificate: {
            file: null,
            fileUrl: '',
            public_id: ''
        },
        taxId: {
            file: null,
            fileUrl: '',
            public_id: ''
        }
    })
    const { submitBusinessVerification, isLoading } = useOnboardingContext()
    const navigate = useNavigate()


    const handleCertificateUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            try {
                setDocuments(prev => ({
                    ...prev,
                    certificate: {
                        file: file,
                        fileUrl: URL.createObjectURL(file),
                        public_id: `certificate_${Date.now()}`
                    }
                }))
            } catch (error) {
                console.error('Error converting certificate file:', error)
                toast.error('Error processing certificate file')
            }
        }
    }

    const handleTaxIdChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setDocuments(prev => ({
                    ...prev,
                    taxId: {
                        file: file,
                        fileUrl: URL.createObjectURL(file),
                        public_id: `taxId_${Date.now()}`
                    }
                }))
            } catch (error) {
                console.error('Error processing tax ID file:', error)
                toast.error('Error processing tax ID file')
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!documents.certificate.file || !documents.taxId.file) {
            toast.error('Please upload both certificate and tax ID files', {
                description: 'All fields are required',
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            })
            return
        }

        const formData = new FormData();
        
        // Append files directly with the expected field names
        formData.append("certificateOfIncorporation", documents.certificate.file);
        formData.append("businessTaxId", documents.taxId.file);

        await submitBusinessVerification(formData);
    }

    const handleBack = () => {
        navigate(-1)
    }

    

    return (
        <div className="py-[47.5px] lg:py-[135px] px-[32px] lg:px-[203.5px]">
            <div className="flex flex-col items-center justify-center">
                <img src={Step3} alt="Step 3" className="w-full lg:w-[1000px]" />
                <div className="flex flex-col items-center justify-center mt-[64px] lg:mt-[125px]">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 lg:mb-7">Verification</h1>
                        <p className="text-center text-base lg:text-2xl font-light">
                            Upload your company registration information for verification.
                        </p>
                        <form onSubmit={handleSubmit} className="w-full mt-14 lg:mt-28">
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label className="text-base lg:text-2xl font-light">Certificate Of Incorporation</label>
                                <div className="w-full relative">
                                    <input
                                        type="file"
                                        onChange={handleCertificateUpload}
                                        className="hidden max-w-[100px]"
                                        id="certificateUpload"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                    <label
                                        htmlFor="certificateUpload"
                                        className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 flex items-center justify-between cursor-pointer hover:border-[#05031F] transition-all duration-500"
                                    >
                                        <span className="text-gray-500 truncate block w-[200px] overflow-hidden whitespace-nowrap">
                                            {documents.certificate.file ? documents.certificate.file.name : 'Upload From Device'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label className="text-base lg:text-2xl font-light">Business Tax ID</label>
                                <div className="w-full relative">
                                    <input
                                        type="file"
                                        onChange={handleTaxIdChange}
                                        className="hidden"
                                        id="taxIdUpload"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                    <label
                                        htmlFor="taxIdUpload"
                                        className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 flex items-center justify-between cursor-pointer hover:border-[#05031F] transition-all duration-500"
                                    >
                                        <span className="text-gray-500 truncate block w-[200px] overflow-hidden whitespace-nowrap">
                                            {documents.taxId.file ? documents.taxId.file.name : 'Upload From Device'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-10 mt-20 lg:mt-14">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="bg-transparent text-[#0BB248] border border-[#0BB248] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#0BB248] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer"
                                >
                                    {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Next'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BusinessVerificationOnboarding
