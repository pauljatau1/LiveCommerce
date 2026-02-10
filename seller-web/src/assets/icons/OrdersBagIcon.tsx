import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    color?: string;
    width?: number;
    height?: number;
}

const OrdersBagIcon = ({ color = "#3014AE", width = 18, height = 18, ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 18 18"
      {...props}
    >
      <path
        fill={color}
        d="M5.625 5.25v-.375a3.375 3.375 0 0 1 6.75 0v.375h1.875c.414 0 .75.337.75.755v9.001c0 .825-.671 1.494-1.495 1.494h-9.01A1.496 1.496 0 0 1 3 15.006v-9c0-.418.334-.756.75-.756zm1.125 0h4.5v-.375a2.25 2.25 0 0 0-4.5 0zm-1.125 0v3H6.75v-3zm5.625 0v3h1.125v-3z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default OrdersBagIcon;
