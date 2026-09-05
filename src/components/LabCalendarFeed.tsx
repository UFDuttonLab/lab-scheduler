import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const CAL_NAME = "Dutton Lab Equipment";

/**
 * The lab-wide calendar subscription. The feed itself is public.lab_calendar_ics() served
 * straight from PostgREST (see migration 20260905130000); this dialog just shows the URL
 * and the one-click subscribe links, and lets a PI/manager rotate the key.
 *
 * The publishable key in the URL is not a secret (it is in this bundle). The feed_key is
 * what keeps the schedule off the open internet; rotating it invalidates every existing
 * subscription, so the button confirms first.
 */
export const LabCalendarFeed = ({ variant = "outline" }: { variant?: "outline" | "ghost" | "default" }) => {
  const { permissions } = useAuth();
  const [feedKey, setFeedKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("calendar_feed_settings")
      .select("feed_key, enabled")
      .eq("id", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(`Could not load the calendar feed: ${error.message}`);
        setFeedKey(data?.feed_key ?? null);
        setEnabled(data?.enabled ?? true);
      });
  }, [open]);

  const httpsUrl = feedKey
    ? `${SUPABASE_URL}/rest/v1/rpc/lab_calendar_ics?key=${encodeURIComponent(feedKey)}&apikey=${encodeURIComponent(SUPABASE_KEY)}`
    : "";
  const webcalUrl = httpsUrl.replace(/^https:/, "webcal:");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
  const outlookUrl = `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(httpsUrl)}&name=${encodeURIComponent(CAL_NAME)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the URL and copy it by hand.");
    }
  };

  const rotate = async () => {
    setRotating(true);
    try {
      const { data, error } = await supabase.rpc("rotate_calendar_feed_key");
      if (error) throw error;
      setFeedKey(data as string);
      toast.success("New feed key issued. Everyone will need to re-subscribe with the new URL.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not rotate the key.");
    } finally {
      setRotating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <CalendarDays className="w-4 h-4 mr-2" />
          Subscribe to lab calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lab calendar subscription</DialogTitle>
          <DialogDescription>
            One calendar with every equipment booking and who has signed up to help. Add it
            once; your calendar app refreshes it on its own (Outlook every few hours, Google up
            to a day, Apple as often as you set).
          </DialogDescription>
        </DialogHeader>

        {!enabled && (
          <p className="text-sm text-destructive">The feed is currently disabled by the PI.</p>
        )}

        {feedKey && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-between">
                  Google Calendar <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
              <a href={outlookUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-between">
                  Outlook (UF Office 365) <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
              <a href={webcalUrl}>
                <Button variant="outline" className="w-full justify-between">
                  Apple Calendar or other app (webcal) <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                If a button does not work, paste this URL into your calendar app under
                "Add calendar from URL" (Google) or "Subscribe from web" (Outlook).
              </p>
              <div className="flex gap-2">
                <Input readOnly value={httpsUrl} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" size="icon" onClick={copy} title="Copy URL">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Anyone with this URL can see the lab schedule (machine, who booked, project name,
              helpers). Do not post it publicly.
            </p>

            {permissions.canManageUsers && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={rotating}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${rotating ? "animate-spin" : ""}`} />
                    Issue a new key
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Issue a new feed key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The current URL stops working immediately and every subscribed calendar
                      goes stale until the person re-subscribes with the new URL. Do this if the
                      link has leaked.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep current key</AlertDialogCancel>
                    <AlertDialogAction onClick={rotate}>Issue new key</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
