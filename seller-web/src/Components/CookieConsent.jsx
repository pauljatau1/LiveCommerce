import { useState, useEffect } from 'react';

const CookieConsent = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('analytics-consent');
    if (consent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'true');
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem('analytics-consent', 'false');
    setIsVisible(false);
    onDecline?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] text-white p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-[#05031F]">
          <p>We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience.</p>
          <p>By clicking 'Accept', you agree to this use of analytics cookies and other tracking technologies.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-[#05031F] border border-[#05031F] rounded hover:bg-[#05031F] hover:text-[#FFFFFF] transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-[#0BB248] border border-[#0BB248] rounded hover:bg-[#098e39] transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
