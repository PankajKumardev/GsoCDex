import { cn } from "@/lib/cn";

interface TrademarkNoticeProps {
  variant?: "footer" | "full";
  className?: string;
}

const FULL_TEXT =
  'GSoCDex is an independent community archive. It is not affiliated with, endorsed by, or sponsored by Google LLC. "Google Summer of Code", "GSoC", and the GSoC sun mark are trademarks of Google LLC, used here non-commercially with attribution under the GSoC brand guidelines. All organization names and logos belong to their respective owners.';

const FOOTER_TEXT =
  "Independent archive. Not affiliated with Google. GSoC sun mark © Google LLC.";

export function TrademarkNotice({
  variant = "footer",
  className,
}: TrademarkNoticeProps) {
  if (variant === "full") {
    return (
      <p className={cn("text-sm leading-relaxed text-app-muted", className)}>
        {FULL_TEXT}
      </p>
    );
  }
  return (
    <p className={cn("text-xs leading-relaxed text-app-muted", className)}>
      {FOOTER_TEXT}
    </p>
  );
}
