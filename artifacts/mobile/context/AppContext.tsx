import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  role: Role;
  companyId: string;
}

export interface Site {
  id: string;
  name: string;
  companyId: string;
  clientId: string;
}

export interface Complaint {
  id: string;
  companyId: string;
  siteId: string;
  siteName: string;
  clientId: string;
  clientName: string;
  supervisorId: string | null;
  supervisorName: string | null;
  status: ComplaintStatus;
  beforeMediaUrl: string | null;
  afterMediaUrl: string | null;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  resolvedAt: string | null;
  startedAt: string | null;
}

interface AppContextType {
  currentUser: User | null;
  selectedCompanyId: string | null;
  companies: Company[];
  users: User[];
  sites: Site[];
  complaints: Complaint[];
  setCurrentUser: (user: User | null) => void;
  setSelectedCompanyId: (id: string) => void;
  addComplaint: (complaint: Omit<Complaint, "id" | "createdAt">) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  getCompanyComplaints: (companyId: string) => Complaint[];
  getCompanySites: (companyId: string) => Site[];
  getCompanyUsers: (companyId: string) => User[];
  getCompanyById: (id: string) => Company | undefined;
  getSiteById: (id: string) => Site | undefined;
  logout: () => void;
}

const STORAGE_KEYS = {
  CURRENT_USER: "gms_current_user",
  COMPANIES: "gms_companies",
  USERS: "gms_users",
  SITES: "gms_sites",
  COMPLAINTS: "gms_complaints",
  SELECTED_COMPANY: "gms_selected_company",
};

const SEED_COMPANIES: Company[] = [
  { id: "comp1", name: "TechCorp Industries" },
  { id: "comp2", name: "BuildMaster Ltd" },
];

const SEED_USERS: User[] = [
  {
    id: "u1",
    phone: "1001",
    name: "John Smith",
    role: "founder",
    companyId: "comp1",
  },
  {
    id: "u2",
    phone: "1002",
    name: "Sarah Connor",
    role: "client",
    companyId: "comp1",
  },
  {
    id: "u3",
    phone: "1003",
    name: "Mike Johnson",
    role: "supervisor",
    companyId: "comp1",
  },
  {
    id: "u4",
    phone: "2001",
    name: "Emma Davis",
    role: "founder",
    companyId: "comp2",
  },
  {
    id: "u5",
    phone: "2002",
    name: "David Lee",
    role: "client",
    companyId: "comp2",
  },
  {
    id: "u6",
    phone: "2003",
    name: "Lisa Park",
    role: "supervisor",
    companyId: "comp2",
  },
];

const SEED_SITES: Site[] = [
  { id: "s1", name: "Site Alpha - HQ", companyId: "comp1", clientId: "u2" },
  { id: "s2", name: "Site Beta - Warehouse", companyId: "comp1", clientId: "u2" },
  { id: "s3", name: "Site Gamma - Factory", companyId: "comp2", clientId: "u5" },
];

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "c1",
    companyId: "comp1",
    siteId: "s1",
    siteName: "Site Alpha - HQ",
    clientId: "u2",
    clientName: "Sarah Connor",
    supervisorId: "u3",
    supervisorName: "Mike Johnson",
    status: "resolved",
    beforeMediaUrl: null,
    afterMediaUrl: null,
    description: "HVAC system making loud noise in server room",
    category: "Maintenance",
    priority: "high",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    startedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "c2",
    companyId: "comp1",
    siteId: "s2",
    siteName: "Site Beta - Warehouse",
    clientId: "u2",
    clientName: "Sarah Connor",
    supervisorId: "u3",
    supervisorName: "Mike Johnson",
    status: "in_progress",
    beforeMediaUrl: null,
    afterMediaUrl: null,
    description: "Broken safety barrier near loading dock, urgent fix required",
    category: "Safety",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolvedAt: null,
    startedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "c3",
    companyId: "comp1",
    siteId: "s1",
    siteName: "Site Alpha - HQ",
    clientId: "u2",
    clientName: "Sarah Connor",
    supervisorId: null,
    supervisorName: null,
    status: "pending",
    beforeMediaUrl: null,
    afterMediaUrl: null,
    description: "Electrical outlet sparking on floor 3, east wing",
    category: "Electrical",
    priority: "high",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    resolvedAt: null,
    startedAt: null,
  },
  {
    id: "c4",
    companyId: "comp2",
    siteId: "s3",
    siteName: "Site Gamma - Factory",
    clientId: "u5",
    clientName: "David Lee",
    supervisorId: "u6",
    supervisorName: "Lisa Park",
    status: "pending",
    beforeMediaUrl: null,
    afterMediaUrl: null,
    description: "Leaking roof in section B, water pooling on floor",
    category: "Structural",
    priority: "medium",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolvedAt: null,
    startedAt: null,
  },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          storedUser,
          storedCompanies,
          storedUsers,
          storedSites,
          storedComplaints,
          storedSelectedCompany,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
          AsyncStorage.getItem(STORAGE_KEYS.COMPANIES),
          AsyncStorage.getItem(STORAGE_KEYS.USERS),
          AsyncStorage.getItem(STORAGE_KEYS.SITES),
          AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_COMPANY),
        ]);

        const loadedCompanies = storedCompanies
          ? JSON.parse(storedCompanies)
          : SEED_COMPANIES;
        const loadedUsers = storedUsers ? JSON.parse(storedUsers) : SEED_USERS;
        const loadedSites = storedSites ? JSON.parse(storedSites) : SEED_SITES;
        const loadedComplaints = storedComplaints
          ? JSON.parse(storedComplaints)
          : SEED_COMPLAINTS;

        if (!storedCompanies) await AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(SEED_COMPANIES));
        if (!storedUsers) await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
        if (!storedSites) await AsyncStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(SEED_SITES));
        if (!storedComplaints) await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(SEED_COMPLAINTS));

        setCompanies(loadedCompanies);
        setUsers(loadedUsers);
        setSites(loadedSites);
        setComplaints(loadedComplaints);

        if (storedUser) setCurrentUserState(JSON.parse(storedUser));
        if (storedSelectedCompany) setSelectedCompanyIdState(storedSelectedCompany);
      } catch (e) {
        console.error("Error loading data", e);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const setCurrentUser = useCallback(async (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      setSelectedCompanyIdState(user.companyId);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY, user.companyId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, []);

  const setSelectedCompanyId = useCallback(async (id: string) => {
    setSelectedCompanyIdState(id);
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY, id);
  }, []);

  const addComplaint = useCallback(
    async (complaint: Omit<Complaint, "id" | "createdAt">) => {
      const newComplaint: Complaint = {
        ...complaint,
        id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newComplaint, ...complaints];
      setComplaints(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(updated));
    },
    [complaints]
  );

  const updateComplaint = useCallback(
    async (id: string, updates: Partial<Complaint>) => {
      const updated = complaints.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      setComplaints(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(updated));
    },
    [complaints]
  );

  const getCompanyComplaints = useCallback(
    (companyId: string) => complaints.filter((c) => c.companyId === companyId),
    [complaints]
  );

  const getCompanySites = useCallback(
    (companyId: string) => sites.filter((s) => s.companyId === companyId),
    [sites]
  );

  const getCompanyUsers = useCallback(
    (companyId: string) => users.filter((u) => u.companyId === companyId),
    [users]
  );

  const getCompanyById = useCallback(
    (id: string) => companies.find((c) => c.id === id),
    [companies]
  );

  const getSiteById = useCallback(
    (id: string) => sites.find((s) => s.id === id),
    [sites]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCurrentUserState(null);
    setSelectedCompanyIdState(null);
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        selectedCompanyId,
        companies,
        users,
        sites,
        complaints,
        setCurrentUser,
        setSelectedCompanyId,
        addComplaint,
        updateComplaint,
        getCompanyComplaints,
        getCompanySites,
        getCompanyUsers,
        getCompanyById,
        getSiteById,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
