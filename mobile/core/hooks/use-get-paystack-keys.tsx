import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { useEffect, useState } from "react";

const useGetPaystackKeys = () => {
  const [paystackPublicKey, setPublicKey] = useState();

  const getPaystackKey = async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/public/paystack-keys/${process.env.EXPO_PUBLIC_PAYSTACK_CODE || 1122}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setPublicKey(response.data?.data?.publicKey);
    } catch (e) {
      console.log("error getting keys");
      return "";
    }
  };

  useEffect(() => {
    getPaystackKey();
  }, []);

  return { paystackPublicKey };
};

export default useGetPaystackKeys;
