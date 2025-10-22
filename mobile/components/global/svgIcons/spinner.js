import Svg, { Path } from "react-native-svg";

const Spinner = (props) => (
  <Svg width={52} height={51} fill="none" {...props}>
    <Path
      stroke="#DCEBE1"
      strokeWidth={8}
      d="M32.64 3.732A24 24 0 0 1 47.965 27.42"
    />
    <Path
      stroke="#16783A"
      strokeWidth={8}
      d="M32.64 3.732a24 24 0 0 1 11.511 9.354"
    />
  </Svg>
);
export default Spinner;
