import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const ErrorIcon = ({ width = 12, height = 12, color = "#EE2737", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 20 20"
      {...props}
    >
      <g mask="url(#a)">
        <path
          fill={color}
          d="M10 14.167q.354 0 .594-.24t.24-.594a.8.8 0 0 0-.24-.594A.8.8 0 0 0 10 12.5a.8.8 0 0 0-.594.24.8.8 0 0 0-.24.593q0 .354.24.594t.594.24m-.834-3.334h1.667v-5H9.166zm.834 7.5a8.1 8.1 0 0 1-3.25-.656 8.4 8.4 0 0 1-2.646-1.781 8.4 8.4 0 0 1-1.781-2.646A8.1 8.1 0 0 1 1.667 10q0-1.73.656-3.25a8.4 8.4 0 0 1 1.781-2.646A8.4 8.4 0 0 1 6.75 2.323 8.1 8.1 0 0 1 10 1.667q1.73 0 3.25.656a8.4 8.4 0 0 1 2.646 1.781 8.4 8.4 0 0 1 1.78 2.646 8.1 8.1 0 0 1 .657 3.25 8.1 8.1 0 0 1-.656 3.25 8.4 8.4 0 0 1-1.781 2.646 8.4 8.4 0 0 1-2.646 1.781 8.1 8.1 0 0 1-3.25.656"
        />
      </g>
    </svg>
  );
};

export default ErrorIcon;
