import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const MessageIcon = ({ width = 12, height = 12, color = "#757575", ...props }: IProps) => {
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
        stroke={color}
        d="M4.667 6h6m-6 2.667h6m-6 2.667H8M14.667 8A6.667 6.667 0 0 1 8 14.667H1.333V8a6.667 6.667 0 1 1 13.334 0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

export default MessageIcon;
