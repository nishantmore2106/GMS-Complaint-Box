import { supabase } from "../lib/supabase";
import type { Role, ComplaintStatus, User, Site, Complaint, Notification, SiteMetric, SystemLog, SupervisorMetric, Company } from "../context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAFE_COMPLAINT_COLUMNS = "id,company_id,site_id,client_id,supervisor_id,status,priority,category,description,before_media_url,after_media_url,created_at,started_at,resolved_at,images,rating,rating_feedback";

export const ApiService = {
  // --- HELPERS ---
  async fetchWithTimeout(promise: Promise<any>, label: string = "unknown", timeoutMs: number = 10000) {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`[ApiService] ${label} query timed out after ${timeoutMs}ms`);
        resolve({ data: null, error: { message: "timeout" } });
      }, timeoutMs);
    });

    return Promise.race([
      promise.then((res) => {
        clearTimeout(timeoutId);
        return res;
      }).catch((err) => {
        clearTimeout(timeoutId);
        throw err;
      }),
      timeoutPromise
    ]) as Promise<any>;
  },

  async handleResilientQuery(query: any, label: string) {
    const res = await query;
    if (res.error?.code === 'PGRST204') {
      console.warn(`[ApiService] PGRST204 detected for ${label}. Retrying with safe columns...`);
      // Retry with explicit safe columns
      const parts = label.split('_');
      const table = parts[0];
      if (table === 'complaints') {
        const fallback = supabase.from('complaints').select(SAFE_COMPLAINT_COLUMNS);
        // Re-apply common filters if needed or just return the fallback select
        // For simplicity, we mostly use this for list views which use select("*")
        return fallback.order("created_at", { ascending: false }).limit(50);
      }
    }
    return res;
  },

  // --- AUTH & PROFILE ---
  async fetchUserProfile(supabaseId: string) {
    const query = supabase
      .from("users")
      .select("*")
      .eq("supabase_id", supabaseId)
      .maybeSingle();
      
    const { data, error } = await this.fetchWithTimeout(Promise.resolve(query), "user_profile", 15000);

    if (error?.message === "timeout") {
       console.error("[ApiService] fetchUserProfile: TIMEOUT (V2) - Throwing to AppContext");
       throw new Error("TIMEOUT");
    }
    if (error) throw error;
    return data;
  },

  async fetchUserProfileByEmail(email: string) {
    const query = supabase
      .from("users")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    const { data, error } = await this.fetchWithTimeout(Promise.resolve(query), "user_profile_email");
    if (error && error.message !== "timeout") throw error;
    return data;
  },

  async createUserProfile(profile: any) {
    const { data, error } = await supabase
      .from("users")
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: any) {
    const { error } = await supabase.from("users").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deleteUser(id: string) {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
  },

  // --- DATA FETCHING ---
  async fetchAllData(companyId: string, role?: Role, userId?: string) {
    if (!companyId) throw new Error("[ApiService] fetchAllData: MISSING companyId filter.");
    console.log(`[ApiService] fetchAllData: Starting sequential fetch (V2) for ${role} in company: ${companyId}`);
    
    // Core data (Essential for app to function)
    let siteQueryBuilder = supabase.from("sites").select("*").eq("company_id", companyId);
    let compQueryBuilder = supabase.from("complaints").select("*").eq("company_id", companyId);

    // 🛡️ ROLE-BASED ISOLATION (Defense in Depth)
    if (role === 'client' && userId) {
      console.log("[ApiService] Applying Client-level isolation filters...");
      // Clients only see sites they are associated with (if applicable)
      // and only their own complaints.
      compQueryBuilder = compQueryBuilder.eq("client_id", userId);
      siteQueryBuilder = siteQueryBuilder.eq("client_id", userId); // Assuming sites have client_id
    }
    
    const siteQuery = this.fetchWithTimeout(
      Promise.resolve(siteQueryBuilder.limit(100)), 
      "sites_core"
    );
    
    // 🛡️ Resilience for complaints table (PGRST204)
    const compQuery = (async () => {
       const initial = await this.fetchWithTimeout(
         Promise.resolve(compQueryBuilder.order("created_at", { ascending: false }).range(0, 49)), 
         "complaints_core"
       );
       if (initial.error?.code === 'PGRST204') {
          console.warn("[ApiService] fetchAllData: Complaints table out of sync. Falling back to safe columns.");
          let fallbackBuilder = supabase.from("complaints").select(SAFE_COMPLAINT_COLUMNS).eq("company_id", companyId);
          if (role === 'client' && userId) fallbackBuilder = fallbackBuilder.eq("client_id", userId);
          
          return this.fetchWithTimeout(
            Promise.resolve(fallbackBuilder.order("created_at", { ascending: false }).range(0, 49)), 
            "complaints_safe_fallback"
          );
       }
       return initial;
    })();
    
    try {
      const [siteRes, compRes] = await Promise.all([siteQuery, compQuery]);
      
      // Secondary data (Graceful failure)
      let metricsQueryBuilder = supabase.from("site_metrics").select("*").eq("company_id", companyId);
      let usersQueryBuilder = supabase.from("users").select("*").eq("company_id", companyId).neq("status", "deleted").limit(100);
      let supMetricsQueryBuilder = supabase.from("supervisor_metrics").select("*").eq("company_id", companyId);

      if (role === 'client') {
        const [usersRes] = await Promise.all([
          this.fetchWithTimeout(Promise.resolve(usersQueryBuilder), "users_limited_client")
        ]);
        // Clients shouldn't see metrics or logs for other users/sites, but they DO need user names for supervisors
        return [siteRes, compRes, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, usersRes];
      }

      const metricsQuery = this.fetchWithTimeout(Promise.resolve(metricsQueryBuilder), "metrics");
      const supMetricsQuery = this.fetchWithTimeout(Promise.resolve(supMetricsQueryBuilder), "sup_metrics");
      const usersQuery = this.fetchWithTimeout(Promise.resolve(usersQueryBuilder), "users_all");

      const [metricsRes, supMetricsRes, usersRes] = await Promise.all([
        metricsQuery, supMetricsQuery, usersQuery
      ]);

      return [siteRes, compRes, metricsRes, { data: [], error: null }, supMetricsRes, usersRes];
    } catch (err) {
      console.error("[ApiService] fetchAllData CRITICAL error:", err);
      throw err;
    }
  },

  async fetchUsers(companyId?: string) {
    let query = supabase.from("users").select("*");
    if (companyId) query = query.eq("company_id", companyId);
    return query.limit(100);
  },

  async fetchCompanies() {
    return supabase.from("companies").select("*").limit(50);
  },

  async fetchComplaintsPaginated(from: number, to: number, filters?: any) {
    let query = supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.siteId) query = query.eq("site_id", filters.siteId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.companyId) query = query.eq("company_id", filters.companyId);
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,subcategory.ilike.%${filters.search}%`);
    }

    let { data, error } = await query;
    
    if (error?.code === 'PGRST204') {
       console.warn("[ApiService] fetchComplaintsPaginated: Falling back to safe columns due to PGRST204");
       let fallbackQuery = supabase
         .from("complaints")
         .select(SAFE_COMPLAINT_COLUMNS)
         .order("created_at", { ascending: false })
         .range(from, to);
       
       if (filters?.siteId) fallbackQuery = fallbackQuery.eq("site_id", filters.siteId);
       if (filters?.status) fallbackQuery = fallbackQuery.eq("status", filters.status);
       if (filters?.companyId) fallbackQuery = fallbackQuery.eq("company_id", filters.companyId);
       
       const res = await fallbackQuery;
       data = res.data;
       error = res.error;
    }

    if (error) throw error;
    return data;
  },
  async fetchLogsPaginated(from: number, to: number, companyId: string) {
    return []; // system_logs table missing in schema
  },

  async fetchUsersPaginated(from: number, to: number, filters?: any) {
    let query = supabase
      .from("users")
      .select("*")
      .order("name", { ascending: true })
      .range(from, to);

    if (filters?.role) query = query.eq("role", filters.role);
    if (filters?.companyId) query = query.eq("company_id", filters.companyId);
    query = query.neq("status", "deleted");

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async fetchSitesPaginated(from: number, to: number, filters?: any) {
    let query = supabase
      .from("sites")
      .select("*")
      .order("name", { ascending: true })
      .range(from, to);

    if (filters?.companyId) query = query.eq("company_id", filters.companyId);
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // --- SITES ---
  async createSite(data: any) {
    const { data: newSite, error } = await supabase.from("sites").insert([data]).select().single();
    if (error) throw error;
    return newSite;
  },

  async updateSite(id: string, updates: any) {
    const { error } = await supabase.from("sites").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deleteSite(id: string) {
    // Delete complaints first
    await supabase.from("complaints").delete().eq("site_id", id);
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) throw error;
  },

  // --- COMPLAINTS ---
  async addComplaint(complaint: any) {
    const { data, error } = await supabase.from("complaints").insert([complaint]).select().single();
    if (error) throw error;
    return data;
  },

  async updateComplaint(id: string, updates: any) {
    const { error } = await supabase.from("complaints").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deleteComplaint(id: string) {
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) throw error;
  },

  // --- NOTIFICATIONS ---
  async fetchNotifications(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addNotification(notification: any) {
    const { error } = await supabase.from("notifications").insert([notification]);
    if (error) throw error;
  },

  async markNotificationAsRead(id: string) {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) throw error;
  },

  // --- SYSTEM LOGS ---
  async logSystemEvent(event: any) {
    const { error } = await supabase.from("system_logs").insert(event);
    if (error) throw error;
  },

  // --- STORAGE ---
  async uploadImage(path: string, blob: Blob) {
    const { data, error } = await supabase.storage.from("complaints").upload(path, blob, { upsert: true });
    if (error) throw error;
    if (!data?.path) throw new Error("Upload failed: No path returned from storage");
    
    const { data: { publicUrl } } = supabase.storage.from("complaints").getPublicUrl(data.path);
    return publicUrl;
  },

  // --- COMPANIES ---
  async deleteCompany(id: string) {
    // Cascading hard delete sequence
    console.log(`[ApiService] deleteCompany: PURGING all data for company=${id}`);
    
    // 1. Delete all complaints for this company
    await supabase.from("complaints").delete().eq("company_id", id);
    
    // 2. Delete all sites for this company
    await supabase.from("sites").delete().eq("company_id", id);
    
    // 3. Delete all user profiles for this company (Auth remains, profiles are purged)
    await supabase.from("users").delete().eq("company_id", id);
    
    // 4. Finally delete the company itself
    const { error } = await supabase.from("companies").delete().eq("id", id);
    
    if (error) {
      console.error("[ApiService] deleteCompany FAILED:", error);
      throw error;
    }
    console.log("[ApiService] deleteCompany: PURGE SUCCESS");
  }
};
