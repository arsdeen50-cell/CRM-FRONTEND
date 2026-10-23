import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosConfig";

// Which server integrations are switched on (email sending, WhatsApp API, Razorpay). Cached per page load.
let cache = null;
export const useIntegrations = () => {
  const [data, setData] = useState(cache);
  useEffect(() => {
    if (cache) return;
    axiosInstance
      .get("/v1/messages/integrations")
      .then((res) => {
        cache = res.data.integrations;
        setData(cache);
      })
      .catch(() => setData({}));
  }, []);
  return data || {};
};
