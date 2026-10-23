import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosConfig";

// Teams (departments) with their sub-roles and members. Any logged-in user can read them.
export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/v1/team");
      setTeams(res.data.teams || []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { teams, loading, reload };
};

// The current user's memberships and area access. Cached for the page load; refreshed on login.
let meCache = null;
let mePromise = null;
let meToken = null;
const loadMe = () => {
  const token = localStorage.getItem("token");
  if (meToken !== token) {
    meCache = null;
    mePromise = null;
    meToken = token;
  }
  if (!mePromise) {
    mePromise = axiosInstance
      .get("/v1/team/me")
      .then((r) => (meCache = r.data))
      .catch(() => (meCache = { teams: [], isTeamLead: false, canSales: false, canOutreach: false }));
  }
  return mePromise;
};

export const useMyTeams = () => {
  const [data, setData] = useState(meCache || { teams: [], isTeamLead: false, canSales: false, canOutreach: false, loading: true });
  useEffect(() => {
    let alive = true;
    loadMe().then((d) => alive && setData({ ...d, loading: false }));
    return () => {
      alive = false;
    };
  }, []);
  return meCache ? { ...meCache, loading: false } : data;
};
