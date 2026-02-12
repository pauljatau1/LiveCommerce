import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const ZipCodeIcon = ({ width = 16, height = 16, color = "#425466", ...props }: IProps) => {
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
        d="M4.667 4a3.333 3.333 0 1 1 4 3.267v4.066H7.334V7.267A3.33 3.33 0 0 1 4.667 4M2.071 7.333h3.263v1.334h-2.07l-.519 4.666h10.51l-.518-4.666h-2.07V7.333h3.264l.814 7.334H1.255z"
      />
    </svg>
  );
};

export default ZipCodeIcon;
