import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Footer = () => {
  const [version, setVersion] = useState<string>("1.1.0");

  useEffect(() => {
    const fetchVersion = async () => {
      const { data } = await supabase
        .from('app_versions')
        .select('version')
        .order('released_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setVersion(data.version);
      }
    };

    fetchVersion();
  }, []);

  return (
    <footer className="border-t border-border bg-card mt-8 sm:mt-12 mb-16 sm:mb-0">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-0">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Developed by{" "}
            <a
              href="https://ufduttonlab.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Dutton Lab at UF
            </a>
          </p>
          <p className="text-xs text-muted-foreground">v{version}</p>
        </div>
      </div>
    </footer>
  );
};
