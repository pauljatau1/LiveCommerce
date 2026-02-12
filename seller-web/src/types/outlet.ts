export interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (value: boolean) => void;
    hideSidebar: boolean;
    setHideSidebar: (value: boolean) => void;
    fullScreenMode: boolean;
    setFullScreenMode: (value: boolean) => void;
    headerName: string;
    setHeaderName: (value: string) => void;
    navName: string;
    setNavName: (value: string) => void;
    showBackButton: boolean;
    setShowBackButton: (value: boolean) => void;
}