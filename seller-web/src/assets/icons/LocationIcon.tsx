import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const LocationIcon = ({ width = 12, height = 12, color = "#272D30", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 12 12"
      {...props}
    >
      <path
        fill={color}
        d="M5.058 10.906c.303.25.619.478.942.701q.487-.33.942-.701.761-.625 1.427-1.35C9.391 8.439 10.5 6.819 10.5 5a4.5 4.5 0 0 0-9 0c0 1.819 1.109 3.438 2.131 4.556q.666.725 1.427 1.35M6 6.625a1.625 1.625 0 1 1 0-3.25 1.625 1.625 0 0 1 0 3.25"
      />
    </svg>
  );
};

export default LocationIcon;
