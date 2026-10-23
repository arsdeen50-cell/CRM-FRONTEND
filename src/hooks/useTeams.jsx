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

// The current user's memberships; isTeamLead unlocks team views (leave approvals, team leads)
export const useMyTeams = () => {
  const [data, setData] = useState({ teams: [], isTeamLead: false });
  useEffect(() => {
    axiosInstance.get("/v1/team/me").then((r) => setData(r.data)).catch(() => {});
  }, []);
  return data;
};
