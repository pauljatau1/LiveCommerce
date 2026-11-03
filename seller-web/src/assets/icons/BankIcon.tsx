import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const BankIcon = ({ width = 12, height = 12, color = "#272D30", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 12 12"
      {...props}
    >
      <path
        fill={color}
        d="m6 .805 4.5 2.598v5.196L6 11.197 1.5 8.6V3.403zm-1.5 4.85v3.522l1 .577V6.232zM2.5 4.5v3.522l1 .577V5.077zm5.469-1.404L5.025 4.803 6 5.366l2.95-1.703zM6 1.96 3.05 3.663l.976.564L6.97 2.519z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default BankIcon;
