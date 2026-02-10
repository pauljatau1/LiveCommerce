import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const CheckIcon = ({ width = 12, height = 12, color = "#272D30", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 22 18"
      {...props}
    >
      <path
        fill={color}
        d="M17.881.577c.763-.77 2-.77 2.763 0a1.98 1.98 0 0 1 .027 2.755L10.275 16.431a1.94 1.94 0 0 1-2.81.054L.571 9.538a1.98 1.98 0 0 1 0-2.784c.763-.768 2-.768 2.762 0l5.452 5.496L17.83.634z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default CheckIcon;
