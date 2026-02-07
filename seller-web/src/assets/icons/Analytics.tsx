import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    color?: string;
    width?: number;
    height?: number;
}

const AnalyticsIcon = ({ color = "#14AE5C", width = 18, height = 18, ...props }: IProps) => {
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
      <path
        fill={color}
        d="M3.75 9a.75.75 0 0 0-.75.75v6a.75.75 0 1 0 1.5 0v-6A.75.75 0 0 0 3.75 9M7.5 1.5a.75.75 0 0 0-.75.75v13.5a.75.75 0 1 0 1.5 0V2.25a.75.75 0 0 0-.75-.75M15 12a.75.75 0 0 0-.75.75v3a.75.75 0 1 0 1.5 0v-3A.75.75 0 0 0 15 12m-3.75-6a.75.75 0 0 0-.75.75v9a.75.75 0 1 0 1.5 0v-9a.75.75 0 0 0-.75-.75"
      />
    </svg>
  );
};

export default AnalyticsIcon;
