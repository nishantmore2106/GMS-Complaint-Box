import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";

export function NotificationListener() {
  const { currentUser, refreshData } = useApp();
  const { showToast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen for standard notification history inserts (The "Pop-up" System)
    const notifChannel = supabase
      .channel(`user-notifs-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          const newNotif = payload.new;
          showToast(newNotif.message || newNotif.title, "info");
          refreshData({ forceSync: true }); // Sync dashboards
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
            refreshData({ forceSync: true });
          }
        }
      )
      .subscribe();

    // 3. Listen for new complaints (Direct Pop-up for Supervisors/Founders)
    const newComplaintChannel = supabase
      .channel(`new-complaints-v3-${currentUser.companyId}`) // Use unique v3 channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        (payload) => {
          const newComplaint = payload.new;
          console.log("[NotificationListener] New Complaint Inserted:", newComplaint.id);
          
          if ((currentUser.role === "supervisor" || currentUser.role === "founder") && newComplaint.company_id === currentUser.companyId) {
             // Since INSERT payload doesn't have site_name, we just use category for now to be safe
             // Components will reload site names after refreshData
             showToast(`NEW MISSION: ${newComplaint.category || 'Issue'} reported`, "info");
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
             refreshData({ forceSync: true });
          }
        }
      )
      .subscribe((status) => {
        console.log("[NotificationListener] Channel Status:", status);
      });

    // 4. Handle Push Notification Taps (Deep Linking)
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
      supabase.removeChannel(newComplaintChannel);
      subscription.remove();
    };
  }, [currentUser, showToast, refreshData]);

  return null; // This is a headless component for logic only
}
