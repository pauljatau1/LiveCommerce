import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
  color?: string;
  width?: number;
  height?: number;
}

const StoreIcon = ({ color = "#4C6FFF", width = 18, height = 18, ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 18 18"
      {...props}
    >
      <g stroke={color} strokeWidth="1.5">
        <path
          d="M2.25 15.75h1.5m0 0h10.5m-10.5 0V6.996m12 8.754h-1.5m0 0V6.996m-10.5 0-.083-.051-.404-.27a1.5 1.5 0 0 1-.56-1.805l.67-1.677a1.5 1.5 0 0 1 1.393-.943h8.469a1.5 1.5 0 0 1 1.392.943l.67 1.677a1.5 1.5 0 0 1-.56 1.805l-.405.27-.082.051m-10.5 0a1.5 1.5 0 0 0 1.582-.051L6.75 6l1.418.945a1.5 1.5 0 0 0 1.665 0L11.25 6l1.418.945a1.5 1.5 0 0 0 1.582.051"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10.5 15.75V12a1.5 1.5 0 1 0-3 0v3.75" />
      </g>
    </svg>
  );
};

export default StoreIcon;
