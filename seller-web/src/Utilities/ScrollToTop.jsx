import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Handle hash links first
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    // Handle regular scroll-to-top
    window.scrollTo(0, 0);
    
    // Handle scroll containers within layouts
    const scrollContainers = document.querySelectorAll('.scroll-container');
    scrollContainers.forEach(container => {
      container.scrollTo(0, 0);
    });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop






