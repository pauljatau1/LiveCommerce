import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    color?: string;
    width?: number;
    height?: number;
    className?: string;
}

const EmptyProductsIcon = ({ color = "#A9A9A9", width = 88, height = 88, className = "", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={className}
      viewBox="0 0 88 88"
      {...props}
    >
      <path
        fill={color}
        d="M57.75.086 88 15.21v33.73l-5.5-2.75V21.355l-22 11v11.086l-5.5 2.75V32.355l-22-11v9.754l-5.5-2.75V15.211zm0 27.5 7.606-3.824L45.46 12.375l-9.066 4.555zm13.535-6.746 7.82-3.91L57.75 6.23l-6.402 3.223zM49.5 48.94 44 51.69v-.043l-16.5 8.25V79.45L44 71.156v6.188l-19.25 9.625L0 74.55V45.504l24.75-12.375L49.5 45.504zM22 79.45V59.9L5.5 51.65v19.507zm2.75-24.32 15.856-7.906-15.856-7.95-15.855 7.95zm24.75-.043 19.25-9.625L88 55.086V77.73l-19.25 9.625L49.5 77.73zM66 79.836V66.73l-11-5.5v13.105zm16.5-5.5V61.23l-11 5.5v13.105zM68.75 61.96l10.356-5.2-10.356-5.156-10.355 5.157z"
      />
    </svg>
  );
};

export default EmptyProductsIcon;
