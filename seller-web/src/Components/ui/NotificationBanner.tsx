import { NotificationType } from '@/types';
import WarningIcon from '@/assets/icons/WarningIcon';
import InformationIcon from '@/assets/icons/InformationIcon';
import ErrorIcon from '@/assets/icons/ErrorIcon';
import MenuCloseIcon from '@/assets/icons/MenuCloseIcon';

interface NotificationBannerProps {
    message: string;
    type: NotificationType;
    visibility: 'fixed' | 'dismissible';
    onClose: () => void;
}

const NotificationBanner = ({ message, type, visibility, onClose }: NotificationBannerProps) => {
    // Define styles based on notification type
    const getStyles = () => {
        switch (type) {
            case 'warning':
                return {
                    bgColor: '#FFFAE5',
                    textColor: '#8A6C00',
                    leftBorderColor: '#FFD60A',
                    icon: WarningIcon,
                };
            case 'information':
                return {
                    bgColor: '#EBF6FF',
                    textColor: '#223A89',
                    leftBorderColor: '#307FE2',
                    icon: InformationIcon,
                };
            case 'error':
                return {
                    bgColor: '#FFEBEF',
                    textColor: '#AE132B',
                    leftBorderColor: '#EE2737',
                    icon: ErrorIcon,
                };
            default:
                return {
                    bgColor: '#EBF6FF',
                    textColor: '#223A89',
                    leftBorderColor: '#307FE2',
                    icon: InformationIcon,
                };
        }
    };

    const styles = getStyles();
    const IconComponent = styles.icon;

    return (
        <div
            className="flex items-center gap-3 pr-4 min-h-[44px] transition-all duration-300 ease-in-out relative"
            style={{
                backgroundColor: styles.bgColor,
                color: styles.textColor,
            }}
        >
            {/* Left border */}
            <div
                className="w-1 self-stretch flex-shrink-0"
                style={{
                    backgroundColor: styles.leftBorderColor,
                }}
            />

            {/* Icon */}
            <div className="flex-shrink-0">
                <IconComponent
                    width={20}
                    height={20}
                    color={styles.leftBorderColor}
                />
            </div>

            {/* Message */}
            <div className="flex-1 max-w-[70%]">
                <p className="text-xs lg:text-sm font-medium" style={{ color: styles.textColor }}>
                    {message}
                </p>
            </div>

            {/* Close button - only show for fixed notifications */}
            {visibility === 'fixed' && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 absolute right-2 top-2 p-1 h-6 w-6 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-500/20"
                    style={{ color: styles.leftBorderColor }}
                    aria-label="Close notification"
                >
                    <MenuCloseIcon
                        width={20}
                        height={20}
                        color={styles.leftBorderColor}
                    />
                </button>
            )}
        </div>
    );
};

export default NotificationBanner;

