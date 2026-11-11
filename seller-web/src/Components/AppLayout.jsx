import StudioChrome from '@/studio/Chrome';
import { Outlet } from "react-router-dom";

const AppLayout = () => {
    return (
        <>
            <main>
                <StudioChrome />
                <Outlet />
            </main>
        </>
    )
}

export default AppLayout
