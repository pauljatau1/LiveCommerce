import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const LinksIcon = ({ width = 24, height = 24, color = "#14AE5C", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className="mingcute:link-fill"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill={color}
        d="m17.303 9.523 3.182 3.182a5.498 5.498 0 0 1-3.881 9.415 5.5 5.5 0 0 1-3.897-1.637l-1.06-1.06a1.5 1.5 0 1 1 2.12-2.122l1.062 1.061a2.5 2.5 0 0 0 3.535-3.536l-3.182-3.182a2.5 2.5 0 0 0-2.681-.56 8 8 0 0 0-.454.196l-.464.217c-.62.28-1.097.4-1.704-.206-.872-.872-.646-1.677.417-2.41a5.5 5.5 0 0 1 7.007.642m-6.01-6.01 1.06 1.06a1.5 1.5 0 0 1-2.12 2.122l-1.061-1.06A2.5 2.5 0 1 0 5.636 9.17l3.182 3.182a2.5 2.5 0 0 0 2.681.56 8 8 0 0 0 .454-.196l.464-.217c.62-.28 1.098-.4 1.704.206.872.872.646 1.677-.417 2.41a5.5 5.5 0 0 1-7.007-.642L3.515 11.29a5.5 5.5 0 1 1 7.778-7.777"
      />
    </svg>
  );
};

export default LinksIcon;
