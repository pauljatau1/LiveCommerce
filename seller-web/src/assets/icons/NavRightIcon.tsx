import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const NavRightIcon = ({ width = 16, height = 16, color = "#737373", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      viewBox="0 0 16 16"
      {...props}
    >
      <path fill={color} d="M11.333 8 4.667 2.667v10.666z" />
    </svg>
  );
};

export default NavRightIcon;
