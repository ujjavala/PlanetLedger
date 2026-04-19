"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BarChart3, TrendingUp, AlertTriangle, type LucideIcon } from "lucide-react";

type Notification = {
  id: string;
  type: "weekly_report" | "score_improved" | "high_impact";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

const TYPE_ICON: Record<Notification["type"], LucideIcon> = {
  weekly_report:  BarChart3,
  score_improved: TrendingUp,
  high_impact:    AlertTriangle,
};

const TYPE_ICON_COLOR: Record<Notification["type"], string> = {
  weekly_report:  "text-blue-500",
  score_improved: "text-emerald-500",
  high_impact:    "text-amber-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Notification[] };
      setNotifications(data.notifications ?? []);
    } catch {
      // silently ignore — bell is non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-xl border border-white/30 bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-xs text-slate-400">{notifications.length} total</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-50 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${n.read ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 ${TYPE_ICON_COLOR[n.type]}`}>
                      {(() => { const Icon = TYPE_ICON[n.type]; return <Icon className="h-4 w-4" />; })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{n.body}</p>
                      <p className="mt-1 text-[10px] text-slate-300">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
