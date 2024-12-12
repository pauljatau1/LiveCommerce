import { Outlet, useNavigation } from "react-router-dom";
import Loader from "./Loader";


const AppLayout = () => {
    const navigation = useNavigation();
    const isLoading = navigation.state === 'loading';

  return (
    <div>
        {isLoading && <Loader />}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
