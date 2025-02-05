import type { Middleware } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';

import { signOut } from './features/auth/authSlice';

export const rtkQueryErrorLogger: Middleware =
  ({ dispatch }) =>
  (next) =>
  async (action) => {
    if (isRejectedWithValue(action)) {
      if ((action.payload as { status: number })?.status === 602) {
        dispatch(signOut());
      }
    }

    return next(action);
  };
