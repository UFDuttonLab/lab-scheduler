import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Whether the Skills module should be shown, and to whom.
 *
 * The module ships in PRIVATE PREVIEW. public.skill_module_settings is a single row with
 * two controls:
 *   - visible_to_all  (default false) - the release switch
 *   - allowlist_user_ids - who gets in while it is still private
 *
 * This is enforced in Postgres, not just here: public.can_see_skills_module() gates the
 * SELECT policy on every skills table, so while the module is private a non-allowlisted
 * user reads zero rows straight off the API. Hiding the nav item is the cosmetic half;
 * the RLS is the real one.
 *
 * Note the gate is deliberately NOT "pi or manager" - there is more than one PI, and
 * "hidden from everyone but me" has to mean exactly that.
 *
 * Fails CLOSED: any error, or a missing settings row, leaves the module hidden. A read
 * failure must never accidentally publish it.
 */
export const useSkillsModule = () => {
  const { user, userRole } = useAuth();
  const [visibleToAll, setVisibleToAll] = useState(false);
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlag = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("skill_module_settings")
        .select("visible_to_all, allowlist_user_ids")
        .maybeSingle();

      if (error) throw error;
      setVisibleToAll(data?.visible_to_all === true);
      setAllowlist(data?.allowlist_user_ids ?? []);
    } catch (error) {
      // Fail closed and stay quiet: this runs on every page load for every user, and a
      // toast here would be noise on an unrelated screen.
      console.error("Error fetching skills module visibility:", error);
      setVisibleToAll(false);
      setAllowlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlag();
  }, [fetchFlag]);

  const isAllowlisted = !!user && allowlist.includes(user.id);
  const isElevated = userRole === "pi" || userRole === "manager";

  return {
    /** The release switch. */
    visibleToAll,
    /** Who can see it while it is still private. */
    allowlist,
    isAllowlisted,
    /** Whether THIS user should see the module at all. */
    canSeeModule: visibleToAll || isAllowlisted,
    /**
     * Whether THIS user can release it or edit the allowlist. Mirrors the UPDATE policy on
     * skill_module_settings: an elevated role that is itself allowlisted - so the other PI
     * cannot add herself - with an escape hatch if the allowlist is ever emptied.
     */
    canAdminModule: isElevated && (isAllowlisted || allowlist.length === 0),
    /** True while the flag is still being read - render nothing rather than flashing. */
    loading,
    refresh: fetchFlag,
  };
};
