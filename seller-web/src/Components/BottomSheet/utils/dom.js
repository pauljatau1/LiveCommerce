export const lockWebsiteScroll = (scrollableElement) => {
  const scrollingElement =
    scrollableElement ||
    document.scrollingElement ||
    document.body;
  scrollingElement.style.overflow = "hidden";
};

export const unlockWebsiteScroll = (scrollableElement) => {
  const scrollingElement =
    scrollableElement ||
    document.scrollingElement ||
    document.body;
  scrollingElement.style.overflow = "auto";
}; 