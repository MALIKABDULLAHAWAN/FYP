import { useState, useEffect, useCallback } from "react";
import UiIcon from "./ui/UiIcon";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("dhyan_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      } catch {
        // ignore
      }
    }
  }, []);

  const saveNotifications = useCallback((newNotifications) => {
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter((n) => !n.read).length);
    localStorage.setItem("dhyan_notifications", JSON.stringify(newNotifications));
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, 50);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

function notificationIconName(type) {
  switch (type) {
    case "achievement":
      return "trophy";
    case "session":
      return "games";
    case "reminder":
      return "timer";
    case "system":
      return "megaphone";
    case "message":
      return "chat";
    default:
      return "bell";
  }
}

export function NotificationBell({ notifications, unreadCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        padding: "10px",
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 22,
        transition: "background 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128, 90, 213, 0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <UiIcon name="bell" size={22} title="Notifications" />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--danger)",
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export function NotificationsPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  isOpen,
  onClose,
}) {
  const [filter, setFilter] = useState("all");

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "achievements") return n.type === "achievement";
    if (filter === "system") return n.type === "system";
    return true;
  });

  const getNotificationColor = (type) => {
    switch (type) {
      case "achievement":
        return "#F6AD55";
      case "session":
        return "#68D391";
      case "reminder":
        return "#63B3ED";
      case "system":
        return "#9F7AEA";
      case "message":
        return "#FC8181";
      default:
        return "#A0AEC0";
    }
  };

  const filterTabs = [
    { id: "all", label: "All", icon: null },
    { id: "unread", label: "Unread", icon: null },
    { id: "achievements", label: "Achievements", icon: "trophy" },
    { id: "system", label: "System", icon: "megaphone" },
  ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 8,
          width: 380,
          maxHeight: 500,
          background: "var(--surface)",
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          zIndex: 1000,
          overflow: "hidden",
          animation: "slideInDown 0.2s ease",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <UiIcon name="bell" size={20} title="" />
            Notifications
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onMarkAllAsRead}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 8,
                border: "none",
                background: "rgba(128, 90, 213, 0.1)",
                color: "var(--primary)",
                cursor: "pointer",
              }}
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "6px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UiIcon name="close" size={18} title="Close" />
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          {filterTabs.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: filter === f.id ? "var(--primary)" : "rgba(128, 90, 213, 0.1)",
                color: filter === f.id ? "white" : "var(--primary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {f.icon && <UiIcon name={f.icon} size={14} title="" />}
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 350, overflowY: "auto" }}>
          {filteredNotifications.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <UiIcon name="inbox" size={40} title="" />
              </div>
              <p style={{ margin: "12px 0 0 0" }}>No notifications</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onMarkAsRead(notification.id)}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  gap: 12,
                  cursor: "pointer",
                  background: notification.read ? "transparent" : "rgba(128, 90, 213, 0.05)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128, 90, 213, 0.1)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = notification.read
                    ? "transparent"
                    : "rgba(128, 90, 213, 0.05)")
                }
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `${getNotificationColor(notification.type)}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UiIcon name={notificationIconName(notification.type)} size={22} title="" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: notification.read ? 500 : 700,
                      fontSize: 14,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {notification.title}
                    {!notification.read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--primary)",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {notification.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  style={{
                    padding: "4px",
                    borderRadius: 4,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    opacity: 0.5,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
                >
                  <UiIcon name="trash" size={18} title="Delete" />
                </button>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={onClearAll}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "var(--danger)",
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default { useNotifications, NotificationBell, NotificationsPanel };
