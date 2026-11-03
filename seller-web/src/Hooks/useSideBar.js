import { useOutletContext } from 'react-router-dom';

export function useSidebar() {
  return useOutletContext();
}
