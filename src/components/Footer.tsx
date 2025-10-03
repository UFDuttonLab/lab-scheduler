import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Footer = () => {
  const [version, setVersion] = useState<string>("1.1.0");
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();

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

  const handleVersionClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      sessionStorage.setItem('microbeBlasterUnlocked', 'true');
      toast.success("🦠 Secret game unlocked! Redirecting...");
      setTimeout(() => {
        navigate("/microbe-blaster");
        setClickCount(0);
      }, 500);
    } else if (newCount >= 2) {
      toast.info(`${3 - newCount} more click...`);
    }
  };

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
          <p 
            className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors select-none"
            onClick={handleVersionClick}
          >
            v{version}
          </p>
        </div>
      </div>
    </footer>
  );
};
