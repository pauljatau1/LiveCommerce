import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {}

export default function GoogleIcon (props: IProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="20"
      fill="none"
      className={props.className}
      viewBox="0 0 21 20"
      {...props}
    >
      <path
        fill="#FFC107"
        d="M18.671 8.368h-.67v-.035h-7.5v3.334h4.709A4.998 4.998 0 0 1 5.5 10a5 5 0 0 1 5-5 4.97 4.97 0 0 1 3.317 1.266l2.357-2.357A8.3 8.3 0 0 0 10.5 1.667a8.334 8.334 0 1 0 8.171 6.7"
      />
      <path
        fill="#FF3D00"
        d="M3.127 6.121 5.865 8.13A5 5 0 0 1 10.5 5c1.274 0 2.434.48 3.317 1.266l2.357-2.357A8.3 8.3 0 0 0 10.5 1.667 8.33 8.33 0 0 0 3.127 6.12"
      />
      <path
        fill="#4CAF50"
        d="M10.5 18.333a8.3 8.3 0 0 0 5.587-2.163l-2.579-2.183A4.96 4.96 0 0 1 10.5 15a5 5 0 0 1-4.701-3.31L3.08 13.782a8.33 8.33 0 0 0 7.419 4.55"
      />
      <path
        fill="#1976D2"
        d="M18.671 8.368H18v-.035h-7.5v3.334h4.71a5 5 0 0 1-1.703 2.321l2.58 2.182c-.182.165 2.746-2.003 2.746-6.17 0-.559-.057-1.104-.162-1.632"
      />
    </svg>
  );
};
