import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const NotFoundPage = () => {
    const navigate = useNavigate();


    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
    console.log("Token Data:", tokenData);

    const isDashboardRoute = location.pathname.startsWith('/dashboard');

    const handleGoHome = () => {
      if (isDashboardRoute) {
        navigate('/dashboard/home', { replace: true });
      } else {
         // Clear app-specific storage
         localStorage.removeItem('sellerToken');
         localStorage.removeItem('seller');
         localStorage.removeItem('onboardingProcess');
         localStorage.removeItem('visitorId')
        navigate('/login', { replace: true });
      }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#17171B] to-[#17171B]/90 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    {/* 404 Number */}
                    <motion.h1 
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20 
                        }}
                        className="text-[120px] sm:text-[200px] animate-bounce font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0BB248] to-[#34d671] leading-none"
                    >
                        404
                    </motion.h1>

                    {/* Error Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 space-y-4"
                    >
                        <h2 className="text-xl sm:text-4xl font-semibold text-white">
                            Oops! Page Not Found
                        </h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            The page you're looking for seems to have wandered off. Let's get you back on track!
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-12 space-x-4"
                    >
                        <button
                            onClick={handleGoHome}
                            className="px-8 py-3 bg-[#0BB248] text-white rounded-lg font-medium hover:bg-[#0BB248]/90 transition-all duration-300 flex items-center gap-2 mx-auto"
                        >
                            <Icon icon="solar:home-2-bold" className="text-xl" />
                            Back to Home
                        </button>
                    </motion.div>

                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <motion.div
                            animate={{ 
                                rotate: 360,
                                transition: { duration: 20, repeat: Infinity, ease: "linear" }
                            }}
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0BB248]/10 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{ 
                                rotate: -360,
                                transition: { duration: 25, repeat: Infinity, ease: "linear" }
                            }}
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#17171B]/20 rounded-full blur-3xl"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFoundPage;
