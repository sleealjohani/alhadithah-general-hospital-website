import { useEffect, useState } from "react";
import { fetchHomepageSectionVisibility } from "../lib/supabase/homepageSections";

export function useHomepageSectionVisibility() {
  const [map, setMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    fetchHomepageSectionVisibility().then((result) => {
      if (active) setMap(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return (key: string) => map[key] !== false;
}
