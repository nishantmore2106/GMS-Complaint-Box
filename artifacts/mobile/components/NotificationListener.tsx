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

    // We listen to updates on the complaints table
    const channel = supabase
      .channel("public:complaints")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "complaints" },
        (payload) => {
          const newComplaint = payload.new;
          const oldComplaint = payload.old;

          // If the status changed
          if (newComplaint.status !== oldComplaint.status) {
            
            // For Clients: Notify them about their own complaints
            if (currentUser.role === "client" && newComplaint.client_id === currentUser.id) {
              if (newComplaint.status === "in_progress") {
                showToast("Supervisor is on the way to resolve your issue!", "info");
                // Navigate to details if they want to track live
                router.push({ pathname: "/complaint/[id]", params: { id: newComplaint.id } });
              } else if (newComplaint.status === "resolved") {
                showToast("Your complaint has been marked as resolved by the team!", "success");
                router.push({ pathname: "/complaint/[id]", params: { id: newComplaint.id } });
              }
            }
            
            // Optional: For Founders, maybe a quick toast that a complaint progressed?
            // if (currentUser.role === "founder" && newComplaint.company_id === currentUser.companyId) {
            //   showToast(`A complaint at ${newComplaint.site_name || 'a site'} is now ${newComplaint.status}`, "info");
            // }

            // Whenever a relevant change happens, refresh the global data
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
      supabase.removeChannel(channel);
      subscription.remove();
    };
  }, [currentUser, showToast, refreshData]);

  return null; // This is a headless component for logic only
}
