import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "open",
  "reserved",
  "completed",
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  /** scrypt-encoded hash (`s1:saltHex:keyHex`); null until coordinator sets password */
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const streets = pgTable(
  "streets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("streets_campaign_idx").on(t.campaignId)],
);

export const assignments = pgTable(
  "assignments",
  {
    streetId: uuid("street_id")
      .primaryKey()
      .references(() => streets.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    status: assignmentStatusEnum("status").notNull().default("open"),
    reservedAt: timestamp("reserved_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("assignments_status_idx").on(t.status), index("assignments_user_idx").on(t.userId)],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type User = typeof users.$inferSelect;
export type Street = typeof streets.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentStatus = (typeof assignmentStatusEnum.enumValues)[number];
