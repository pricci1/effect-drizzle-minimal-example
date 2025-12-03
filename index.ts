import { SqlClient } from "@effect/sql"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { DB, SqliteDrizzleLive } from "./db"
import { posts, users } from "./schema"

// Example 1: Using raw SQL client + Drizzle ORM together
const example1 = Effect.gen(function* () {
  console.log("\n=== Example 1: Raw SQL + Drizzle ORM ===")

  const sql = yield* SqlClient.SqlClient
  const db = yield* SqliteDrizzle.SqliteDrizzle

  // Create tables using raw SQL
  yield* sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER
    )
  `

  yield* sql`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `

  console.log("✓ Tables created")

  // Insert data using Drizzle ORM (type-safe)
  yield* db.insert(users).values([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" }
  ])

  console.log("✓ Users inserted")

  // Query users using Drizzle
  const allUsers = yield* db.select().from(users)
  console.log("Users:", allUsers)

  // Insert posts for the first user
  const firstUser = allUsers[0]
  if (firstUser) {
    yield* db.insert(posts).values([
      { userId: firstUser.id, title: "Hello World", content: "My first post!" },
      { userId: firstUser.id, title: "Effect is awesome", content: "Learning Effect and Drizzle" }
    ])
    console.log("✓ Posts inserted")
  }

  // Query posts with joins using Drizzle
  const allPosts = yield* db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      postContent: posts.content,
      userName: users.name,
      userEmail: users.email
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))

  console.log("Posts with users:", allPosts)

  // Use raw SQL for custom queries
  const userCount = yield* sql<{ count: number }>`SELECT COUNT(*) as count FROM users`
  console.log("Total users (raw SQL):", userCount[0]?.count)
})

// Example 2: Using the schema-aware service approach
const example2 = Effect.gen(function* () {
  console.log("\n=== Example 2: Schema-aware Service ===")

  const sql = yield* SqlClient.SqlClient
  const db = yield* DB

  // Create tables
  yield* sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER
    )
  `

  yield* sql`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `

  // Insert test data
  yield* db.insert(users).values([
    { name: "Charlie", email: "charlie@example.com" },
    { name: "Diana", email: "diana@example.com" }
  ])

  const allUsers = yield* db.select().from(users)
  const firstUser = allUsers[0]

  if (firstUser) {
    yield* db.insert(posts).values([
      { userId: firstUser.id, title: "Schema-aware queries", content: "Using Effect.Service pattern" },
      { userId: firstUser.id, title: "Type safety", content: "Full type inference with Drizzle" }
    ])
  }

  console.log("✓ Database setup complete")

  // Using the query API with schema knowledge
  const allUsersQuery = yield* db.query.users.findMany()
  console.log("All users:", allUsersQuery)

  // Query posts with select API
  const allPostsQuery = yield* db.select().from(posts)
  console.log("All posts:", allPostsQuery)
})

// Run both examples
const runExample1 = example1.pipe(Effect.provide(SqliteDrizzleLive))

const runExample2 = example2.pipe(
  Effect.provide(DB.Client)
)

// Execute examples sequentially
Effect.all([runExample1, runExample2], { concurrency: "unbounded" }).pipe(
  Effect.runPromise
).then(
  () => console.log("\n✓ All examples completed successfully!"),
  (error) => console.error("\n✗ Error:", error)
)
