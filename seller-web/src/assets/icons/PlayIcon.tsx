import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const PlayIcon = ({ width = 10, height = 10, color = "#14AE5C", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 10 10"
      {...props}
    >
      <g mask="url(#a)">
        <path fill={color} d="M0 0h10v10H0z" />
      </g>
    </svg>
  );
};

export default PlayIcon;
