import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

export function NotificationListener() {
  const { currentUser, refreshData } = useApp();
  const { showToast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen for standard notification history inserts (The "Pop-up" System)
    const notifChannel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          const newNotif = payload.new;
          showToast(newNotif.message || newNotif.title, "info");
          refreshData(); // Sync dashboards
        }
      )
      .subscribe();

    // 2. Listen for complaint status updates
    const complaintChannel = supabase
      .channel("public:complaints")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "complaints" },
        (payload) => {
          const newComplaint = payload.new;
          const oldComplaint = payload.old;

          if (newComplaint.status !== oldComplaint.status) {
            // For Clients: Notify them about their own complaints
            if (currentUser.role === "client" && newComplaint.client_id === currentUser.id) {
              if (newComplaint.status === "in_progress") {
                showToast("Supervisor has arrived to resolve your issue!", "info");
                router.push({ pathname: "/complaint/[id]", params: { id: newComplaint.id } });
              } else if (newComplaint.status === "resolved") {
                showToast("Your complaint has been marked as resolved!", "success");
                router.push({ pathname: "/complaint/[id]", params: { id: newComplaint.id } });
              }
            }
            refreshData();
          }
        }
      )
      .subscribe();

    // 2. Handle Push Notification Taps (Deep Linking)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const complaintId = data?.complaintId || data?.complaint_id;
      
      if (typeof complaintId === 'string') {
        console.log("[NotificationListener] Deep-linking to complaint:", complaintId);
        router.push({ pathname: "/complaint/[id]", params: { id: complaintId } });
      }
    });

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(complaintChannel);
      subscription.remove();
    };
  }, [currentUser, showToast, refreshData]);

  return null; // This is a headless component for logic only
}
