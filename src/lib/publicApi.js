import axios from "axios";
import { backend_url } from "@/constants";

// For pages clients open without a CRM login (forms, proposal, invoice, portal). Never sends the staff token.
export const publicApi = axios.create({ baseURL: `${backend_url}/v1/public` });
export const portalApi = (token) => axios.create({ baseURL: `${backend_url}/v1/portal`, headers: { "X-Portal-Token": token } });

export const money = (n, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 2 }).format(Number(n) || 0);
export const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const errMsg = (err, fallback = "Something went wrong") => err?.response?.data?.message || fallback;
