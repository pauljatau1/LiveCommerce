export interface HeaderV2Props {
    name: string;
    navName: string;
    showBackButton: boolean;
    fullScreenMode: boolean;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isSidebarOpen: boolean) => void;
}