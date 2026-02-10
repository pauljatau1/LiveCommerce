import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const ShieldIcon = ({ width = 11, height = 12, color = "#14AE5C", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 11 12"
      {...props}
    >
      <path
        fill={color}
        d="M4.85.062c.26-.083.54-.083.8 0l3.937 1.26a1.31 1.31 0 0 1 .913 1.25v2.64c0 1.175-.24 2.387-.977 3.512s-1.939 2.11-3.774 2.891a1.28 1.28 0 0 1-.998 0c-1.835-.781-3.036-1.767-3.774-2.89C.24 7.598 0 6.386 0 5.212v-2.64a1.31 1.31 0 0 1 .913-1.25zm.458 1.072a.2.2 0 0 0-.115 0l-3.937 1.26a.19.19 0 0 0-.131.179v2.64c0 1.018.206 2 .793 2.895s1.59 1.755 3.274 2.472a.15.15 0 0 0 .116 0c1.684-.717 2.686-1.578 3.274-2.473.587-.895.793-1.874.793-2.894v-2.64a.19.19 0 0 0-.13-.178zm.505 2.391v2.25a.563.563 0 1 1-1.125 0v-2.25a.562.562 0 1 1 1.125 0M6 7.838a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0"
      />
    </svg>
  );
};

export default ShieldIcon;
