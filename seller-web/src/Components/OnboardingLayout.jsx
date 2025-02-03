import { Outlet, useNavigation } from "react-router-dom";
import Loader from "./Loader";
import ScrollToTop from "../Utilities/ScrollToTop";


const OnboardingLayout = () => {
    const navigation = useNavigation();
    const isLoading = navigation.state === 'loading';

    return (
        <>
            <ScrollToTop />
            <main>
                <Outlet />
            </main>
        </>
    )
}

export default OnboardingLayout
