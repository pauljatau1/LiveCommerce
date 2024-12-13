import { Outlet, useNavigation } from "react-router-dom";
import Loader from "./Loader";
import ScrollToTop from "../Utilities/ScrollToTop";


const AppLayout = () => {
    const navigation = useNavigation();
    const isLoading = navigation.state === 'loading';

    return (
        <>
            {isLoading && <Loader />}
            <ScrollToTop />
            <main>
                <Outlet />
            </main>
        </>
    )
}

export default AppLayout
