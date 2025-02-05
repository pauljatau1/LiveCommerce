import { getItem, removeItem, setItem } from '@/core/storage';
import type { User } from '@/types/services/auth';

const TOKEN = 'token';

export type TokenType = {
  access: string;
  refresh: string;
};

export const getToken = () => getItem(TOKEN);
export const removeToken = () => removeItem(TOKEN);
export const setToken = (value: string) => setItem<string>(TOKEN, value);
export const setUserEmail = (value: string) =>
  setItem<string>('userEmail', value);
export const getUserEmail = () => getItem<string>('userEmail');
export const setUser = (value: User) => setItem<User>('user', value);
export const getUser = () => getItem<User>('user');
export const removeUser = () => removeItem('user');
export const enableBiometrics = () => setItem<boolean>('biometrics', true);
export const disableBiometrics = () => removeItem('biometrics');
export const isBiometricsEnabled = () => getItem<boolean>('biometrics');
export const setBiometricUserID = (value: string) =>
  setItem<string>('biometricUserID', value);
export const getBiometricUserID = () => getItem<string>('biometricUserID');
export const removeBiometricUserID = () => removeItem('biometricUserID');
export const setPassword = (value: string) =>
  setItem<string>('password', value);
export const getPassword = () => getItem<string>('password');
export const removePassword = () => removeItem('password');
export const setPIN = (value: string) => setItem<string>('pin', value);
export const getPIN = () => getItem<string>('pin');
export const removePIN = () => removeItem('pin');
export const setShowAmount = (value: boolean) =>
  setItem<boolean>('showAmount', value);
export const getShowAmount = () => getItem<boolean>('showAmount');
export const removeShowAmount = () => removeItem('showAmount');
