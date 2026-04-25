import { supabase } from "../lib/supabase";
import { NotificationService } from "./notification.service";
import { getProfessionalNotification } from "../utils/notifications";
import { Role } from "../context/AppContext";

export const NotificationManager = {
  /**
   * Internal helper to fetch target users and send push + save history
   */
  async _sendToTargets(
    targetUsers: { id: string, role: Role, expo_push_token?: string | null }[], 
    type: 'complaint_created' | 'complaint_resolved' | 'complaint_assigned' | 'system_alert',
    data: { siteName?: string, complaintId?: string, supervisorName?: string }
  ) {
    if (!targetUsers || targetUsers.length === 0) return;

    const historyEntries: any[] = [];
    const pushMessages: { tokens: string[], title: string, body: string, data: any }[] = [];

    for (const user of targetUsers) {
      const template = getProfessionalNotification(user.role, type, data);
      
      // 1. Prepare history entry
      historyEntries.push({
        user_id: user.id,
        title: template.title,
        message: template.body,
        type: type,
        data: { ...data },
        is_read: false
      });

      // 2. Prepare push if token exists
      if (user.expo_push_token) {
        pushMessages.push({
          tokens: [user.expo_push_token],
          title: template.title,
          body: template.body,
          data: { ...data }
        });
      }
    }

    // 3. Bulk save history
    if (historyEntries.length > 0) {
      const { error } = await supabase.from('notifications').insert(historyEntries);
      if (error) {
        console.error("[NotificationManager] History save error:", error);
      } else {
        console.log("[NotificationManager] Saved history for", historyEntries.length, "targets");
      }
    }

    // 4. Send pushes
    for (const msg of pushMessages) {
      try {
        await NotificationService.sendRemotePushNotification(msg.tokens, msg.title, msg.body, msg.data);
      } catch (pushErr) {
        console.error("[NotificationManager] Push Error:", pushErr);
      }
    }
  },

  /**
   * Notify Supervisors (and optionally Founder for High Priority) about a new complaint
   */
   async notifyNewComplaint(complaint: any, siteName: string) {
    const { company_id, priority, id, site_id } = complaint;
    
    // Fetch all supervisors and founders for this company
    const { data: staff, error } = await supabase
      .from('users')
      .select('id, role, expo_push_token')
      .eq('company_id', company_id)
      .in('role', ['supervisor', 'founder']);
 
     if (error) {
       console.error("[NotificationManager] Staff fetch error:", error);
       return;
     }
     if (!staff || staff.length === 0) {
       console.warn("[NotificationManager] No staff (supervisor/founder) found for company:", company_id);
       return;
     }

    const targets = [...staff];

    // Also fetch the Client (Site Manager) AND the assigned Supervisor for this specific site
    if (site_id) {
      const { data: site } = await supabase.from('sites').select('client_id, assigned_supervisor_id').eq('id', site_id).single();
      if (site) {
        const idsToFetch = [];
        if (site.client_id) idsToFetch.push(site.client_id);
        if (site.assigned_supervisor_id) idsToFetch.push(site.assigned_supervisor_id);
        
        if (idsToFetch.length > 0) {
          const { data: specificStaff } = await supabase.from('users').select('id, role, expo_push_token').in('id', idsToFetch);
          if (specificStaff) targets.push(...(specificStaff as any));
        }
      }
    }

    const notificationData = { siteName, complaintId: id };

    // Resolve templates and send
    const supervisors = targets.filter(u => u.role === 'supervisor');
    const founders = targets.filter(u => u.role === 'founder');
    const clients = targets.filter(u => u.role === 'client');

    // Notify the Client and Targeted Supervisors (all staff in company for general, or assigned for site)
    // To ensure "Direct to Supervisor", we make sure at least the assigned one is notified.
    await this._sendToTargets([...supervisors, ...clients] as any, 'complaint_created', notificationData);

    // Notify Founders ALWAYS for anonymous/public complaints
    if (complaint.is_anonymous) {
      await this._sendToTargets(founders as any, 'complaint_created', notificationData);
    }
  },

  /**
   * Notify specifically assigned supervisor
   */
  async notifyAssignment(complaintId: string, supervisorId: string, siteName: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id, role, expo_push_token')
      .eq('id', supervisorId)
      .single();

    if (!user) return;

    await this._sendToTargets([user as any], 'complaint_assigned', { siteName, complaintId });
  },

  /**
   * Notify Client and Founder about resolution
   */
  async notifyResolution(complaint: any, siteName: string) {
    const { id, client_id, company_id, supervisor_name } = complaint;
    
    const targets: { id: string, role: Role, expo_push_token?: string | null }[] = [];

    // 1. Add Client
    if (client_id) {
      const { data: client } = await supabase.from('users').select('id, role, expo_push_token').eq('id', client_id).single();
      if (client) targets.push(client as any);
    }

    // 2. Add Founders
    const { data: founders } = await supabase.from('users').select('id, role, expo_push_token').eq('company_id', company_id).eq('role', 'founder');
    if (founders) targets.push(...(founders as any));

    await this._sendToTargets(targets, 'complaint_resolved', { siteName, complaintId: id, supervisorName: supervisor_name });
  },

  /**
   * Notify Client and Founder about progress steps (Arrived, Inspecting, etc.)
   */
  async notifyPhaseUpdate(complaint: any, nextPhase: string, siteName: string) {
    const { id, client_id, company_id } = complaint;
    const targets: { id: string, role: Role, expo_push_token?: string | null }[] = [];

    // 1. Add Client
    if (client_id) {
       const { data: client } = await supabase.from('users').select('id, role, expo_push_token').eq('id', client_id).single();
       if (client) targets.push(client as any);
    }

    // 2. Add Founders
    const { data: founders } = await supabase.from('users').select('id, role, expo_push_token').eq('company_id', company_id).eq('role', 'founder');
    if (founders) targets.push(...(founders as any));

    // Custom formatting for progress
    const phaseLabels: Record<string, string> = {
      'arrived': 'has arrived at site',
      'checking_issue': 'is now inspecting the issue',
      'solving': 'is actively fixing the problem'
    };

    const actionText = phaseLabels[nextPhase] || `updated status to ${nextPhase}`;
    const title = `Work Progress: ${siteName}`;
    const body = `Supervisor ${actionText} for issue #${id.substring(0, 8).toUpperCase()}.`;

    // Send to targets
    for (const user of targets) {
       await this._sendToTargets([user], 'system_alert' as any, { siteName, complaintId: id });
    }
  },

  /**
   * Clean up notifications older than 7 days
   */
  async cleanupOldNotifications() {
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     
     const { error, count } = await supabase
       .from('notifications')
       .delete()
       .lt('created_at', sevenDaysAgo.toISOString());
       
     if (error) console.error("[NotificationManager] Cleanup error:", error);
     else console.log("[NotificationManager] Purged", count, "old notifications.");
  }
};
