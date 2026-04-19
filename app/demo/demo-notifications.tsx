import { Bell, BarChart3, TrendingUp, AlertTriangle, type LucideIcon } from "lucide-react";
import type { DemoNotificationItem, NotificationVariant } from "./demo-data";

const VARIANT_ICON: Record<NotificationVariant, LucideIcon> = {
  weekly_report: BarChart3,
  score_improved: TrendingUp,
  high_impact: AlertTriangle,
};

const VARIANT_ICON_COLOR: Record<NotificationVariant, string> = {
  weekly_report: "text-blue-500",
  score_improved: "text-emerald-600",
  high_impact: "text-amber-500",
};

interface Props {
  notifications: DemoNotificationItem[];
}

function NotificationRow({ variant, color, title, body, time }: DemoNotificationItem) {
  const Icon = VARIANT_ICON[variant];
  return (
    <li className={`flex items-start gap-3 rounded-xl border p-3 ${color}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${VARIANT_ICON_COLOR[variant]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{body}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </li>
  );
}

export function DemoNotifications({ notifications }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900">Notifications &amp; Alerts</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
          Demo feed
        </span>
      </div>

      <ul className="space-y-3">
        {notifications.map((n) => (
          <NotificationRow key={n.title} {...n} />
        ))}
      </ul>

      <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-3">
        Real-time alerts are delivered to your notification bell after signing in.
      </p>
    </div>
  );
}
