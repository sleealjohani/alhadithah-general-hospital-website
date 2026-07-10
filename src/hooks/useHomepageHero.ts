import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

/* Reads the admin-set homepage hero image from site_settings. Empty string
   means "use the built-in default from CSS". */
export function useHomepageHero(): string {
  const [image, setImage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_hero")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const value = (data?.value ?? {}) as { image_url?: string };
        if (value.image_url) setImage(value.image_url);
      });
    return () => {
      active = false;
    };
  }, []);

  return image;
}
