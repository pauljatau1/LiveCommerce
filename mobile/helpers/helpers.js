import moment from "moment";
export function validatePhoneNumber(phoneNumber) {
  const phonePattern = /^\d{11}$/;
  return phonePattern.test(phoneNumber);
}

export function normalizeNGNNumber(phoneNumber) {
  if (!phoneNumber) return "";
  return `0${phoneNumber?.replaceAll("-", "")?.slice(-10)}`;
}

export function validateZipCode(zipCode) {
  const zipCodePattern = /^\d{6}$/;
  return zipCodePattern.test(zipCode);
}

export function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export function formatNumber(num = 0) {
  if (num >= 1000000000) {
    const formatted = (num / 1000000000).toFixed(1);
    return formatted.endsWith(".0")
      ? formatted.slice(0, -2) + "B"
      : formatted + "B"; // Billions
  } else if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return formatted.endsWith(".0")
      ? formatted.slice(0, -2) + "M"
      : formatted + "M"; // Millions
  } else if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith(".0")
      ? formatted.slice(0, -2) + "K"
      : formatted + "K"; // Thousands
  } else {
    return num.toString(); // Small numbers
  }
}

export function formatDate(date, format) {
  let rawDate = moment(date);
  const formattedDate = rawDate.format(format);
  return formattedDate;
}

export function formatTimeFromNow(dateString) {
  // Parse the input date string
  const futureDate = moment(dateString);

  // Get the current date and time
  const now = moment();

  // Calculate the difference between the future date and now
  const duration = moment.duration(futureDate.diff(now));

  // Extract days, hours, minutes, and seconds from the duration
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  // Build the formatted string conditionally
  let formattedTime = "";

  if (days > 0) {
    formattedTime += `${days}d:`;
  }
  if (hours > 0 || formattedTime !== "") {
    formattedTime += `${hours}h:`;
  }
  if (minutes > 0 || formattedTime !== "") {
    formattedTime += `${minutes}m:`;
  }
  if (seconds > 0 || formattedTime !== "") {
    formattedTime += `${seconds}s`;
  }

  // Remove trailing colon if present
  if (formattedTime.endsWith(":")) {
    formattedTime = formattedTime.slice(0, -1);
  }

  return formattedTime || "0s"; // Return '0s' if no time is remaining
}

export function formatTimeFromNowLive(dateString) {
  // Parse the input date string
  const futureDate = moment(dateString);

  // Get the current date and time
  const now = moment();

  // Calculate the difference between the future date and now
  const duration = moment.duration(futureDate.diff(now));

  // Extract days, hours, minutes, and seconds from the duration
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  // Build the formatted string conditionally
  let formattedTime = "";

  if (days > 0) {
    formattedTime += `${days} DAYS:`;
  }
  if (hours > 0 || formattedTime !== "") {
    formattedTime += `${hours} HOURS:`;
  }
  if (minutes > 0 || formattedTime !== "") {
    formattedTime += `${minutes} MINUTES:`;
  }
  if (seconds > 0 || formattedTime !== "") {
    formattedTime += `${seconds} SECONDS`;
  }

  // Remove trailing colon if present
  if (formattedTime.endsWith(":")) {
    formattedTime = formattedTime.slice(0, -1);
  }

  return formattedTime || "0s"; // Return '0s' if no time is remaining
}

export function timeFromNow(timestamp) {
  const now = moment();
  const givenTime = moment(timestamp);
  const diffSeconds = now.diff(givenTime, "seconds");

  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}m`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}h`;
  } else if (diffSeconds < 604800) {
    return `${Math.floor(diffSeconds / 86400)}d`;
  } else if (diffSeconds < 2629746) {
    // Approx. 1 month
    return `${Math.floor(diffSeconds / 604800)}w`;
  } else if (diffSeconds < 31556952) {
    // Approx. 1 year
    return `${Math.floor(diffSeconds / 2629746)}mo`;
  } else {
    return `${Math.floor(diffSeconds / 31556952)}y`;
  }
}

export function formatMessageDate(date) {
  const now = moment();
  const messageDate = moment(date);

  if (messageDate.isSame(now, "day")) {
    return messageDate.format("H:mm"); // Example: "2:30 PM"
  } else if (messageDate.isSame(now.clone().subtract(1, "day"), "day")) {
    return "Yesterday";
  } else if (messageDate.isAfter(now.clone().startOf("week"))) {
    return messageDate.format("dddd"); // Example: "Monday"
  } else {
    return messageDate.format("DD/MM/YYYY"); // Example: "24/01/2025"
  }
}
export function formatMessageRoomDate(date) {
  const now = moment();
  const messageDate = moment(date);

  if (messageDate.isSame(now, "day")) {
    return "Today";
  } else if (messageDate.isSame(now.clone().subtract(1, "day"), "day")) {
    return "Yesterday";
  } else if (messageDate.isAfter(now.clone().startOf("week"))) {
    return messageDate.format("dddd"); // Example: "Monday"
  } else {
    return messageDate.format("DD/MM/YYYY"); // Example: "24/01/2025"
  }
}

export function catalogSort(items, criteria) {
  if (items?.length < 1) return [];
  return [...items].sort((a, b) => {
    switch (criteria) {
      case "Price: High to Low":
        return getPrice(b) - getPrice(a);
      case "Price: Low to High":
        return getPrice(a) - getPrice(b);
      case "Newest to Oldest":
        return moment(b.updatedAt) - moment(a.updatedAt);
      case "Oldest to Newest":
        return moment(a.updatedAt) - moment(b.updatedAt);
      default:
        return 0;
    }
  });
}

export function catalogFilterPrice(items, criteria) {
  if (items?.length < 1) return [];
  return items?.filter(
    (item) =>
      getPrice(item) >= (criteria.min || 0) &&
      getPrice(item) <= (criteria.max || 999999999),
  );
}

function getPrice(item) {
  return item.discount?.isActive ? item.discount?.discountedPrice : item.price;
}

export const getProductSpecifications = (obj, prefix) => {
  return Object.entries(obj)
    .filter(([key]) => key.startsWith(prefix + "_"))
    .reduce(
      (acc, [key, value]) => ({ ...acc, [key.split("_")[1]]: value }),
      {},
    );
};

export const findVariantType = (obj) => {
  if (!obj) return null;
  let selectedType = "";
  for (let [key, value] of Object.entries(obj)) {
    if (value) {
      return (selectedType = key);
    }
  }
  return selectedType;
};

export const getSellerLocation = (seller) => {};

export const processDates = (msgs) => {
  if (!msgs.length) return [];

  const result = [];
  let currentDate = null;

  msgs.forEach((msg) => {
    const messageDate = moment(msg.createdAt).startOf("day");

    // If date changes, add a date header
    if (!currentDate || !messageDate.isSame(currentDate, "day")) {
      currentDate = messageDate;

      // Create date header based on relative time
      let dateHeader;
      if (messageDate.isSame(moment(), "day")) {
        dateHeader = "Today";
      } else if (messageDate.isSame(moment().subtract(1, "days"), "day")) {
        dateHeader = "Yesterday";
      } else if (messageDate.isAfter(moment().subtract(7, "days"))) {
        dateHeader = messageDate.format("dddd"); // Day name
      } else {
        dateHeader = messageDate.format("MMMM D, YYYY"); // Full date
      }

      result.push({
        _id: `date-${messageDate.format("YYYY-MM-DD")}`,
        messageType: "date",
        content: dateHeader,
      });
    }
    // else {
    //   result.push({
    //     _id: msg?.createdAt,
    //     messageType: "filler",
    //     content: "",
    //   });
    // }

    // Add the message
    result.push({
      ...msg,
    });
  });

  return result;
};

export const getResizedImage = (image, size) => {
  if (image?.resizedImages?.length > 0) {
    const resizedImg = image.resizedImages.find((img) => img.width === size);
    if (resizedImg) {
      return resizedImg.url;
    }
    return image?.url || image?.data;
  }
  return image?.url || image?.data;
};
