import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const GoLiveIcon = ({ width = 12, height = 12, color = "#FFFFFF", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 32 32"
      {...props}
    >
      <g fill={color}>
        <path d="M9.057 8.53a1.091 1.091 0 1 0-1.543-1.544 12 12 0 0 0 0 16.972 1.091 1.091 0 1 0 1.543-1.543 9.82 9.82 0 0 1 0-13.886m15.429-1.543a1.091 1.091 0 0 0-1.543 1.543 9.82 9.82 0 0 1 0 13.886 1.091 1.091 0 1 0 1.543 1.543 12 12 0 0 0 0-16.972" />
        <path d="M12.145 11.607a1.091 1.091 0 0 0-1.543-1.544 7.64 7.64 0 0 0 0 10.807 1.091 1.091 0 0 0 1.543-1.544 5.454 5.454 0 0 1 0-7.72m9.253-1.532a1.091 1.091 0 0 0-1.543 1.544 5.454 5.454 0 0 1 0 7.72 1.091 1.091 0 0 0 1.543 1.543 7.637 7.637 0 0 0 0-10.807" />
        <path
          d="M16 12.199a3.273 3.273 0 1 0 0 6.546 3.273 3.273 0 0 0 0-6.546m-1.091 3.273a1.091 1.091 0 1 1 2.182 0 1.091 1.091 0 0 1-2.182 0"
          clipRule="evenodd"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
};

export default GoLiveIcon;
