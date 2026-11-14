// Only an explicit opt-in restores the retained colour feature.
export const coloursEnabled = (env = import.meta.env || {}) => env.VITE_COLOURS === 'true';
export const COLOURS = coloursEnabled();
