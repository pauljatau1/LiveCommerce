import React, { memo } from "react";
import clsx from "clsx";

const Backdrop = ({
  onClick,
  style = {},
  className = "",
  isActive = false,
}) => (
  <div
    onClick={onClick}
    data-testid="backdrop"
    className={clsx(
      "BottomSheet__backdrop",
      {
        "BottomSheet__backdrop--active": isActive,
      },
      className
    )}
    style={style}
  />
);

export default memo(Backdrop);
