import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const UploadIcon = ({ width = 12, height = 12, color = "#fff", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className="lucide:upload"
      viewBox="0 0 12 12"
      {...props}
    >
      <path
        stroke={color}
        d="M6 1.5v6m0-6L8.5 4M6 1.5 3.5 4m7 3.5v2a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default UploadIcon;
