import { Outlet, useNavigation } from "react-router-dom";
import Loader from "./Loader";
import ScrollToTop from "../Utilities/ScrollToTop";

const DashboardLayout = () => {
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

export default DashboardLayout
