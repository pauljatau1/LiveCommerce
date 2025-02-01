import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigation, useOutletContext } from "react-router-dom";



const MarketingPage = () => {
    const { isSidebarOpen, setIsSidebarOpen, setHeaderName, setNavName } = useOutletContext();
    const [open, setOpen] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [notification, setNotification] = useState(true);

    useEffect(() => {
        setHeaderName('Marketing')
        setNavName('')
    }, [])


    return (
        <>   
        <div>
            <h1>Marketing</h1>
        </div>
        </>
    )
}

export default MarketingPage
