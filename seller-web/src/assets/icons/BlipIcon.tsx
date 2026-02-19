import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const BlipIcon = ({ width = 16, height = 16, color = "#757575", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className="BlipIcon"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill={color}
        d="M15.334 8c0-.69-.354-1.38-1.061-1.765L5.732 1.59c-1.376-.748-3.065.226-3.065 1.765V8z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
      <path
        fill="#757575"
        d="m5.732 14.41 8.541-4.645A1.99 1.99 0 0 0 15.333 8H2.668v4.645c0 1.54 1.69 2.512 3.065 1.765"
        opacity=".5"
      />
    </svg>
  );
};

export default BlipIcon;
