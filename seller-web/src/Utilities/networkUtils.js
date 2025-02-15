export const getClientIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('IP fetch error:', error);
    return 'unknown';
  }
};
