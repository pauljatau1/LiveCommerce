import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';



export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}



export function numberWithCommas(x: string | number) {
    return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
