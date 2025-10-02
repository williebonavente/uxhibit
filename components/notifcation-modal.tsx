"use client";

import { Button } from "./ui/button";
import { IconBell, IconNotification, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function NotificationsModal({
  open,
  onClose,
  user,
  notifications,
  setNotifications,
  unreadNotifications,
  readNotifications,
  notifLoading,
  setNotifLoading,
  notifPage,
  setNotifPage,
  totalPages,
  handleDeleteNotification,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
  notifications: any[];
  setNotifications: (fn: (prev: any[]) => any[]) => void;
  unreadNotifications: any[];
  readNotifications: any[];
  notifLoading: string | null;
  setNotifLoading: (id: string | null) => void;
  notifPage: number;
  setNotifPage: (fn: (prev: number) => number) => void;
  totalPages: number;
  handleDeleteNotification: (notifId: string) => Promise<void>;
}) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[301] bg-white dark:bg-[#141414] rounded-xl shadow-lg p-6 max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-white text-xl font-bold focus:outline-none"
          aria-label="Close"
          type="button"
        >
          <IconX />
        </button>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <IconNotification /> Notifications
        </h3>
        {notifications.length === 0 ? (
          <div className="text-muted-foreground text-sm">No new notifications.</div>
        ) : (
          <ul className="space-y-3 max-h-60 overflow-y-auto">
            {/* Mark all as read button */}
            {unreadNotifications.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase
                      .from("notifications")
                      .update({ read: true })
                      .eq("to_user_id", user?.id)
                      .eq("read", false);
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, read: true }))
                    );
                  }}
                >
                  Mark all as read
                </Button>
              </div>
            )}
            {unreadNotifications.length === 0 && notifications.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase
                      .from("notifications")
                      .update({ read: false })
                      .eq("to_user_id", user?.id)
                      .eq("read", true);
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, read: false }))
                    );
                  }}
                >
                  Mark all as unread
                </Button>
              </div>
            )}

            {/* Unread notifications */}
            {unreadNotifications.length > 0 && (
              <>
                <li className="text-xs text-orange-600 font-semibold uppercase tracking-wide px-2 py-1">
                  Unread
                </li>
                {unreadNotifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="flex items-center gap-2 text-sm group rounded px-2 py-1 bg-orange-50 
                    dark:bg-orange-900/30 font-semibold cursor-pointer"
                    onClick={async () => {
                      if (notifLoading === notif.id) return;
                      setNotifLoading(notif.id);

                      if (!notif.read) {
                        const supabase = createClient();
                        const { error } = await supabase
                          .from("notifications")
                          .update({ read: true })
                          .eq("id", notif.id);

                        if (!error) {
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notif.id ? { ...n, read: true } : n
                            )
                          );
                          setNotifLoading(null);
                          if (notif.design_id) {
                            onClose();
                            setTimeout(() => {
                              router.push(`/designs/${notif.design_id}`);
                            }, 500);
                          }
                        } else {
                          setNotifLoading(null);
                          toast.error("Failed to mark notification as read.");
                        }
                      } else {
                        setNotifLoading(null);
                        if (notif.design_id) {
                          onClose();
                          router.push(`/designs/${notif.design_id}`);
                        }
                      }
                    }}
                  >
                    {!notif.read && (
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    )}
                    {notif.type === "heart" ? (
                      <span className="text-red-500">♥</span>
                    ) : (
                      <span className="text-blue-500">💬</span>
                    )}
                    <span>
                      {notif.type === "heart"
                        ? <><b>{[notif.from_user?.first_name, notif.from_user?.middle_name, notif.from_user?.last_name].filter(Boolean).join(" ") || "Someone"}</b> loved your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                        : <><b>{[notif.from_user?.first_name, notif.from_user?.middle_name, notif.from_user?.last_name].filter(Boolean).join(" ") || "Someone"}</b> commented on your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                      }
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                    {/* Mark as read */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const supabase = createClient();
                        const { error } = await supabase
                          .from("notifications")
                          .update({ read: true })
                          .eq("id", notif.id);
                        if (!error) {
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notif.id ? { ...n, read: true } : n
                            )
                          );
                          toast.success("Marked as read.");
                        } else {
                          toast.error("Failed to mark as read.");
                        }
                      }}
                      className="ml-2 text-gray-400 hover:text-green-600 transition-opacity opacity-0 group-hover:opacity-100"
                      title="Mark as read"
                      aria-label="Mark as read"
                      type="button"
                    >
                      <IconBell size={16} />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleDeleteNotification(notif.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                      title="Delete notification"
                      aria-label="Delete notification"
                      type="button"
                    >
                      <IconX size={16} />
                    </button>
                  </li>
                ))}
              </>
            )}

            {/* Divider between unread and read */}
            {unreadNotifications.length > 0 && readNotifications.length > 0 && (
              <li className="border-t border-gray-200 dark:border-gray-700 my-2"></li>
            )}

            {/* Read notifications */}
            {readNotifications.length > 0 && (
              <>
                <li className="text-xs text-muted-foreground uppercase tracking-wide px-2 py-1">
                  Read
                </li>
                {readNotifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="flex items-center gap-2 text-sm group rounded px-2 py-1 text-muted-foreground"
                  >
                    {notif.type === "heart" ? (
                      <span className="text-red-500">♥</span>
                    ) : (
                      <span className="text-blue-500">💬</span>
                    )}
                    <span>
                      {notif.type === "heart"
                        ? <><b>{[notif.from_user?.first_name, notif.from_user?.middle_name, notif.from_user?.last_name].filter(Boolean).join(" ") || "Someone"}</b> loved your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                        : <><b>{[notif.from_user?.first_name, notif.from_user?.middle_name, notif.from_user?.last_name].filter(Boolean).join(" ") || "Someone"}</b> commented on your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                      }
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                    {/* Mark as Unread Button */}
                    <button
                      onClick={async () => {
                        const supabase = createClient();
                        const { error } = await supabase
                          .from("notifications")
                          .update({ read: false })
                          .eq("id", notif.id);
                        if (!error) {
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notif.id ? { ...n, read: false } : n
                            )
                          );
                          toast.success("Marked as unread.");
                        } else {
                          toast.error("Failed to mark as unread.");
                        }
                      }}
                      className="ml-2 text-gray-400 hover:text-orange-500 transition-opacity opacity-0 group-hover:opacity-100"
                      title="Mark as unread"
                      aria-label="Mark as unread"
                      type="button"
                    >
                      <IconBell size={16} />
                    </button>
                    <button
                      onClick={async () => await handleDeleteNotification(notif.id)}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                      title="Delete notification"
                      aria-label="Delete notification"
                      type="button"
                    >
                      <IconX size={16} />
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="ghost"
              disabled={notifPage === 1}
              onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {notifPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={notifPage === totalPages}
              onClick={() => setNotifPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
        {/* Remove all the notifications here */}
        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="destructive"
            onClick={() => {
              toast(
                "Are you sure you want to delete all notifications?",
                {
                  action: {
                    label: "Yes, delete",
                    onClick: async () => {
                      const supabase = createClient();
                      const { error } = await supabase
                        .from("notifications")
                        .delete()
                        .eq("to_user_id", user?.id);
                      if (!error) {
                        setNotifications(() => []);
                        toast.success("All notifications cleared!");
                      } else {
                        toast.error("Failed to clear notifications.");
                      }
                    },
                  },
                  cancel: {
                    label: "Cancel",
                    onClick: () => { },
                  },
                  duration: 7000,
                  position: "top-center",
                }
              );
            }}
            disabled={notifications.length === 0}
            className={`${notifications.length === 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
          >
            Remove All
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}