import moment from "moment";
export function validatePhoneNumber(phoneNumber) {
  const phonePattern = /^\d{11}$/;
  return phonePattern.test(phoneNumber);
}

export function validateZipCode(zipCode) {
  const zipCodePattern = /^\d{6}$/;
  return zipCodePattern.test(zipCode);
}

export function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export function formatDate(date, format) {
  let rawDate = moment(date);
  const formattedDate = rawDate.format(format);
  return formattedDate;
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

export function catalogSort(items, criteria) {
  return [...items].sort((a, b) => {
    switch (criteria) {
      case "Price: High to Low":
        return b.price - a.price;
      case "Price: Low to High":
        return a.price - b.price;
      case "Newest to Oldest":
        return moment(b.updatedAt) - moment(a.updatedAt);
      case "Oldest to Newest":
        return moment(a.updatedAt) - moment(b.updatedAt);
      default:
        return 0;
    }
  });
}
