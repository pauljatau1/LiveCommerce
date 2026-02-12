import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    color?: string;
    width?: number;
    height?: number;
}

const CustomersIcon = ({ color = "#F7936F", width = 18, height = 18, ...props }: IProps) => {
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
        d="M9 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4.125 9.75a1.875 1.875 0 1 0 0-3.75 1.875 1.875 0 0 0 0 3.75M15.75 7.875a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0M9 8.25A3.75 3.75 0 0 1 12.75 12v4.5h-7.5V12A3.75 3.75 0 0 1 9 8.25M3.75 12c0-.52.075-1.021.216-1.495l-.128.01a2.625 2.625 0 0 0-2.338 2.61V16.5h2.25zm12.75 4.5v-3.375a2.625 2.625 0 0 0-2.466-2.62c.14.473.216.975.216 1.495v4.5z"
      />
    </svg>
  );
};

export default CustomersIcon;
