import { cn } from "@/lib/utils"
import PropTypes from "prop-types"

export default function PrimaryButton({ children, onClick, disabled, className }) {
    return (
        <button onClick={onClick} disabled={disabled} className={cn("bg-[#16783A] text-[#F4FFF8] text-[13px] lg:text-[15px] h-[33px] lg:h-[43px] w-[153px] lg:w-[171px] font-lexend rounded-[10px] hover:bg-green-800 transition-all duration-300", className)}>
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

