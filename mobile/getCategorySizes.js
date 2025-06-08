const axios = require("axios");

async function getRemoteFileSize() {
  try {
    const categoriesRes = await axios.get(
      "https://api.auqli.live/api/public/categories",
    );
    const categories = categoriesRes?.data?.map((ct) => ({
      name: ct.name,
      image: ct.image?.url,
    }));

    // Use Promise.all to wait for all HEAD requests
    const imageSizes = await Promise.all(
      categories.map(async (ct) => {
        try {
          const response = await axios.head(ct.image);
          const contentLength = response.headers["content-length"];
          if (!contentLength) {
            console.warn(`No Content-Length for ${ct.name}`);
            return { name: ct.name, size: "N/A" };
          }

          const roundVal =
            Math.round((parseInt(contentLength) / (1024 * 1024)) * 100) / 100;

          return {
            name: ct.name,
            size: roundVal,
          };
        } catch (error) {
          console.error(`Failed to fetch size for ${ct.name}:`, error.message);
          return { name: ct.name, size: "Error" };
        }
      }),
    );

    return imageSizes
      .sort((a, b) => a.size - b.size)
      ?.filter((im) => im.size >= 1)
      ?.map((im, index) => ({
        index: index + 1,
        name: im.name,
        size: `${im.size} MB`,
      }));
  } catch (error) {
    console.error("Error in getRemoteFileSize:", error);
    return null;
  }
}

// Usage
getRemoteFileSize().then((res) => {
  console.log(res); // Now logs the populated array
});
