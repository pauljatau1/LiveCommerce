import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../Hooks/useAuthContext';
import Background1 from '../../assets/background-asset1.png';
import Background2 from '../../assets/background-asset-3.png';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, seller } = useAuthContext();


    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
    console.log("Token Data:", tokenData);
    console.log("Is Authenticated:", isAuthenticated, seller);
    // function to handle go home button by checking if the user is signed in, if so navigate to seller dashboard page else go to login page
    const handleGoHome = () => {
        if (tokenData) {
          if (tokenData.isVerified) {
            navigate('/dashboard/home');
          }
        } else {
            navigate('/', { replace: true });
        }
    };


  return (
    <div>
      <img src={Background1} alt="Background" className="fixed inset-0- w-screen h-screen 2xl:h-[150dvh] object-cover object-center" />
      <img src={Background2} alt="Background" className="fixed inset-0 w-screen h-screen 2xl:h-[150dvh] object-none object-center" />
      <div className="px-4 sm:px-[44px] flex  gap-10 flex-col items-center justify-center relative z-10 py-[21px] min-h-dvh">
        <div className="bg-[#E9E9E914] backdrop-blur-[349.6px] rounded-[22px] px-4 sm:px-[50px] py-[40px] sm:py-[84px] w-full max-w-[755px] mx-4">
          <h1 className="text-[#FFFFFF] text-3xl sm:text-[47.64px] font-medium leading-tight sm:leading-[58.07px] mb-8 sm:mb-[96px] capitalize">Ooops, Page Not Found!!</h1>
          <button onClick={handleGoHome} className="hover:bg-[#FFFFFF] hover:text-[#141B34] transition-all duration-300 bg-transparent border-2 border-[#FFFFFF] text-white text-lg sm:text-xl font-light leading-normal sm:leading-[33.71px] p-4 rounded-lg " >Go Home</button>
        </div>
      </div>
    </div>
  )
};

export default NotFoundPage
