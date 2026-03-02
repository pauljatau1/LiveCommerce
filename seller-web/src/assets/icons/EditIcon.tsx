import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const LucideEdit = ({ width = 24, height = 24, color = "#0BB248", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className="lucide:edit"
      viewBox="0 0 12 12"
      {...props}
    >
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 1.5H2.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V6" />
        <path d="M9.188 1.313a1.06 1.06 0 1 1 1.5 1.5L6.18 7.32a1 1 0 0 1-.426.252l-1.437.42a.25.25 0 0 1-.31-.31l.42-1.436a1 1 0 0 1 .253-.426z" />
      </g>
    </svg>
  );
};

export default LucideEdit;
