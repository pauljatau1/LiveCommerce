import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const KeyIcon = ({ width = 12, height = 12, color = "#272D30", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 32 17"
      {...props}
    >
      <path
        fill={color}
        d="M8.298 11.064q-1.14 0-1.953-.812a2.67 2.67 0 0 1-.813-1.954q-.002-1.143.813-1.953a2.68 2.68 0 0 1 1.953-.813q1.138-.002 1.954.813a2.65 2.65 0 0 1 .812 1.953 2.7 2.7 0 0 1-.812 1.954 2.63 2.63 0 0 1-1.954.812m0 5.532q-3.457 0-5.878-2.42Q0 11.756 0 8.298T2.42 2.42 8.298 0q2.317 0 4.201 1.141a8.6 8.6 0 0 1 2.99 3.008h12.17l4.15 4.149-6.224 6.223-2.766-2.074-2.766 2.074-2.939-2.074H15.49a8.6 8.6 0 0 1-2.99 3.008q-1.883 1.14-4.201 1.14m0-2.766q1.935 0 3.406-1.176a5.57 5.57 0 0 0 1.953-2.973h4.322l2.005 1.417 2.835-2.109 2.455 1.902 2.593-2.593-1.383-1.383H13.657a5.58 5.58 0 0 0-1.953-2.974q-1.468-1.175-3.406-1.175-2.282 0-3.907 1.625T2.766 8.298t1.625 3.907 3.907 1.625"
      />
    </svg>
  );
};

export default KeyIcon;
