export const handleDeepLink = (url: string) => {
  const urlBreakdown = url?.startsWith("/")
    ? url?.split("/")?.slice(1)
    : url?.split("/");
  const urlPathLength = urlBreakdown.length;

  if (urlPathLength === 2 && urlBreakdown[0] === "products") {
    console.log({
      route: `/product/${urlBreakdown[1]}?itmSource=share`,
      path: url,
    });
    return `/product/${urlBreakdown[1]}?itmSource=share`;
  } else if (urlPathLength === 4 && urlBreakdown[0] === "products") {
    console.log({ route: `singleBlip/feed`, path: url });
    return `/singleBlip/feed?productId=${urlBreakdown[1]}&id=${urlBreakdown[3]}&itmSource=share`;
  } else if (urlPathLength === 2 && urlBreakdown[0] === "seller") {
    console.log({ route: `sellerProfile/index`, path: url });
    return `/sellerProfile?sellerId=${urlBreakdown[1]}&itmSource=share`;
  } else {
    console.log({ route: "", path: url });
    return null;
  }
};
