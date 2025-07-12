import * as React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";
const SvgComponent = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={110}
    height={111}
    fill="none"
    {...props}
  >
    <Circle cx={54.625} cy={59.5} r={43} fill="#fff" fillOpacity={0.1} />
    <Path
      fill="#000"
      fillOpacity={0.25}
      d="M22.266 45.632c.307-4.015.463-6.022 1.783-7.241 1.315-1.224 3.327-1.224 7.356-1.224h47.19c4.029 0 6.04 0 7.356 1.22 1.32 1.223 1.476 3.23 1.783 7.24l1.119 14.567c1.21 15.675 1.81 23.512-2.118 28.953a18.337 18.337 0 0 1-3.025 3.267C78.572 96.75 70.72 96.75 55 96.75s-23.581 0-28.705-4.335a18.503 18.503 0 0 1-3.03-3.268c-3.928-5.445-3.323-13.283-2.117-28.953l1.118-14.562Z"
    />
    <Path
      stroke="#fff"
      strokeWidth={4.583}
      d="M38.959 37.167v-6.875a16.04 16.04 0 1 1 32.083 0v6.875"
    />
    <Path
      fill="#fff"
      d="M36.666 53.208a2.292 2.292 0 1 0 4.584 0h-4.584Zm4.584 0v-6.875h-4.584v6.875h4.584Zm27.5 0a2.292 2.292 0 0 0 4.583 0H68.75Zm4.583 0v-6.875H68.75v6.875h4.583Z"
    />
  </Svg>
);

export default SvgComponent;
