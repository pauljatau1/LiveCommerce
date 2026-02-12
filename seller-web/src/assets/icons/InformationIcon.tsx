import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const InformationIcon = ({ width = 12, height = 12, color = "#307FE2", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 17 17"
      {...props}
    >
      <path
        fill={color}
        d="M7.5 12.5h1.667v-5H7.5zm.833-6.667q.354 0 .594-.24.24-.239.24-.593a.8.8 0 0 0-.24-.594.8.8 0 0 0-.594-.24.8.8 0 0 0-.593.24A.8.8 0 0 0 7.5 5q0 .354.24.594t.593.24m0 10.834a8.1 8.1 0 0 1-3.25-.657 8.4 8.4 0 0 1-2.645-1.78 8.4 8.4 0 0 1-1.782-2.647A8.1 8.1 0 0 1 0 8.333q0-1.729.656-3.25a8.4 8.4 0 0 1 1.781-2.645A8.4 8.4 0 0 1 5.084.656 8.1 8.1 0 0 1 8.333 0q1.73 0 3.25.656a8.4 8.4 0 0 1 2.646 1.781 8.4 8.4 0 0 1 1.781 2.646 8.1 8.1 0 0 1 .657 3.25 8.1 8.1 0 0 1-.657 3.25 8.4 8.4 0 0 1-1.78 2.646 8.4 8.4 0 0 1-2.647 1.781 8.1 8.1 0 0 1-3.25.657"
      />
    </svg>
  );
};

export default InformationIcon;
