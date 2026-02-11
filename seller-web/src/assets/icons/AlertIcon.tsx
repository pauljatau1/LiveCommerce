import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const AlertIcon = ({ width = 12, height = 12, color = "#757575", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill={color}
        d="M5.763 13.667a2.335 2.335 0 0 0 4.474 0zM2 13h12v-2l-1.333-2V5.667a4.665 4.665 0 0 0-7.967-3.3 4.67 4.67 0 0 0-1.367 3.3V9L2 11z"
      />
    </svg>
  );
};

export default AlertIcon;
