import { Role } from "../context/AppContext";

export interface NotificationTemplate {
  title: string;
  body: string;
}

export const getProfessionalNotification = (
  role: Role,
  type: 'complaint_created' | 'complaint_resolved' | 'complaint_assigned' | 'system_alert',
  data: { siteName?: string; complaintId?: string; supervisorName?: string }
): NotificationTemplate => {
  const { siteName, complaintId, supervisorName } = data;

  switch (role) {
    case 'client':
      if (type === 'complaint_created') return {
        title: "Complaint Received",
        body: `We have received your report for ${siteName}. Our team is looking into it.`
      };
      if (type === 'complaint_resolved') return {
        title: "Issue Resolved",
        body: `Great news! The issue at ${siteName} (ID: ${complaintId?.substring(0,6)}) has been resolved.`
      };
      break;

    case 'supervisor':
      if (type === 'complaint_assigned') return {
        title: "New Task Assigned",
        body: `You have been assigned to an issue at ${siteName}. Please check the details.`
      };
      if (type === 'complaint_created') return {
        title: "Attention Required",
        body: `A new complaint has been filed at ${siteName}. Quick action is recommended.`
      };
      break;

    case 'founder':
      if (type === 'complaint_created') return {
        title: "Site Alert",
        body: `New activity at ${siteName}. A complaint has been logged.`
      };
      if (type === 'complaint_resolved') return {
        title: "Resolution Report",
        body: `${supervisorName} just resolved an issue at ${siteName}.`
      };
      if (type === 'system_alert') return {
        title: "Operations Alert",
        body: `System check: Performance at ${siteName} needs your attention.`
      };
      break;
  }

  // Fallback
  return {
    title: "GMS Alert",
    body: "New update in the GMS Complaints Box app."
  };
};
