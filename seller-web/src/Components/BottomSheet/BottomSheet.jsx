import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";
import clsx from "clsx";
import { useCallbackRef } from "use-callback-ref";

import { lockWebsiteScroll, unlockWebsiteScroll } from "./utils";
import Backdrop from "./Backdrop";
import DragIndicator from "./DragIndicator";
import useIsDesktop from "./hooks/useIsDesktop";
import PropTypes from "prop-types";

import "./styles.css";

const body = document.querySelector("body");

const UnderBody = ({ children }) => {
  return createPortal(children, body);
};

const BottomSheet = ({
  children,
  isOpen,
  close,
  onBackdropClick,
  onDrag = () => {},
  onStart = () => {},
  onMouseDown = () => {},
  modalOnDesktop = false,
  desktopBreakpoint = 1024,
  styles = {},
  disabled = false,
  scrollableElement,
  classNames = {
    bottomSheet: "",
    backdrop: "",
    draggable: "",
    window: {
      wrap: "",
      content: "",
    },
    dragIndicator: {
      wrap: "",
      indicator: "",
    },
  },
}) => {
  const isDesktop = useIsDesktop(desktopBreakpoint);
  const [rect, setRect] = useState();
  const ref = useCallbackRef(null, (ref) => {
    setRect(ref?.getBoundingClientRect());
  });

  useEffect(() => {
    if (isOpen) lockWebsiteScroll(scrollableElement);
    else {
      const isAnyOtherBottomSheetOpen =
        document.querySelectorAll(".BottomSheet--open")?.length;
      if (!isAnyOtherBottomSheetOpen) unlockWebsiteScroll(scrollableElement);
    }
  }, [isOpen]);

  const onDragging = useCallback(
    (event, data) => {
      onDrag(event, data);
      if (ref?.current) {
        ref.current.style.transition = "none";
      }
    },
    [ref]
  );

  const handleStopDragging = useCallback(
    (_, { y }) => {
      if (ref.current) {
        ref.current.style.transition = "transform 0.3s ease-in-out";
        const elementHeight = ref.current?.offsetHeight | 0;
        const elementHeightHalf = elementHeight / 2;
        const shouldClose = y > elementHeightHalf;

        if (shouldClose) close();
      }
    },
    [ref]
  );

  const position = useMemo(() => {
    return {
      x: 0,
      y: isOpen ? 0 : rect?.height || 10000,
    };
  }, [isOpen, rect]);

  return (
    <UnderBody>
      <div
        className={clsx(
          "BottomSheet",
          isOpen ? "BottomSheet--open" : "BottomSheet--closed",
          modalOnDesktop && isDesktop && "BottomSheet--modalOnDesktop",
          classNames.bottomSheet
        )}
        style={styles.bottomSheet}
      >
        <Backdrop
          onClick={(event) => {
            if (onBackdropClick) onBackdropClick(event);
            close();
          }}
          className={classNames.backdrop}
          style={styles.backdrop}
          isActive={isOpen}
        />
        <Draggable
          axis="y"
          bounds={{
            top: 0,
            ...(isDesktop && modalOnDesktop && { bottom: 0 }),
          }}
          position={position}
          defaultClassName={clsx(
            "BottomSheet__draggable",
            classNames.draggable
          )}
          onStop={handleStopDragging}
          onDrag={onDragging}
          onMouseDown={onMouseDown}
          onStart={onStart}
          disabled={disabled}
          nodeRef={ref}
          cancel="[data-no-drag]"
        >
          <div
            ref={ref}
            className={clsx(
              "BottomSheet__window-wrap",
              classNames.window?.wrap
            )}
            style={styles.window?.wrap}
          >
            {!modalOnDesktop && !isDesktop && (
              <DragIndicator
                className={classNames?.dragIndicator}
                style={styles.dragIndicator}
              />
            )}
            <div
              className={clsx(
                "BottomSheet__window",
                classNames.window?.content
              )}
              style={styles.window?.content}
            >
              {children}
            </div>
          </div>
        </Draggable>
      </div>
    </UnderBody>
  );
};

export default memo(BottomSheet);

BottomSheet.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onBackdropClick: PropTypes.func,
  onDrag: PropTypes.func,
  onStart: PropTypes.func,
  onMouseDown: PropTypes.func,
  modalOnDesktop: PropTypes.bool,
  desktopBreakpoint: PropTypes.number,
  styles: PropTypes.object,
  disabled: PropTypes.bool,
  scrollableElement: PropTypes.object,
  classNames: PropTypes.object,
};

