import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const StockIcon = ({ width = 16, height = 16, color = "#757575", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className="StockIcon"
      viewBox="0 0 16 13"
      {...props}
    >
      <path
        fill={color}   
        d="M0 1.733A1.733 1.733 0 0 1 1.733 0h12.534A1.733 1.733 0 0 1 16 1.733v.534A1.733 1.733 0 0 1 14.267 4H14v7.067c0 .886-.713 1.6-1.6 1.6H3.6c-.887 0-1.6-.714-1.6-1.6V4h-.267A1.733 1.733 0 0 1 0 2.267zm1.733-.4a.4.4 0 0 0-.4.4v.534a.4.4 0 0 0 .4.4h12.534a.4.4 0 0 0 .4-.4v-.534a.4.4 0 0 0-.4-.4zm3.6 4a.667.667 0 1 0 0 1.334h5.334a.667.667 0 0 0 0-1.334z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default StockIcon;
