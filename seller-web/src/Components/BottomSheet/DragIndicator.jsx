import React, { memo } from "react";
import clsx from "clsx";

const DragIndicator = ({
  className = {
    wrap: "",
    indicator: "",
  },
  style = {
    wrap: {},
    indicator: {},
  },
}) => {
  return (
    <div
      className={clsx("BottomSheet__drag-indicator-wrap", className.wrap)}
      style={style.wrap}
    >
      <div
        className={clsx("BottomSheet__drag-indicator", className.indicator)}
        style={style.indicator}
      />
    </div>
  );
};

export default memo(DragIndicator); 