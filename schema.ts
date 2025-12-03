import * as D from "drizzle-orm/sqlite-core"

export const users = D.sqliteTable("users", {
  id: D.integer("id").primaryKey({ autoIncrement: true }),
  name: D.text("name").notNull(),
  email: D.text("email").notNull().unique(),
  createdAt: D.integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date())
})

export const posts = D.sqliteTable("posts", {
  id: D.integer("id").primaryKey({ autoIncrement: true }),
  userId: D.integer("user_id").notNull().references(() => users.id),
  title: D.text("title").notNull(),
  content: D.text("content"),
  createdAt: D.integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date())
})
