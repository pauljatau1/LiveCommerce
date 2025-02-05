import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { Linking } from "react-native";
import { twMerge } from "tailwind-merge";
import type { StoreApi, UseBoundStore } from "zustand";

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function numberWithCommas(x: string | number) {
  return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const currencySymbolMap = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export type currencySymbol = keyof typeof currencySymbolMap;

// eslint-disable-next-line max-params
export function formatAmount(
  amount: number,
  currency?: currencySymbol,
  isSubunit: boolean = false,
  subUnitValue: number = 100,
): string {
  const amountInSubunit = isSubunit ? amount / subUnitValue : amount;
  if (currency) {
    const currencySymbol = currencySymbolMap[currency];
    return `${currencySymbol}${numberWithCommas(
      Number(amountInSubunit).toFixed(2),
    )}`;
  }
  return numberWithCommas(Number(amountInSubunit).toFixed(2));
}

export function convertAmountToSubunit(
  amount: number,
  isSubUnit = true,
): number {
  if (isSubUnit) {
    return amount * 100;
  }
  return amount;
}

export function formatCardNumber(cardNumber: string): string {
  const formattedCardNumber = cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
  return formattedCardNumber;
}

export function formatNumber(number: number): string {
  const SI_SYMBOL = ["", "k", "M", "B", "T", "P", "E"];

  const tier = Math.floor(Math.log10(number) / 3);

  if (tier === 0) {
    return number.toString();
  }

  const suffix = SI_SYMBOL[tier];
  const scale = Math.pow(10, tier * 3);

  const scaled = number / scale;

  return scaled.toFixed() + suffix;
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  let store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (let k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

export const postRequest = (url: string, details: unknown) => ({
  url,
  method: "POST",
  body: details,
  // headers:
  //   details instanceof FormData
  //     ? { "Content-Type": "multipart/form-data" }
  //     : {},
});

export const patchRequest = (url: string, details: unknown) => ({
  url,
  method: "PATCH",
  body: details,
});

export const putRequest = (url: string, details: unknown) => ({
  url,
  method: "PUT",
  body: details,
});

export const deleteRequest = (url: string, details: unknown) => ({
  url,
  method: "DELETE",
  body: details,
});

export const getRequest = <T>(url: string, params?: T) => {
  const paramsReducer = (acc: any, [key, value]: any) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  };
  const cleanedParams = Object.entries(params || {}).reduce(paramsReducer, {});

  const queryString = (_params: any) => {
    return Object.keys(_params)
      .map((key) => key + "=" + _params[key])
      .join("&");
  };

  return {
    url: !params
      ? url
      : url +
        `?${queryString({
          ...cleanedParams,
        })}`,
    method: "GET",
  };
};
