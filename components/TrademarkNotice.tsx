import { cn } from "@/lib/cn";

interface TrademarkNoticeProps {
  variant?: "footer" | "full";
  className?: string;
}

const FULL_TEXT =
  "GSoCDex is an independent community project. It is not affiliated with, endorsed by, or sponsored by Google LLC. \"Google Summer of Code\" and \"GSoC\" are trademarks of Google LLC. All organization names and logos belong to their respective owners.";

const FOOTER_TEXT = "Not affiliated with Google. GSoC is a trademark of Google LLC.";

export function TrademarkNotice({ variant = "footer", className }: TrademarkNoticeProps) {
  if (variant === "full") {
    return (
      <p className={cn("text-sm leading-relaxed text-app-muted", className)}>{FULL_TEXT}</p>
    );
  }
  return (
    <p className={cn("text-xs text-app-muted", className)}>{FOOTER_TEXT}</p>
  );
}
