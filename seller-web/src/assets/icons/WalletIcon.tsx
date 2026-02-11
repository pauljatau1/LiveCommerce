import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    color?: string;
    width?: number;
    height?: number;
}

const WalletIcon = ({ color = "#14AE5C", width = 18, height = 18, ...props }: IProps) => {
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
      <g stroke={color}>
        <path
          d="M4.5 6h3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.125"
        />
        <path
          d="M15.625 6.75h-1.952c-1.338 0-2.423 1.007-2.423 2.25s1.085 2.25 2.422 2.25h1.953c.063 0 .094 0 .12-.002.405-.024.727-.323.754-.7l.001-.11V7.562c0-.058 0-.087-.002-.11-.027-.377-.348-.676-.753-.7-.026-.002-.057-.002-.12-.002Z"
          strokeWidth="1.125"
        />
        <path
          d="M15.724 6.75c-.059-1.404-.246-2.265-.853-2.871C13.993 3 12.578 3 9.75 3H7.5c-2.828 0-4.243 0-5.121.879S1.5 6.172 1.5 9s0 4.243.879 5.121S4.672 15 7.5 15h2.25c2.828 0 4.243 0 5.121-.879.607-.606.795-1.467.853-2.871"
          strokeWidth="1.125"
        />
        <path
          d="M13.493 9h.008"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
};

export default WalletIcon;
