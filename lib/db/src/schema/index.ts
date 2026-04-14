import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const roleEnum = pgEnum("user_role", ["client", "supervisor", "founder"]);
export const statusEnum = pgEnum("complaint_status", ["pending", "in_progress", "resolved"]);
export const priorityEnum = pgEnum("complaint_priority", ["low", "medium", "high"]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseId: uuid("supabase_id").unique(), // Links to auth.users
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").default("client").notNull(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  clientId: uuid("client_id").references(() => users.id).notNull(),
  assignedSupervisorId: uuid("assigned_supervisor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  siteId: uuid("site_id").references(() => sites.id).notNull(),
  clientId: uuid("client_id").references(() => users.id).notNull(),
  supervisorId: uuid("supervisor_id").references(() => users.id),
  status: statusEnum("status").default("pending").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  beforeMediaUrl: text("before_media_url"),
  afterMediaUrl: text("after_media_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  resolvedAt: timestamp("resolved_at"),
});

// Zod Schemas
export const insertCompanySchema = createInsertSchema(companies);
export const selectCompanySchema = createSelectSchema(companies);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertSiteSchema = createInsertSchema(sites);
export const selectSiteSchema = createSelectSchema(sites);

export const insertComplaintSchema = createInsertSchema(complaints);
export const selectComplaintSchema = createSelectSchema(complaints);