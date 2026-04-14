import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { LoadingScreen } from "../components/LoadingScreen";
import { ApiService } from "../services/api.service";
import { compressImage } from "../utils/image";
import { NotificationService } from "../services/notification.service";
import { NotificationManager } from "../services/notification.manager";
import { getProfessionalNotification } from "../utils/notifications";
import { Alert } from "react-native";

export type Role = "client" | "supervisor" | "founder";
export type ComplaintStatus = "pending" | "in_progress" | "resolved";

export interface Company {
  id: string;
  name: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: Role;
  companyId: string | null;
  status?: "active" | "suspended" | "deleted";
  hasOnboarded?: boolean;
  displayId?: string;
  notificationsEnabled?: boolean;
  expo_push_token?: string;
}

export interface SystemSettings {
  id: string;
  is_maintenance_mode: boolean;
  maintenance_message: string;
  is_paused: boolean;
  current_version: string;
  min_supported_version: string;
  last_updated_at: string;
}

export interface AppIssue {
  id: string;
  user_id: string;
  title: string;
  description: string;
  device_info: any;
  app_version: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  companyId: string;
  clientId: string | null;
  assignedSupervisorId: string | null;
  address?: string;
  clientName?: string;
  clientPhone?: string;
  authorityName?: string;
  phone?: string | null;
  logoUrl?: string | null;
  status: 'active' | 'suspended';
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
}

export interface Complaint {
  id: string;
  companyId: string;
  siteId: string;
  siteName?: string;
  clientId: string;
  clientName?: string;
  supervisorId: string | null;
  supervisorName?: string | null;
  status: ComplaintStatus;
  beforeMediaUrl: string | null;
  afterMediaUrl: string | null;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  resolvedAt: string | null;
  startedAt: string | null;
  images?: string[];
  rating?: number | null;
  ratingFeedback?: string | null;
  subcategory?: string | null;
  work_notes?: string | null;
  currentPhase?: string;
  phaseHistory?: { phase: string, timestamp: string }[];
  isAnonymous?: boolean;
  anonymousName?: string;
  floor?: string;
  roomNumber?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface SiteMetric {
  site_id: string;
  company_id: string;
  active_issues: number;
  avg_resolution_time_hrs: number;
  status: 'good' | 'medium' | 'critical';
  last_updated: string;
}

export interface SystemLog {
  id: string;
  company_id: string;
  type: 'issue_created' | 'resolved' | 'assigned' | 'system';
  message: string;
  created_at: string;
}

export interface SupervisorMetric {
  supervisor_id: string;
  company_id: string;
  tasks_completed: number;
  avg_time_hrs: number;
  rating: number;
  last_updated: string;
}

interface AppContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  selectedCompanyId: string | null;
  companies: Company[];
  users: User[];
  sites: Site[];
  complaints: Complaint[];
  setSelectedCompanyId: (id: string | null) => void;
  addComplaint: (complaint: Omit<Complaint, "id" | "createdAt">) => Promise<void>;
  updateComplaint: (id: string, updates: Partial<Complaint>) => Promise<void>;
  assignSupervisorToSite: (siteId: string, supervisorId: string | null) => Promise<void>;
  getCompanyComplaints: (companyId: string) => Complaint[];
  getCompanySites: (companyId: string) => Site[];
  getCompanyUsers: (companyId: string) => User[];
  getCompanyById: (id: string) => Company | undefined;
  getSiteById: (id: string) => Site | undefined;
  getUserById: (id: string) => User | undefined;
  logout: () => Promise<void>;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  addNotification: (userId: string, type: any, data: any) => Promise<void>;
  refreshData: (options?: { forceLoading?: boolean, forceSync?: boolean, search?: string }) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<any>;
  createSupervisor: (email: string, pass: string, name: string, phone: string, companyId?: string, siteIds?: string[]) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  createCompany: (name: string, adminDetails?: { name: string, email: string, pass: string, phone: string }) => Promise<void>;
  createSite: (data: { name: string, companyId: string, supervisorId?: string, address?: string, phone?: string | null, logoUrl?: string | null, clientName?: string, clientPhone?: string, authorityName?: string, latitude?: number | null, longitude?: number | null, radiusMeters?: number | null }) => Promise<Site>;
  updateSite: (id: string, updates: Partial<Site>) => Promise<void>;
  assignSupervisorToComplaint: (complaintId: string, supervisorId: string | null) => Promise<void>;
  uploadImage: (uri: string, path: string) => Promise<string>;
  provisionClient: (siteId: string, email: string, name: string, password?: string, photoUri?: string, companyId?: string) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  siteMetrics: SiteMetric[];
  systemLogs: SystemLog[];
  supervisorMetrics: SupervisorMetric[];
  logSystemEvent: (type: SystemLog['type'], message: string) => Promise<void>;
  isLoading: boolean;
  profileImage: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
  language: 'en' | 'hi';
  setLanguage: (lng: 'en' | 'hi') => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => Promise<void>;
  lastSynced: number | null;
  loadMoreComplaints: (filters?: any) => Promise<void>;
  loadMoreLogs: () => Promise<void>;
  loadMoreUsers: (filters?: any) => Promise<void>;
  loadMoreSites: (filters?: any) => Promise<void>;
  systemSettings: SystemSettings | null;
  updateSystemSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  appIssues: AppIssue[];
  reportAppIssue: (issue: Omit<AppIssue, 'id' | 'created_at' | 'status' | 'user_id'>) => Promise<void>;
  updateAppIssue: (id: string, updates: Partial<AppIssue>) => Promise<void>;
  broadcastNotification: (title: string, message: string, role?: Role) => Promise<void>;
  commenceWork: (complaintId: string) => Promise<void>;
  updateComplaintPhase: (id: string, phase: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<any>;
  loaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [siteMetrics, setSiteMetrics] = useState<SiteMetric[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [supervisorMetrics, setSupervisorMetrics] = useState<SupervisorMetric[]>([]);
  const [language, setLanguageState] = useState<'en' | 'hi'>('en');
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [appIssues, setAppIssues] = useState<AppIssue[]>([]);
  const [syncError, setSyncError] = useState<boolean>(false);

  const currentUserRef = useRef<User | null>(null);
  const isFetchingRef = useRef(false);
  const hasInitialDataRef = useRef(false);
  const lastAuthUpdateRef = useRef<number>(Date.now());
  const pendingProfileFetchRef = useRef<Map<string, Promise<any>>>(new Map());
  const sitesRef = useRef<Site[]>([]);
  const usersRef = useRef<User[]>([]);

  // Keep refs in sync with state for realtime listener access
  useEffect(() => { sitesRef.current = sites; }, [sites]);
  useEffect(() => { usersRef.current = users; }, [users]);

  const fetchData = useCallback(async (options?: { forceLoading?: boolean, forceSync?: boolean, search?: string }) => {
    if (isFetchingRef.current) return;

    const now = Date.now();
    if (!options?.forceSync && !options?.search && lastSynced && now - lastSynced < 5 * 60 * 1000) {
      console.log("[AppContext] fetchData: Cached data is fresh, skipping sync.");
      return;
    }
    
    // 🛡️ Global Safety Timeout: Force loading to false after 20s if anything hangs
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.error("[AppContext] Global fetchData timeout reached. Forcing loading false.");
        setIsLoading(false);
        setLoaded(true);
        isFetchingRef.current = false;
      }
    }, 20000);

    try {
      const alreadyHasData = complaints.length > 0 || sites.length > 0;
      if (options?.forceLoading || (!hasInitialDataRef.current && !alreadyHasData)) {
        setIsLoading(true);
      }
      
      const user = currentUserRef.current;
      if (!user) {
        console.warn("[AppContext] fetchData: No current user, skipping DB fetch.");
        return;
      }

      isFetchingRef.current = true;
      console.log("[AppContext] fetchData: Starting sync for user:", user.id);

      // 1. Fetch System Settings & Admin Data (Non-blocking/Optional)
      try {
        const fetchSettings = async () => {
          const { data } = await supabase.from('system_settings').select('*').maybeSingle();
          if (data) setSystemSettings(data);
        };
        const fetchIssues = async () => {
          if (user.role === 'founder') {
            const { data } = await supabase.from('app_issues').select('*').order('created_at', { ascending: false }).limit(50);
            if (data) setAppIssues(data);
          }
        };
        // Fire and forget non-essential admin data or wrap in light timeout
        Promise.all([fetchSettings(), fetchIssues()]).catch(err => console.warn("[AppContext] Admin data fetch partial fail:", err));
      } catch (err) {
        console.warn("[AppContext] Non-critical system fetch failed:", err);
      }

      // 2. Fetch Core App Data via ApiService
      const results = await ApiService.fetchAllData(
        (user.companyId || "") as string,
        user.role,
        user.id
      );
      console.log("[AppContext] ApiService data received.");
      
      const [siteRes, complaintRes, metricsRes, logsRes, supMetricsRes, usersRes] = results;

      if (usersRes?.data) {
        const activeUsers = usersRes.data.filter((u: any) => u.status !== 'deleted');
        const mappedUsers = activeUsers.map((u: any) => ({
          ...u,
          companyId: u.company_id,
          hasOnboarded: u.has_onboarded,
          notificationsEnabled: u.notifications_enabled,
          displayId: u.display_id || `ID-${u.id.substring(0, 4).toUpperCase()}`
        }));
        setUsers(mappedUsers);
      }

      if (siteRes?.data) {
        const mappedSites = siteRes.data.map((s: any) => ({
          id: s.id, name: s.name, companyId: s.company_id, clientId: s.client_id || "",
          assignedSupervisorId: s.assigned_supervisor_id, address: s.address,
          clientName: s.client_name, clientPhone: s.client_phone, authorityName: s.authority_name,
          status: s.status || 'active',
          logoUrl: s.logo_url,
          phone: s.phone,
          latitude: s.latitude,
          longitude: s.longitude,
          radiusMeters: s.radius_meters || 500
        }));
        setSites(mappedSites);
        await AsyncStorage.setItem("cached_sites", JSON.stringify(mappedSites));
      }

      if (complaintRes?.data) {
        const mappedComplaints = complaintRes.data.map((c: any) => {
          const s = siteRes?.data?.find((site: any) => site.id === c.site_id);
          const u = usersRes?.data?.find((user: any) => user.id === c.client_id);
          const sup = usersRes?.data?.find((user: any) => user.id === c.supervisor_id);

          return {
            id: c.id, description: c.description, status: c.status, priority: c.priority,
            category: c.category, companyId: c.company_id, siteId: c.site_id,
            siteName: s?.name,
            clientId: c.client_id, 
            clientName: u?.name,
            supervisorId: c.supervisor_id,
            supervisorName: sup?.name,
            beforeMediaUrl: c.before_media_url, afterMediaUrl: c.after_media_url,
            createdAt: c.created_at, startedAt: c.started_at, resolvedAt: c.resolved_at,
            images: c.images || [], rating: c.rating, ratingFeedback: c.rating_feedback,
            subcategory: c.subcategory,
            currentPhase: c.current_phase,
            phaseHistory: c.phase_history,
            isAnonymous: c.is_anonymous,
            anonymousName: c.anonymous_name,
            floor: c.floor,
            roomNumber: c.room_number
          };
        });
        setComplaints(mappedComplaints);
        await AsyncStorage.setItem("cached_complaints", JSON.stringify(mappedComplaints));
      }

      if (metricsRes?.data) {
        setSiteMetrics(metricsRes.data);
        await AsyncStorage.setItem("cached_site_metrics", JSON.stringify(metricsRes.data));
      }
      if (logsRes?.data) setSystemLogs(logsRes.data);
      if (supMetricsRes?.data) {
        setSupervisorMetrics(supMetricsRes.data);
        await AsyncStorage.setItem("cached_supervisor_metrics", JSON.stringify(supMetricsRes.data));
      }

      hasInitialDataRef.current = true;
      setLastSynced(Date.now());
      await AsyncStorage.setItem('last_synced_timestamp', String(Date.now()));
      console.log("[AppContext] fetchData: Sync SUCCESS.");
    } catch (e) {
      console.error("[AppContext] fetchData CRITICAL error:", e);
      // Fallback to cache on error
      try {
        const cachedSites = await AsyncStorage.getItem("cached_sites");
        const cachedComplaints = await AsyncStorage.getItem("cached_complaints");
        if (cachedSites) setSites(JSON.parse(cachedSites));
        if (cachedComplaints) setComplaints(JSON.parse(cachedComplaints));
      } catch (cacheErr) {
        console.error("[AppContext] Cache recovery failed:", cacheErr);
      }
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
      isFetchingRef.current = false;
      setLoaded(true);
    }
  }, []); // fetchData should be stable. It uses refs for current user and state setters for data.

  const loadMoreComplaints = useCallback(async (filters?: any) => {
    if (isFetchingRef.current) return;
    const currentCount = complaints.length;
    isFetchingRef.current = true;
    try {
      const more = await ApiService.fetchComplaintsPaginated(currentCount, currentCount + 49, filters);
      if (more && more.length > 0) {
        const mapped = more.map((c: any) => ({
          id: c.id, description: c.description, status: c.status, priority: c.priority,
          category: c.category, companyId: c.company_id, siteId: c.site_id,
          clientId: c.client_id, supervisorId: c.supervisor_id,
          beforeMediaUrl: c.before_media_url, afterMediaUrl: c.after_media_url,
          createdAt: c.created_at, startedAt: c.started_at, resolvedAt: c.resolved_at,
          images: c.images || [],
          rating: c.rating,
          ratingFeedback: c.rating_feedback,
          subcategory: c.subcategory,
          currentPhase: c.current_phase,
          phaseHistory: c.phase_history
        }));
        setComplaints(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueMore = mapped.filter((c: any) => !existingIds.has(c.id));
          return [...prev, ...uniqueMore];
        });
      }
    } catch (e) {
      console.error("[AppContext] loadMoreComplaints error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [complaints.length]);

  const loadMoreLogs = useCallback(async () => {
    if (isFetchingRef.current) return;
    const cid = currentUserRef.current?.companyId;
    if (!cid) return;
    const currentCount = systemLogs.length;
    isFetchingRef.current = true;
    try {
      const more = await ApiService.fetchLogsPaginated(currentCount, currentCount + 49, cid);
      if (more && more.length > 0) {
        setSystemLogs(prev => [...prev, ...more]);
      }
    } catch (e) {
      console.error("[AppContext] loadMoreLogs error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [systemLogs.length]);

  const loadMoreUsers = useCallback(async (filters?: any) => {
    if (isFetchingRef.current) return;
    const currentCount = users.length;
    isFetchingRef.current = true;
    try {
      const more = await ApiService.fetchUsersPaginated(currentCount, currentCount + 49, filters);
      if (more && more.length > 0) {
        const mapped = more.map((u: any) => ({
          ...u,
          companyId: u.company_id,
          hasOnboarded: u.has_onboarded,
          notificationsEnabled: u.notifications_enabled,
          displayId: u.display_id || `ID-${u.id.substring(0, 4).toUpperCase()}`
        }));
        setUsers(prev => {
           // Prevent duplicates
           const existingIds = new Set(prev.map(p => p.id));
           const uniqueMore = mapped.filter((u: any) => !existingIds.has(u.id));
           return [...prev, ...uniqueMore];
        });
      }
    } catch (e) {
      console.error("[AppContext] loadMoreUsers error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [users.length]);

  const loadMoreSites = useCallback(async (filters?: any) => {
    if (isFetchingRef.current) return;
    const currentCount = sites.length;
    isFetchingRef.current = true;
    try {
      const more = await ApiService.fetchSitesPaginated(currentCount, currentCount + 49, filters);
      if (more && more.length > 0) {
        const mapped = more.map((s: any) => ({
          id: s.id, name: s.name, companyId: s.company_id, clientId: s.client_id || "",
          assignedSupervisorId: s.assigned_supervisor_id, address: s.address,
          clientName: s.client_name, clientPhone: s.client_phone, authorityName: s.authority_name,
          status: s.status || 'active'
        }));
        setSites(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueMore = mapped.filter((s: any) => !existingIds.has(s.id));
          return [...prev, ...uniqueMore];
        });
      }
    } catch (e) {
      console.error("[AppContext] loadMoreSites error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [sites.length]);

  const fetchUserProfile = useCallback(async (supabaseId: string) => {
    // 🛡️ Singleton/Debounce: Prevent redundant profile fetches for the same ID
    if (pendingProfileFetchRef.current.has(supabaseId)) {
      console.log(`[AppContext] fetchUserProfile: Join existing fetch for ${supabaseId}`);
      return pendingProfileFetchRef.current.get(supabaseId);
    }

    const fetchId = Date.now();
    lastAuthUpdateRef.current = fetchId;
    console.log(`[AppContext] fetchUserProfile: Starting for ${supabaseId} (ID: ${fetchId})`);
    
    const fetchPromise = (async () => {
      try {
        setSyncError(false);
        const data = await ApiService.fetchUserProfile(supabaseId);
        console.log(`[AppContext] fetchUserProfile (ID: ${fetchId}) query returned.`);

      if (data) {
        if (lastAuthUpdateRef.current !== fetchId) {
          console.warn("[AppContext] fetchUserProfile: Stale fetch, ignoring results.");
          return;
        }
        console.log("[AppContext] Profile found:", data.name);
        const formattedUser: User = {
          ...data,
          companyId: data.company_id || null,
          hasOnboarded: data.has_onboarded,
          notificationsEnabled: data.notifications_enabled,
          displayId: data.display_id || `ID-${data.id.substring(0, 4).toUpperCase()}`
        };
        setCurrentUserState(formattedUser);
        currentUserRef.current = formattedUser;
        setSelectedCompanyIdState(formattedUser.companyId);
        
        if (formattedUser.notificationsEnabled !== undefined) {
          setNotificationsEnabledState(formattedUser.notificationsEnabled);
        }

        // --- Push Notification Registration (NON-BLOCKING) ---
        NotificationService.registerForPushNotificationsAsync().then(async (pushToken) => {
          if (pushToken && typeof pushToken === 'string' && pushToken !== data.expo_push_token) {
            console.log("[AppContext] Background: Saving new push token...");
            await ApiService.updateUser(data.id, { expo_push_token: pushToken });
            if (currentUserRef.current) {
              currentUserRef.current = { ...currentUserRef.current, expo_push_token: pushToken };
            }
          }
        }).catch(pushErr => {
          console.warn("[AppContext] Background push registration failed:", pushErr);
        });
        // -----------------------------------------------------
        
        const { data: nData } = await supabase.from("notifications").select("*").eq("user_id", data.id).order("created_at", { ascending: false });
        if (nData) setNotifications(nData.map(n => ({
          id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type, isRead: n.is_read, createdAt: n.created_at
        })));

        const storedImg = await AsyncStorage.getItem(`profileImage_${data.id}`);
        setProfileImageState(storedImg);
        fetchData();
      } else {
        // Only provision if it's explicitly NOT FOUND, not if it TIMED OUT
        console.log("[AppContext] Profile NOT FOUND in DB (V2). Attempting auto-provision...");
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;

        if (authUser) {
          const metadataRole = authUser.user_metadata?.role as Role;
          const assignedRole: Role = metadataRole || 'client';
          
          const newProfile = {
            supabase_id: supabaseId,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || "New User",
            role: assignedRole,
            status: 'active',
            has_onboarded: false
          };
          
          const created = await ApiService.createUserProfile(newProfile);
          
          if (created) {
            if (lastAuthUpdateRef.current !== fetchId) {
              console.warn("[AppContext] fetchUserProfile: Provisioning stale, ignoring results.");
              return;
            }
            const formatted: User = {
              id: created.id, phone: created.phone, name: created.name, role: created.role as Role,
              companyId: created.company_id, status: created.status, hasOnboarded: created.has_onboarded,
              displayId: created.display_id || `${assignedRole === 'founder' ? 'FND' : (assignedRole === 'supervisor' ? 'SUP' : 'CLI')}-${created.id.substring(0, 4).toUpperCase()}`
            };
            setCurrentUserState(formatted);
            currentUserRef.current = formatted;
            fetchData({ forceSync: true });
          }
        }
      }
    } catch (e: any) {
      if (e.message === "TIMEOUT") {
        console.error(`[AppContext] fetchUserProfile (ID: ${fetchId}) TIMED OUT.`);
        setSyncError(true);
      } else {
        console.error("[AppContext] Unexpected error in fetchUserProfile:", e);
      }
      
      // 🛡️ Loop Breaker: If we hit a recursion error or other DB failure, 
      // don't leave the app in a state where it might keep re-triggering this effect.
      if (e?.code === '42P17') {
        console.warn("[AppContext] DB Recursion detected. Stopping fetch to prevent loop.");
        // We set currentUser to null but keep loading false to show the login screen safely
        setCurrentUserState(null);
        currentUserRef.current = null;
      }
    } finally {
      console.log(`[AppContext] fetchUserProfile (ID: ${fetchId}): Finished.`);
      pendingProfileFetchRef.current.delete(supabaseId);
      setIsAuthLoading(false);
    }
    })();

    pendingProfileFetchRef.current.set(supabaseId, fetchPromise);
    return fetchPromise;
  }, [fetchData]);


  useEffect(() => {
    console.log("[AppContext] Root useEffect initializing...");
    let mounted = true;
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AppContext] Initial session check:", session ? "Session Active" : "No Session");
        
        // Load Preferences
        const [storedLng, storedDark, storedNotif, storedSync] = await Promise.all([
          AsyncStorage.getItem('user_language'),
          AsyncStorage.getItem('user_dark_mode'),
          AsyncStorage.getItem('user_notifications'),
          AsyncStorage.getItem('last_synced_timestamp')
        ]);
        
        if (storedLng) {
          setLanguageState(storedLng as 'en' | 'hi');
          const i18n = require('../services/i18n').default;
          i18n.changeLanguage(storedLng);
        }
        if (storedDark) setIsDarkModeState(storedDark === 'true');
        if (storedNotif) setNotificationsEnabledState(storedNotif === 'true');
        if (storedSync) setLastSynced(Number(storedSync));

        if (!mounted) return;
        if (session?.user) {
          console.log("[AppContext] init: Session found, triggering initial profile fetch.");
          await fetchUserProfile(session.user.id);
        } else {
          setIsAuthLoading(false);
          setLoaded(true);
        }
      } catch (e: any) {
        console.error("[AppContext] Initialization error:", e);
        if (e?.message?.includes("Invalid Refresh Token") || e?.code === 'refresh_token_not_found') {
          console.warn("[AppContext] Session expired/invalid. Forcing sign out.");
          await supabase.auth.signOut();
        }
        setIsAuthLoading(false);
      } finally {
        if (mounted) {
          setLoaded(true);
          console.log("[AppContext] Initialization complete (loaded=true)");
        }
      }
    }
    init();

    // Safety fallback: if app is still "loading" after 10 seconds, force loaded state
    const timer = setTimeout(() => {
      if (mounted && !loaded) {
        console.warn("[AppContext] Safety timeout: Force-setting loaded=true");
        setLoaded(true);
        setIsAuthLoading(false);
      }
    }, 10000);

    // 🛡️ Debounced Real-time Data Fetching (Prevent thundering herd)
    let syncTimer: any = null;
    const debouncedFetch = () => {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        if (mounted) fetchData({ forceSync: true });
      }, 1500); // 1.5s debounce for bulk updates
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AppContext] Auth State Change: ${event}`);
      if (!mounted) return;
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        const isSameUser = currentUserRef.current?.id === session.user.id;
        
        if (isSameUser && loaded) {
          console.log("[AppContext] Auth State Change: User matches current and data already loaded. Skipping disruptive fetch.");
          setIsAuthLoading(false);
          return;
        }
        
        console.log(`[AppContext] Role-based data fetch needed (Reason: ${event}), setting isAuthLoading=true`);
        setIsAuthLoading(true);
        await fetchUserProfile(session.user.id);
        setLoaded(true); // Ensure loaded is true after fetch
      } else if (event === 'SIGNED_OUT') {
        console.log("[AppContext] User signed out, clearing state and cache immediately");
        lastAuthUpdateRef.current = Date.now();
        
        // Clear main user state
        setCurrentUserState(null);
        currentUserRef.current = null;
        setSelectedCompanyIdState(null);
        
        // Clear all data collections
        setCompanies([]);
        setUsers([]);
        setSites([]);
        setComplaints([]);
        setNotifications([]);
        setProfileImageState(null);
        setSiteMetrics([]);
        setSupervisorMetrics([]);
        
        // 🛡️ Data Privacy: Purge all cached data from disk
        AsyncStorage.multiRemove([
          "cached_sites",
          "cached_complaints",
          "cached_site_metrics",
          "cached_supervisor_metrics",
          'last_synced_timestamp'
        ]).catch(err => console.warn("[AppContext] Cache purge error:", err));
        
        setIsAuthLoading(false);
        setLoaded(true);
      }
    });

    // Set up real-time subscription for complaints and founder metrics
    const mainChannel = supabase
      .channel('db-changes')
      .on('postgres_changes' as any, { event: '*', table: 'complaints' }, (payload: any) => {
        console.log("[AppContext] Realtime Complaint Change:", payload.eventType);
        if (payload.eventType === 'INSERT') {
          const c = payload.new;
          // Resolve names from currently loaded state for immediate UI feedback
          const s = sitesRef.current.find(s => s.id === c.site_id);
          const u = usersRef.current.find(u => u.id === c.client_id);
          const sup = usersRef.current.find(u => u.id === c.supervisor_id);

          const mapped = {
            id: c.id, description: c.description, status: c.status, priority: c.priority,
            category: c.category, companyId: c.company_id, siteId: c.site_id,
            siteName: s?.name,
            clientId: c.client_id, 
            clientName: u?.name,
            supervisorId: c.supervisor_id,
            supervisorName: sup?.name,
            beforeMediaUrl: c.before_media_url, afterMediaUrl: c.after_media_url,
            createdAt: c.created_at, startedAt: c.started_at, resolvedAt: c.resolved_at,
            images: c.images || [], rating: c.rating, ratingFeedback: c.rating_feedback, subcategory: c.subcategory,
            currentPhase: c.current_phase, phaseHistory: c.phase_history
          };
          setComplaints(prev => [mapped, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const c = payload.new;
          const s = sitesRef.current.find(s => s.id === c.site_id);
          const u = usersRef.current.find(u => u.id === c.client_id);
          const sup = usersRef.current.find(u => u.id === c.supervisor_id);

          const mapped = {
            id: c.id, description: c.description, status: c.status, priority: c.priority,
            category: c.category, companyId: c.company_id, siteId: c.site_id,
            siteName: s?.name,
            clientId: c.client_id, 
            clientName: u?.name,
            supervisorId: c.supervisor_id,
            supervisorName: sup?.name,
            beforeMediaUrl: c.before_media_url, afterMediaUrl: c.after_media_url,
            createdAt: c.created_at, startedAt: c.started_at, resolvedAt: c.resolved_at,
            images: c.images || [], rating: c.rating, ratingFeedback: c.rating_feedback, subcategory: c.subcategory,
            currentPhase: c.current_phase, phaseHistory: c.phase_history
          };
          setComplaints(prev => prev.map(item => item.id === c.id ? mapped : item));
        } else if (payload.eventType === 'DELETE') {
          setComplaints(prev => prev.filter(item => item.id === payload.old.id));
        }
      })
      .on('postgres_changes' as any, { event: '*', table: 'sites' }, (payload: any) => {
        console.log("[AppContext] Realtime Site Change:", payload.eventType);
        if (payload.eventType === 'DELETE') {
          setSites(prev => prev.filter(s => s.id !== payload.old.id));
          return;
        }
        const s = payload.new;
        const mapped = {
          id: s.id, name: s.name, companyId: s.company_id, clientId: s.client_id || "",
          assignedSupervisorId: s.assigned_supervisor_id, address: s.address,
          clientName: s.client_name, clientPhone: s.client_phone, authorityName: s.authority_name,
          status: s.status || 'active'
        };
        if (payload.eventType === 'INSERT') {
          setSites(prev => [mapped, ...prev]);
        } else {
          setSites(prev => prev.map(item => item.id === s.id ? mapped : item));
        }
      })
      .on('postgres_changes' as any, { event: '*', table: 'users' }, (payload: any) => {
        console.log("[AppContext] Realtime User Change:", payload.eventType);
        if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== payload.old.id));
          return;
        }
        const u = payload.new;
        if (u.status === 'deleted') {
          setUsers(prev => prev.filter(item => item.id !== u.id));
          return;
        }
        const mapped = {
          ...u,
          companyId: u.company_id,
          hasOnboarded: u.has_onboarded,
          notificationsEnabled: u.notifications_enabled,
          displayId: u.display_id || `ID-${u.id.substring(0, 4).toUpperCase()}`
        };
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [...prev, mapped]);
        } else {
          setUsers(prev => prev.map(item => item.id === u.id ? mapped : item));
        }
      })
      .on('postgres_changes' as any, { event: '*', table: 'site_metrics' }, debouncedFetch)
      .on('postgres_changes' as any, { event: '*', table: 'system_logs' }, debouncedFetch)
      .on('postgres_changes' as any, { event: '*', table: 'supervisor_metrics' }, debouncedFetch)
      .on('postgres_changes' as any, { event: '*', table: 'system_settings' }, (payload: any) => {
        setSystemSettings(payload.new as SystemSettings);
      })
      .subscribe();
      
    return () => { 
      mounted = false; 
      clearTimeout(timer);
      if (syncTimer) clearTimeout(syncTimer);
      subscription.unsubscribe(); 
      mainChannel.unsubscribe();
    };
  }, []); // Only run once on mount

  const logout = useCallback(async () => {
    console.log("[AppContext] Initiating manual sign out...");
    setIsAuthLoading(true); // Show loader during sign out transition
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[AppContext] Sign out error:", e);
    } finally {
      // Emergency state clear if event doesn't fire
      setCurrentUserState(null);
      currentUserRef.current = null;
      setIsAuthLoading(false);
      setLoaded(true);
    }
  }, []); // End of mount effect / logout handler

  const logSystemEvent = useCallback(async (type: SystemLog['type'], message: string) => {
    const cid = currentUserRef.current?.companyId;
    if (!cid) return;
    try {
      await ApiService.logSystemEvent({
        company_id: cid,
        type,
        message
      });
    } catch (e) {
      console.warn('Logging silent failure:', e);
    }
  }, []);

  const signIn = useCallback(async (email: string, pass: string) => {
    console.log(`[AppContext] signIn calling for ${email}...`);
    setIsAuthLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        console.error("[AppContext] signIn error in Supabase:", error);
        throw error;
      }
      if (user) {
        console.log("[AppContext] signIn success, now fetching profile...");
        await fetchUserProfile(user.id);
        
        // 🚀 Ensure we only log success if profile was actually found or created
        setTimeout(() => {
           if (currentUserRef.current) {
             logSystemEvent('system', `${currentUserRef.current.name} signed into the platform.`);
           }
        }, 1500);
      } else {
        console.log("[AppContext] signIn: no user returned?");
        setIsAuthLoading(false);
      }
    } catch (e: any) {
      console.error("[AppContext] signIn unexpected error:", e);
      setIsAuthLoading(false);
      throw e;
    }
  }, [fetchUserProfile]);

  const signUp = useCallback(async (email: string, pass: string, name: string) => {
    setIsAuthLoading(true);
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name } }
    });
    if (error) {
      setIsAuthLoading(false);
      throw error;
    }
    // Note: Profile will be created by trigger or manually. 
    // This allows the user to at least get an Auth session.
    setIsAuthLoading(false);
    return user;
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const dbUpdates: any = { ...updates };
    if (updates.companyId) { dbUpdates.company_id = updates.companyId; delete dbUpdates.companyId; }
    if (updates.hasOnboarded !== undefined) { dbUpdates.has_onboarded = updates.hasOnboarded; delete dbUpdates.hasOnboarded; }
    if (updates.displayId) { dbUpdates.display_id = updates.displayId; delete dbUpdates.displayId; }

    await ApiService.updateUser(id, dbUpdates);

    if (currentUserRef.current?.id === id) {
      const updatedUser = { ...currentUserRef.current, ...updates };
      setCurrentUserState(updatedUser);
      currentUserRef.current = updatedUser;
    }
    await fetchData({ forceSync: true });
  }, [fetchData]);

  const completeOnboarding = useCallback(async () => {
    if (!currentUserRef.current) return;
    await updateUser(currentUserRef.current.id, { hasOnboarded: true });
  }, [updateUser]);

  const createCompany = useCallback(async (name: string, adminDetails?: { name: string, email: string, pass: string, phone: string }) => {
    const { data: newCompany, error: compError } = await supabase.from("companies").insert({ name }).select().single();
    if (compError) throw compError;
    if (adminDetails) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminDetails.email, password: adminDetails.pass,
        options: { data: { name: adminDetails.name, role: "founder" } }
      });
      if (authError) throw authError;
      if (authData.user) {
        await supabase.from("users").insert([{
          supabase_id: authData.user.id, name: adminDetails.name, phone: adminDetails.phone,
          role: "founder", company_id: newCompany.id, status: "active",
          display_id: `FND-${Math.floor(100 + Math.random() * 900)}`
        }]);
      }
    }
    await fetchData({ forceSync: true });
  }, [fetchData]);

  const resetUserPassword = useCallback(async (userId: string, newPassword: string) => {
    console.log(`[AppContext] resetUserPassword: Initiating for user=${userId}`);
    const { data, error } = await supabase.rpc('admin_reset_supervisor_password', { 
      target_user_id: userId, 
      new_password: newPassword 
    });
    
    if (error) {
       console.error("[AppContext] resetUserPassword Failed:", error);
       throw error;
    }
    
    console.log("[AppContext] resetUserPassword: Success.");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return data;
  }, []);

  const createSite = useCallback(async (data: any) => {
    console.log("[AppContext] createSite: STARTING with data:", data);
    
    const finalCompanyId = data.companyId || currentUserRef.current?.companyId;
    
    if (!finalCompanyId) {
      console.error("[AppContext] createSite: FAILED - Missing companyId!");
      throw new Error("Company ID is required to create a site. Please select an organization.");
    }

    console.log("[AppContext] createSite: Inserting into Supabase...");
    
    // Check supervisor site limit (max 5)
    if (data.supervisorId) {
      const assignedCount = sites.filter(s => s.assignedSupervisorId === data.supervisorId).length;
      if (assignedCount >= 5) {
        throw new Error("This supervisor already has 5 assigned sites (maximum limit reached).");
      }
    }

    const newSite = await ApiService.createSite({
      name: data.name, 
      company_id: finalCompanyId, 
      assigned_supervisor_id: data.supervisorId || null,
      address: data.address || null, 
      client_name: data.clientName || null,
      client_phone: data.clientPhone || null, 
      authority_name: data.authorityName || null,
      phone: data.phone || null,
      logo_url: data.logoUrl || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      radius_meters: data.radiusMeters || 500
    });

    console.log("[AppContext] createSite: INSERT SUCCESS. ID:", newSite.id);
    logSystemEvent('system', `New site registered: ${data.name}`);
    console.log("[AppContext] createSite: Triggering fetchData()...");
    await fetchData({ forceSync: true });
    console.log("[AppContext] createSite: fetchData COMPLETE. Returning site.");
    return newSite;
  }, [fetchData, sites]);

  const updateSite = useCallback(async (id: string, updates: Partial<Site>) => {
    console.log(`[AppContext] updateSite: Starting for site=${id}`, updates);
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.clientPhone !== undefined) dbUpdates.client_phone = updates.clientPhone;
    if (updates.authorityName !== undefined) dbUpdates.authority_name = updates.authorityName;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.radiusMeters !== undefined) dbUpdates.radius_meters = updates.radiusMeters;

    // Check supervisor site limit if changing assignment
    if (updates.assignedSupervisorId) {
      const assignedCount = sites.filter(s => s.assignedSupervisorId === updates.assignedSupervisorId && s.id !== id).length;
      if (assignedCount >= 5) {
        throw new Error("This supervisor already has 5 assigned sites (maximum limit reached).");
      }
      dbUpdates.assigned_supervisor_id = updates.assignedSupervisorId;
    } else if (updates.assignedSupervisorId === null) {
      dbUpdates.assigned_supervisor_id = null;
    }

    await ApiService.updateSite(id, dbUpdates);
    
    console.log(`[AppContext] updateSite: Success, refreshing...`);
    await fetchData({ forceSync: true });
  }, [fetchData, sites]);

  const createSupervisor = useCallback(async (email: string, pass: string, name: string, phone: string, companyId?: string, siteIds?: string[]) => {
    const { createClient } = require("@supabase/supabase-js");
    const tempSupabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, role: "supervisor" } }
    });
    if (authError) throw authError;
    if (authData.user) {
      const newUser = await ApiService.createUserProfile({
        supabase_id: authData.user.id, name, phone, role: "supervisor",
        company_id: companyId || currentUserRef.current?.companyId, status: "active",
        display_id: `SUP-${Math.floor(100 + Math.random() * 900)}`
      });
      if (siteIds && siteIds.length > 0) {
        await Promise.all(siteIds.map(sid => ApiService.updateSite(sid, { assigned_supervisor_id: newUser.id })));
      }
      await fetchData({ forceSync: true });
    }
  }, [fetchData]);

  const deleteUser = useCallback(async (id: string) => {
    console.log(`[AppContext] deleteUser: STARTING delete sequence for user=${id}`);
    try {
      // 1. Attempt High-Speed Atomic Purge (RPC v2)
      console.log("[deleteUser] Attempting high-speed atomic purge (v2)...");
      const rpcPromise = supabase.rpc('purge_user_data_v2', { target_id: id });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("RPC_TIMEOUT")), 7000));

      try {
        const { error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
        if (error) throw error;
        console.log("[deleteUser] Atomic RPC purge SUCCESS.");
      } catch (purgeErr: any) {
        console.warn("[deleteUser] RPC failed or timed out. Initiating parallel manual unlinking fallback...");
        
        // 2. Manual Fallback: Parallel unlinking (with short timeout)
        try {
          await Promise.race([
            Promise.all([
              supabase.from("sites").update({ assigned_supervisor_id: null }).eq("assigned_supervisor_id", id),
              supabase.from("complaints").update({ supervisor_id: null }).eq("supervisor_id", id)
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error("MANUAL_UNLINK_TIMEOUT")), 5000))
          ]);
          console.log("[deleteUser] Manual unlinking SUCCESS.");
        } catch (unlinkErr) {
          console.warn("[deleteUser] Manual unlinking slow/failed, attempting direct DELETE bypass...");
        }

        // Final deletion of user record
        // Note: If user has run 'force-fix-constraints.sql', this will work instantly even if unlinking above failed.
        const { error: uError } = await supabase.from("users").delete().eq("id", id);
        if (uError) {
          console.error("[deleteUser] Final user deletion FAILED:", uError);
          throw uError;
        }
        console.log("[deleteUser] Deletion SUCCESS.");
      }
      
      console.log(`[deleteUser] Deletion sequence complete, refreshing data...`);
      await fetchData({ forceSync: true });
    } catch (e: any) {
      console.error("[AppContext] deleteUser fatal error:", e);
      throw e;
    }
  }, [fetchData]);

  const deleteAccount = useCallback(async () => {
    if (!currentUserRef.current) return;
    const uid = currentUserRef.current.id;
    console.log("[AppContext] deleteAccount: STARTING hard delete for self:", uid);
    
    setIsAuthLoading(true);
    try {
      // 🚀 HARD PURGE: Remove user profile permanently from 'users' table
      // Components will automatically react to auth state change when we sign out below
      await deleteUser(uid);
      
      console.log("[AppContext] deleteAccount: Profile purged, signing out...");
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[AppContext] deleteAccount fatal error:", e);
      Alert.alert("Error", "Account removal failed. Please try again or contact support.");
      throw e;
    } finally {
      setIsAuthLoading(false);
      setLoaded(true);
    }
  }, [deleteUser]);

  const uploadImage = useCallback(async (uri: string, path: string) => {
    // 📸 Optimization: Compress image before upload
    console.log("[uploadImage] Compressing image:", uri);
    const compressed = await compressImage(uri);
    
    const response = await fetch(compressed.uri);
    const blob = await response.blob();
    return await ApiService.uploadImage(path, blob);
  }, []);

  const provisionClient = useCallback(async (siteId: string, email: string, name: string, password?: string, photoUri?: string, companyId?: string) => {
    console.log(`[AppContext] provisionClient: STARTING for site=${siteId}, email=${email}`);
    try {
      let targetUserId: string;

      // 1. Check if user already exists
      console.log("[AppContext] provisionClient: Checking existing user...");
      const existingUser = await ApiService.fetchUserProfileByEmail(email.toLowerCase());

      if (existingUser) {
        console.log("[AppContext] provisionClient: Existing user found ID:", existingUser.id);
        targetUserId = existingUser.id;
      } else {
        console.log("[AppContext] provisionClient: No existing user. Creating new...");
        let authId: string | null = null;
        
        // 2. If password provided, sign up in Auth
        if (password) {
          console.log("[AppContext] provisionClient: Signing up in Supabase Auth...");
          const { createClient } = require("@supabase/supabase-js");
          const tempSupabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
          const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: { data: { name, role: "client" } }
          });
          if (authError) {
            console.error("[AppContext] provisionClient: Auth signup ERROR:", authError);
            throw authError;
          }
          authId = authData.user?.id || null;
          console.log("[AppContext] provisionClient: Auth signup SUCCESS ID:", authId);
        }

        // 3. Create User record
        console.log("[AppContext] provisionClient: Inserting user record...");
        const createdUser = await ApiService.createUserProfile({
            supabase_id: authId,
            email: email.toLowerCase(),
            name: name,
            role: "client",
            status: "active",
            company_id: companyId || currentUserRef.current?.companyId || null,
          });

        targetUserId = createdUser.id;
        console.log("[AppContext] provisionClient: User record SUCCESS ID:", targetUserId);
        
        // 4. Handle Photo if provided
        if (photoUri) {
          try {
             console.log("[AppContext] provisionClient: Uploading photo...");
             const publicUrl = await uploadImage(photoUri, `profiles/${targetUserId}_${Date.now()}.jpg`);
             console.log("[AppContext] provisionClient: Photo uploaded SUCCESS:", publicUrl);
             await AsyncStorage.setItem(`profileImage_${targetUserId}`, publicUrl);
          } catch (imgError) {
             console.error("[AppContext] provisionClient: Image upload failed:", imgError);
          }
        }
      }

      // 5. Link site to this client
      console.log("[AppContext] provisionClient: Linking site to client...");
      await ApiService.updateSite(siteId, { client_id: targetUserId });

      console.log("[AppContext] provisionClient: LINK SUCCESS. Refreshing data...");
      await fetchData({ forceLoading: true });
      console.log("[AppContext] provisionClient: ALL COMPLETE.");
    } catch (e: any) {
      console.error("[AppContext] provisionClient: UNEXPECTED ERROR:", e);
      throw e;
    }
  }, [currentUser, fetchData, uploadImage]);

  const deleteSite = useCallback(async (id: string) => {
    console.log(`[AppContext] deleteSite: Starting for site=${id}`);
    await ApiService.deleteSite(id);
    console.log(`[AppContext] deleteSite: Deletion successful, refreshing...`);
    await fetchData({ forceSync: true });
  }, [fetchData]);

  const deleteCompany = useCallback(async (id: string) => {
    console.log(`[AppContext] deleteCompany: Starting hard delete for company=${id}`);
    try {
      await ApiService.deleteCompany(id);
      console.log(`[AppContext] deleteCompany: Permanent removal success.`);
      
      // If the founder just deleted their own current company, what happens? 
      // Usually, they'd be redirected or have to select a new one.
      await fetchData({ forceSync: true });
    } catch (e: any) {
      console.error("[AppContext] deleteCompany error:", e);
      throw e;
    }
  }, [fetchData]);

  const getCompanyComplaints = useCallback((id: string) => complaints.filter(c => c.companyId === id), [complaints]);
  const getCompanySites = useCallback((id: string) => sites.filter(s => s.companyId === id), [sites]);
  const getCompanyUsers = useCallback((id: string) => users.filter(u => u.companyId === id && u.status !== 'deleted'), [users]);
  const getCompanyById = useCallback((id: string) => companies.find(c => c.id === id), [companies]);
  const getSiteById = useCallback((id: string) => sites.find(s => s.id === id), [sites]);
  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  const updateSystemSettings = useCallback(async (updates: Partial<SystemSettings>) => {
    const { error } = await supabase.from('system_settings').update({ ...updates, last_updated_at: new Date().toISOString() }).eq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  }, []);

  const reportAppIssue = useCallback(async (issue: Omit<AppIssue, 'id' | 'created_at' | 'status' | 'user_id'>) => {
    const { error } = await supabase.from('app_issues').insert({ 
      ...issue, 
      user_id: currentUser?.id,
      status: 'open',
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    if (currentUser?.role === 'founder') fetchData({ forceSync: true });
  }, [currentUser, fetchData]);

  const updateAppIssue = useCallback(async (id: string, updates: Partial<AppIssue>) => {
    const { error } = await supabase.from('app_issues').update(updates).eq('id', id);
    if (error) throw error;
    setAppIssues(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const broadcastNotification = useCallback(async (title: string, message: string, role?: Role) => {
    let query = supabase.from('users').select('id, expo_push_token, notifications_enabled');
    if (role) query = query.eq('role', role);
    const { data: targetUsers } = await query;
    
    if (targetUsers && targetUsers.length > 0) {
      const notifs = targetUsers.map(u => ({
        user_id: u.id,
        title,
        message,
        type: 'system',
        is_read: false,
        created_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('notifications').insert(notifs);
      if (error) throw error;

      // 🚀 Send Mass Remote Push Notification
      const pushTokens = targetUsers
        .filter(u => u.expo_push_token && u.notifications_enabled !== false && u.id !== currentUserRef.current?.id)
        .map(u => u.expo_push_token);

      if (pushTokens.length > 0) {
        NotificationService.sendRemotePushNotification(pushTokens, title, message, { broadcast: true });
      }
    }
  }, []);

  const addNotification = useCallback(async (userId: string, type: any, data: any) => {
    // 🎭 Get Professional Message based on Role
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    const { title, body } = getProfessionalNotification(targetUser.role, type, data);

    await ApiService.addNotification({ 
      user_id: userId, 
      title, 
      message: body, 
      type 
    });
    
    // 🔥 Send local notification if it's for the immediate user
    if (userId === currentUserRef.current?.id) {
      NotificationService.sendLocalNotification(title, body, data);
    } else if (targetUser.expo_push_token && targetUser.notificationsEnabled !== false) {
      // 🚀 Send Remote Push Notification to the target user's device
      NotificationService.sendRemotePushNotification([targetUser.expo_push_token], title, body, data);
    }
  }, [users]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    await ApiService.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

const addComplaint = useCallback(async (complaint: any) => {
    const dbComplaint = {
      company_id: complaint.companyId,
      site_id: complaint.siteId,
      client_id: complaint.clientId,
      supervisor_id: complaint.supervisorId,
      status: complaint.status,
      priority: complaint.priority,
      category: complaint.category,
      subcategory: complaint.subcategory || null,
      description: complaint.description,
      before_media_url: complaint.beforeMediaUrl,
      after_media_url: complaint.afterMediaUrl,
      started_at: complaint.startedAt,
      resolved_at: complaint.resolvedAt,
    };
    console.log("[addComplaint] Inserting complaint:", JSON.stringify(dbComplaint, null, 2));
    const newComplaint = await ApiService.addComplaint(dbComplaint);
    console.log("[addComplaint] Insert result - data:", newComplaint);
    
    // Notify Supervisor & Founder (non-blocking)
    try {
      const siteName = sites.find(s => s.id === newComplaint.site_id)?.name || 'Unknown Site';
      await NotificationManager.notifyNewComplaint(newComplaint, siteName);
    } catch (notifErr) {
      console.warn("[addComplaint] Notification failed (non-blocking):", notifErr);
    }

    console.log("[addComplaint] Complaint inserted successfully, refreshing data...");
    
    // 🪵 Log System Event
    try {
      await logSystemEvent('issue_created', `New ${newComplaint.category} issue reported for ${sites.find(s => s.id === newComplaint.site_id)?.name || 'Unknown Site'}`);
    } catch (logErr) { console.warn("[addComplaint] Event logging failed:", logErr); }

    await fetchData({ forceSync: true });
    console.log("[addComplaint] Done.");
  }, [fetchData, users, sites, logSystemEvent]);

  const updateComplaint = useCallback(async (id: string, updates: any) => {
    const dbUpdates: any = { ...updates };
    if (updates.companyId) { dbUpdates.company_id = updates.companyId; delete dbUpdates.companyId; }
    if (updates.siteId) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
    if (updates.clientId) { dbUpdates.client_id = updates.clientId; delete dbUpdates.clientId; }
    if (updates.supervisorId !== undefined) { dbUpdates.supervisor_id = updates.supervisorId; delete dbUpdates.supervisorId; }
    if (updates.beforeMediaUrl !== undefined) { dbUpdates.before_media_url = updates.beforeMediaUrl; delete dbUpdates.beforeMediaUrl; }
    if (updates.afterMediaUrl !== undefined) { dbUpdates.after_media_url = updates.afterMediaUrl; delete dbUpdates.afterMediaUrl; }
    if (updates.startedAt !== undefined) { dbUpdates.started_at = updates.startedAt; delete dbUpdates.startedAt; }
     if (updates.resolvedAt !== undefined) { dbUpdates.resolved_at = updates.resolvedAt; delete dbUpdates.resolvedAt; }
    if (updates.currentPhase !== undefined) { dbUpdates.current_phase = updates.currentPhase; delete dbUpdates.currentPhase; }
    if (updates.isAnonymous !== undefined) { dbUpdates.is_anonymous = updates.isAnonymous; delete dbUpdates.isAnonymous; }
    if (updates.anonymousName !== undefined) { dbUpdates.anonymous_name = updates.anonymousName; delete dbUpdates.anonymousName; }
    if (updates.floor !== undefined) { dbUpdates.floor = updates.floor; delete dbUpdates.floor; }
    if (updates.roomNumber !== undefined) { dbUpdates.room_number = updates.roomNumber; delete dbUpdates.roomNumber; }
    if (updates.phaseHistory !== undefined) { dbUpdates.phase_history = updates.phaseHistory; delete dbUpdates.phaseHistory; }

    const { error } = await supabase.from("complaints").update(dbUpdates).eq("id", id);
    if (error) throw error;
    
    // 🪵 Log System Events
    try {
      const c = complaints.find(comp => comp.id === id);
      const siteName = sites.find(s => s.id === c?.siteId)?.name || 'Unknown Site';
      
      if (updates.status === 'resolved') {
        await logSystemEvent('resolved', `Issue #${id.substring(0,6)} resolved at ${siteName}`);
        if (c && c.clientId) {
          await addNotification(c.clientId, 'complaint_resolved', { siteName, complaintId: id });
        }
      } else if (updates.supervisor_id !== undefined) {
          const sup = users.find(u => u.id === updates.supervisor_id);
          await logSystemEvent('assigned', `Supervisor ${sup?.name || 'Unassigned'} assigned to #${id.substring(0,6)} at ${siteName}`);
      }
    } catch (err) { console.warn("[updateComplaint] Event logging failed:", err); }

    await fetchData({ forceSync: true });
  }, [fetchData, complaints, addNotification, sites, users, logSystemEvent]);

  const updateComplaintPhase = useCallback(async (id: string, phase: string) => {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;

    const now = new Date().toISOString();
    const history = complaint.phaseHistory || [];
    const newHistory = [...history, { phase, timestamp: now }];

    // Prepare status update based on phase
    let statusUpdate: any = { current_phase: phase, phase_history: newHistory };
    if (phase === 'resolved') statusUpdate.status = 'resolved';
    if (['arrived', 'checking_issue', 'solving'].includes(phase)) {
      statusUpdate.status = 'in_progress';
    }
    if (phase === 'arrived' && !complaint.startedAt) statusUpdate.started_at = now;

    const { error } = await supabase.from('complaints').update(statusUpdate).eq('id', id);
    if (error) throw error;

    // Send Real-time Updates / Notifications
    try {
      const siteName = sites.find(s => s.id === complaint.siteId)?.name || 'your site';
      const updatedComplaint = { ...complaint, ...statusUpdate };
      
      if (phase === 'resolved') {
        await NotificationManager.notifyResolution(updatedComplaint, siteName);
      } else {
        // Handle intermediate phase updates
        const client = users.find(u => u.id === complaint.clientId);
        if (client) {
          const phaseLabels: Record<string, string> = {
            reported: 'Reported',
            arrived: 'Arrived at Site',
            checking_issue: 'Checking Issue',
            solving: 'Solving Issue'
          };
          const title = phaseLabels[phase] || 'Phase Update';
          const body = `Supervisor ${currentUserRef.current?.name || ''} updated status to: ${title}`;

          // Notify client specifically for phase changes
          await NotificationService.sendRemotePushNotification([client.expo_push_token as string], title, body, { complaint_id: id });
          // Also save history
          await ApiService.addNotification({ 
            user_id: client.id, 
            title, 
            message: body, 
            type: 'status_update',
            data: { complaint_id: id } 
          });
        }
      }
    } catch (err) {
      console.warn("[updateComplaintPhase] Notification failed:", err);
    }

    await fetchData({ forceSync: true });
  }, [complaints, users, sites, fetchData, logSystemEvent]);

  // 🚀 Commence Work: Supervisor starts working — notifies client & founders
  const commenceWork = useCallback(async (complaintId: string) => {
    // Now handled through standardized phase updates
    await updateComplaintPhase(complaintId, 'arrived');
  }, [updateComplaintPhase]);

  // 🚀 Update Complaint Phase: Granular tracking (Reported -> Assigned -> In Transit -> Arrived -> Action Taken -> Resolved)

  const assignSupervisorToSite = useCallback(async (siteId: string, supervisorId: string | null) => {
    if (supervisorId) {
      const assignedCount = sites.filter(s => s.assignedSupervisorId === supervisorId && s.id !== siteId).length;
      if (assignedCount >= 5) {
        throw new Error("This supervisor already has 5 assigned sites (maximum limit reached).");
      }
    }
    const { error } = await supabase.from("sites").update({ assigned_supervisor_id: supervisorId }).eq("id", siteId);
    if (error) throw error;
    
    if (supervisorId) {
      const siteName = sites.find(s => s.id === siteId)?.name || 'a site';
      await NotificationManager.notifyAssignment(siteId, supervisorId, siteName);
    }

    await fetchData({ forceSync: true });
  }, [fetchData, sites, users, addNotification, logSystemEvent]);

  const assignSupervisorToComplaint = useCallback(async (complaintId: string, supervisorId: string | null) => {
    const { error } = await supabase.from("complaints").update({ supervisor_id: supervisorId }).eq("id", complaintId);
    if (error) throw error;
    
    // Trigger phase update for granular tracking
    if (supervisorId) {
      await updateComplaintPhase(complaintId, 'assigned');
    }
  }, [updateComplaintPhase]);

  const deleteComplaint = useCallback(async (id: string) => {
    const c = complaints.find(comp => comp.id === id);
    await ApiService.deleteComplaint(id);
    
    // 🪵 Log System Event
    try {
      await logSystemEvent('system', `Complaint #${id.substring(0,6)} (${c?.category || 'Deleted'}) was permanently removed.`);
    } catch (err) { console.warn("[deleteComplaint] Event logging failed:", err); }

    await fetchData({ forceSync: true });
  }, [fetchData, complaints, logSystemEvent]);

  const setProfileImage = useCallback(async (uri: string | null) => {
    setProfileImageState(uri);
    if (uri && currentUserRef.current?.id) {
      await AsyncStorage.setItem(`profileImage_${currentUserRef.current.id}`, uri);
    } else if (currentUserRef.current?.id) {
      await AsyncStorage.removeItem(`profileImage_${currentUserRef.current.id}`);
    }
  }, []);

  const setLanguage = useCallback(async (lng: 'en' | 'hi') => {
    setLanguageState(lng);
    await AsyncStorage.setItem('user_language', lng);
    const i18n = require('../services/i18n').default;
    await i18n.changeLanguage(lng);
  }, []);

  const setIsDarkMode = useCallback(async (val: boolean) => {
    setIsDarkModeState(val);
    await AsyncStorage.setItem('user_dark_mode', String(val));
  }, []);

  const setNotificationsEnabled = useCallback(async (val: boolean) => {
    setNotificationsEnabledState(val);
    await AsyncStorage.setItem('user_notifications', String(val));
    
    // 🌐 Persist to Supabase in real-time
    if (currentUserRef.current?.id) {
      try {
        await supabase.from("users").update({ notifications_enabled: val }).eq("id", currentUserRef.current.id);
        console.log("[AppContext] Push notifications real-time toggle:", val ? "ENABLED" : "DISABLED");
      } catch (err) {
        console.error("[AppContext] Failed to sync notification toggle to DB:", err);
      }
    }
  }, []);

  const value = useMemo(() => ({
    currentUser,
    isAuthLoading,
    selectedCompanyId,
    companies,
    users,
    sites,
    complaints,
    setSelectedCompanyId: setSelectedCompanyIdState,
    addComplaint,
    updateComplaint,
    assignSupervisorToSite,
    getCompanyComplaints,
    getCompanySites,
    getCompanyUsers,
    getCompanyById,
    getSiteById,
    getUserById,
    logout,
    notifications,
    markNotificationAsRead,
    addNotification,
    refreshData: fetchData,
    signIn,
    signUp,
    createSupervisor,
    deleteUser,
    updateUser,
    completeOnboarding,
    createCompany,
    createSite,
    updateSite,
    assignSupervisorToComplaint,
    uploadImage,
    provisionClient,
    deleteComplaint,
    deleteSite,
    isLoading,
    profileImage,
     setProfileImage,
     siteMetrics,
     systemLogs,
     supervisorMetrics,
     logSystemEvent,
     language,
     setLanguage,
     isDarkMode,
     setIsDarkMode,
      notificationsEnabled,
      setNotificationsEnabled,
      lastSynced,
      loadMoreComplaints,
      loadMoreLogs,
      loadMoreUsers,
      loadMoreSites,
      systemSettings,
      updateSystemSettings,
      appIssues,
      reportAppIssue,
      updateAppIssue,
      broadcastNotification,
      commenceWork,
      updateComplaintPhase,
      deleteAccount,
      deleteCompany,
      resetUserPassword,
      loaded
   }), [
    currentUser, isAuthLoading, selectedCompanyId, companies, users, sites, complaints,
    setSelectedCompanyIdState, addComplaint, updateComplaint, assignSupervisorToSite,
    getCompanyComplaints, getCompanySites, getCompanyUsers, getCompanyById,
    getSiteById, getUserById, logout, notifications, markNotificationAsRead,
    addNotification, fetchData, signIn, signUp, createSupervisor, deleteUser,
    updateUser, completeOnboarding, createCompany, createSite, updateSite,
    assignSupervisorToComplaint, uploadImage, provisionClient, deleteComplaint,
     deleteSite, isLoading, profileImage, setProfileImage,
     siteMetrics, systemLogs, supervisorMetrics, logSystemEvent,
      language, setLanguage, isDarkMode, setIsDarkMode, notificationsEnabled, setNotificationsEnabled,
      lastSynced, loadMoreComplaints, loadMoreLogs, loadMoreUsers, loadMoreSites,
      systemSettings, appIssues, updateSystemSettings, reportAppIssue, updateAppIssue, broadcastNotification, commenceWork, updateComplaintPhase, deleteAccount, deleteCompany, resetUserPassword, loaded
   ]);

  if (!loaded) return <LoadingScreen />;

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
