import { cn } from "@/lib/utils"
import PropTypes from "prop-types"

interface PrimaryButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    outline?: boolean;
}

export default function PrimaryButton({ children, onClick, disabled, className, outline }: PrimaryButtonProps) {
    return (
        <button onClick={onClick} disabled={disabled} className={cn(outline ? "bg-transparent text-[#16783A] border border-[#16783A] text-[13px] lg:text-[15px] h-[33px] lg:h-[43px] w-[153px] lg:w-[171px] font-lexend rounded-[10px] hover:bg-[#16783A]/10 hover:text-[#16783A] transition-all duration-300" : "bg-[#16783A] text-[#F4FFF8] text-[13px] lg:text-[15px] h-[33px] lg:h-[43px] w-[153px] lg:w-[171px] font-lexend rounded-[10px] hover:bg-green-800 transition-all duration-300", className)}>
            {children}
        </button>
    )
}

PrimaryButton.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    className: PropTypes.string,
}

