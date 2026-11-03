import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToNav = (activeSideBarRef) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Find the parent nav item for the current path
    const currentPath = pathname.split('/').filter(Boolean);
    
    if (currentPath.includes('products')) {
      // Find the products nav item
      const productsNavItem = document.querySelector('[data-nav-id="products"]');
      if (productsNavItem) {
        // Open the products dropdown
        const productId = productsNavItem.getAttribute('data-item-id');
        activeSideBarRef.current = productId;
        
        // Wait for the subnav to be rendered
        setTimeout(() => {
          // Find and scroll to the active subnav item
          const activeSubNav = document.querySelector('.nav-item-active');
          if (activeSubNav) {
            activeSubNav.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [pathname, activeSideBarRef]);
};
