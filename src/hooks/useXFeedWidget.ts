import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

/* Reads the admin-set X-feed widget embed (from a paid service like Elfsight
   or Taggbox) out of site_settings. Empty string means no widget configured —
   the card then shows the clean "follow on X" fallback. */
export function useXFeedWidget(): string {
  const [embed, setEmbed] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "x_feed_widget")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const value = (data?.value ?? {}) as { embed?: string };
        if (value.embed) setEmbed(value.embed);
      });
    return () => {
      active = false;
    };
  }, []);

  return embed;
}
