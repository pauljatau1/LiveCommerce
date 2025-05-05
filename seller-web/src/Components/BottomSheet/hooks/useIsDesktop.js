const useIsDesktop = (desktopBreakpoint) => {
  return window.innerWidth >= desktopBreakpoint;
};

export default useIsDesktop; 