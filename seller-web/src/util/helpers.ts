// helper function to get a users ip address

export const getClientIP = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.ip || "unknown";
  } catch (error) {
    console.error("IP fetch error:", error);
    return "unknown";
  }
};

// helper function to get a users device type

export const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
  return "Desktop";
};
