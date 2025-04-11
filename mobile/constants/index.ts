import arrowDown from "@/assets/icons/arrow-down.png";
import arrowUp from "@/assets/icons/arrow-up.png";
import backArrow from "@/assets/icons/back-arrow.png";
import arrowRight from "@/assets/icons/arrow-right.png";
import chat from "@/assets/icons/chat.png";
import checkmark from "@/assets/icons/check.png";
import close from "@/assets/icons/close.png";
import dollar from "@/assets/icons/dollar.png";
import email from "@/assets/icons/email.png";
import eyecross from "@/assets/icons/eyecross.png";
import google from "@/assets/icons/google.png";
import home from "@/assets/icons/home.png";
import list from "@/assets/icons/list.png";
import lock from "@/assets/icons/lock.png";
import map from "@/assets/icons/map.png";
import marker from "@/assets/icons/marker.png";
import out from "@/assets/icons/out.png";
import person from "@/assets/icons/person.png";
import pin from "@/assets/icons/pin.png";
import point from "@/assets/icons/point.png";
import profile from "@/assets/icons/profile_icon2.png";
import search from "@/assets/icons/search.png";
import selectedMarker from "@/assets/icons/selected-marker.png";
import star from "@/assets/icons/star.png";
import target from "@/assets/icons/target.png";
import to from "@/assets/icons/to.png";
import check from "@/assets/images/check.png";
import getStarted from "@/assets/images/get-started.png";
import message from "@/assets/images/message.png";
import noResult from "@/assets/images/no-result.png";
import onboarding1 from "@/assets/images/onboarding1.png";
import onboarding2 from "@/assets/images/onboarding2.png";
import onboarding3 from "@/assets/images/onboarding3.jpg";
import signUpCar from "@/assets/images/signup-car.png";
import waving from "@/assets/icons/waving.png";
import sadEmoji from "@/assets/icons/emoji-sad.png";
import auqliLogo from "@/assets/icons/auqli-logo.png";
import circleBackArrow from "@/assets/icons/circle-back-arrow.png";
import sneaker from "@/assets/images/sneaker.png";
import pant from "@/assets/images/pant.png";
import suit from "@/assets/images/suit.png";
import jacket from "@/assets/images/jacket.png";
import checkmarkIcon from "@/assets/images/checkmark.png";
import checkmarkCircleIcon from "@/assets/icons/checkmark-circle.png";
import checkmarkCircleSelectIcon from "@/assets/icons/checkmark-selected.png";
import closeIcon from "@/assets/images/closeIcon.png";
import addCircle from "@/assets/icons/add-circle.png";
import internetIcon from "@/assets/icons/internet.png";
import mailOpenIcon from "@/assets/icons/mail-open.png";
import blipIcon from "@/assets/icons/blip.png";
import connectIcon from "@/assets/icons/connect.png";
import notifyIcon from "@/assets/icons/notification.png";
import cartIcon from "@/assets/icons/cart.png";
import starIcon from "@/assets/icons/star.png";
import indicatorIcon from "@/assets/icons/Indicator.png";
import radio_buttonIcon from "@/assets/icons/radio_button_checked_24px.png";
import indicatorSmallIcon from "@/assets/icons/indicatorsmall.png";
import basePlusIcon from "@/assets/icons/ic_baseline-plus.png";
import youngWomanImage from "@/assets/images/young-woman-organizing-live-shop 1.png";
import manImage from "@/assets/images/image.png";
import avatarImage from "@/assets/images/avatar.png";
import shoeImage from "@/assets/images/shoe.png";
import youngImage from "@/assets/images/young.png";
import smiley_womanImage from "@/assets/images/smiley-woman-selling-clothes-front-view 2.png";
import verifyBadge from "@/assets/icons/elements.png";
import diamondsImage from "@/assets/images/luxury-shine-diamonds-digital-art 1.png";
import homeNike from "@/assets/images/Undefeated-Nike-Air-Force-1-Low-Patent-DV5255-400-Release-Date-4-1068x762 1.png";

import { Category, SubCategory } from "@/types/types";

export const images = {
  manImage,
  youngWomanImage,
  pant,
  sneaker,
  onboarding1,
  onboarding2,
  onboarding3,
  getStarted,
  signUpCar,
  check,
  noResult,
  message,
  suit,
  jacket,
  checkmarkIcon,
  avatarImage,
  shoeImage,
  youngImage,
  smiley_womanImage,
  homeNike,
  diamondsImage,
};

export const icons = {
  mailOpenIcon,
  starIcon,
  indicatorSmallIcon,
  basePlusIcon,
  cartIcon,
  notifyIcon,
  blipIcon,
  circleBackArrow,
  internetIcon,
  waving,
  arrowRight,
  arrowDown,
  connectIcon,
  arrowUp,
  backArrow,
  chat,
  checkmark,
  close,
  dollar,
  email,
  eyecross,
  google,
  home,
  list,
  lock,
  map,
  marker,
  out,
  person,
  pin,
  point,
  profile,
  search,
  selectedMarker,
  star,
  target,
  to,
  closeIcon,
  addCircle,
  checkmarkCircleIcon,
  checkmarkCircleSelectIcon,
  indicatorIcon,
  radio_buttonIcon,
  verifyBadge,
  sadEmoji,
  auqliLogo,
};

export const productsData = [
  {
    id: "1",
    title: "Lorem ipsum dolor sit amet",
    price: "45.0",
    image: images.homeNike,
    profileImg: icons.profile,
    isVerified: true,
    rating: 4.6,
    location: "Lagos Nigeria",
    sellerName: "Albert King",
    isLive: true,
    isOnline: true,
    isTopseller: true,
    category: "Sneakers and Shirt",
  },
  {
    id: "2",
    title: "Lorem ipsum dolor sit amet",
    price: "45.0",
    image: images.homeNike,
    profileImg: icons.profile,
    isVerified: true,
    sellerName: "Albert King",
    rating: 4.6,
    location: "Lagos Nigeria",
    isLive: false,
    isOnline: false,
    isTopseller: true,
    category: "Sneakers and Shirt",
  },
  {
    id: "3",
    title: "Lorem ipsum dolor sit amet",
    price: "45.0",
    image: images.homeNike,
    profileImg: icons.profile,
    isVerified: false,
    rating: 4.6,
    sellerName: "Albert King",
    location: "Lagos Nigeria",
    isLive: false,
    isOnline: true,
    isTopseller: true,
    category: "Sneakers and Shirt",
  },
  {
    id: "4",
    title: "Lorem ipsum dolor sit amet",
    price: "45.0",
    image: images.homeNike,
    profileImg: icons.profile,
    isVerified: true,
    rating: 4.6,
    sellerName: "Albert King",
    location: "Lagos Nigeria",
    isLive: true,
    isOnline: true,
    isTopseller: true,
    category: "Sneakers",
  },
  {
    id: "5",
    title: "Lorem ipsum dolor sit amet",
    price: "45.0",
    image: images.homeNike,
    profileImg: icons.profile,
    isVerified: true,
    rating: 4.6,
    sellerName: "Albert King",
    location: "Lagos Nigeria",
    isLive: true,
    isOnline: true,
    isTopseller: true,
    category: "Sneakers",
  },
  {
    id: "6",
    title: "Lorem ipsum dolor sit amet",
    price: "45.0",
    image: images.homeNike,
    profileImg: icons.profile,
    isVerified: true,
    rating: 4.6,
    sellerName: "Albert King",
    location: "Lagos Nigeria",
    isLive: true,
    isOnline: true,
    isTopseller: true,
    category: "Sneakers",
  },
];

export const onboarding = [
  {
    id: 1,
    title: "Cash on Delivery or E-payment",
    description: "Fastest Delivery you can count onanytime, anyday.",
    image: images.onboarding1,
  },
  {
    id: 2,
    title: "Delivery Right to Your Door Step",
    description:
      "Our delivery will ensure your items are delivered right to the door steps",
    image: images.onboarding2,
  },
  {
    id: 3,
    title: "Welcome to AUQLI",
    description:
      "Auqli is the best solution to shop live and track your  goods from local and world shipping.",
    image: images.onboarding3,
  },
];

const categories: Category[] = [
  { id: "1", title: "Suits", image: require("@/assets/images/suit.png") },
  { id: "2", title: "Jackets", image: require("@/assets/images/jacket.png") },
  { id: "3", title: "Pants", image: require("@/assets/images/pant.png") },
  { id: "4", title: "Shoes", image: require("@/assets/images/sneaker.png") },
  { id: "5", title: "Jewelry", image: require("@/assets/images/jacket.png") },
  { id: "6", title: "Shirts", image: require("@/assets/images/suit.png") },
];
const watchCategories: Category[] = [
  { id: "1", title: "Sneaakers", image: shoeImage },
  { id: "2", title: "Formal Suit", image: youngImage },
  { id: "3", title: "Pants", image: require("@/assets/images/pant.png") },
];

const subCategories: SubCategory[] = [
  { id: "1", title: "Jewelry" },
  { id: "2", title: "Jerseys" },
  { id: "3", title: "Men's Fashion" },
  { id: "4", title: "Bags" },
  { id: "5", title: "Vintage" },
  { id: "6", title: "Men's Jewelry" },
];

const carouselData = [
  {
    id: "01",
    image: require("@/assets/images/smiley-woman-selling-clothes-front-view 1.png"),
    title: "Get your special Sale",
    description: "up to 50% off",
  },
  {
    id: "02",
    image: require("@/assets/images/fashionable-men-jacket-hanging-clothing-store-generated-by-ai 1.png"),
    title: "Get your special Sale",
    description: "up to 50% off",
  },
  {
    id: "03",
    image: require("@/assets/images/smiley-woman-selling-clothes-front-view 1.png"),
    title: "Get your special Sale",
    description: "up to 50% off",
  },
];
export const data = {
  onboarding,
  categories,
  subCategories,
  watchCategories,
  carouselData,
  productsData,
};

// API URL
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.yourdomain.com";

// Socket Events
export const SOCKET_EVENTS = {
  VIEWER_JOINED: "viewer_joined_stream",
  VIEWER_LEFT: "viewer_left_stream",
  NEW_COMMENT: "new_comment",
  NEW_PURCHASE: "new_purchase",
};
