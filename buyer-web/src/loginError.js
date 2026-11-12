import {errorMessage} from './api';
export const WRONG_LOGIN='Wrong email or password. Try again or reset it.';
export const loginError = error => /invalid credentials|email or password is wrong|incorrect.*password|wrong.*password/i.test(error?.response?.data?.message || '') || [400,401,404].includes(error?.response?.status) ? WRONG_LOGIN : errorMessage(error,WRONG_LOGIN);
