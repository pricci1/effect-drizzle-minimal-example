import { SqlClient } from "@effect/sql"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { DB, SqliteDrizzleLive } from "./db"
import { posts, users } from "./schema"
import { UserService, PostService } from "./services"
import { User, Post } from "./models"

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

// Example 3: Effect Schema integration with Drizzle
const example3 = Effect.gen(function* () {
  console.log("\n=== Example 3: Effect Schema + Business Logic ===")

  const sql = yield* SqlClient.SqlClient
  const userService = yield* UserService
  const postService = yield* PostService

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

  const user1 = yield* userService.createUser({
    name: "Alice Johnson",
    email: "alice@example.com"
  })

  console.log("✓ Created user:", user1)

  const result = yield* Effect.either(
    userService.createUser({
      name: "Bob",
      email: "invalid-email"
    })
  )

  if (result._tag === "Left") {
    console.log("✓ Email validation caught invalid format:", result.left.message)
  }

  const user2 = yield* userService.createUser({
    name: "Charlie Brown",
    email: "charlie@example.com"
  })

  const post1 = yield* postService.createPost({
    userId: user1.id,
    title: "Effect Schema Benefits",
    content: "Schema validation at compile and runtime!"
  })

  const post2 = yield* postService.createPost({
    userId: user1.id,
    title: "Type Safety",
    content: null
  })

  console.log("✓ Created posts:", [post1.title, post2.title])

  const allUsers = yield* userService.listUsers
  console.log(`✓ All users: ${allUsers.length} users`)

  const userPosts = yield* postService.getPostsByUserId(user1.id)
  console.log(`✓ Posts by ${user1.name}: ${userPosts.length} posts`)

  console.log("\n--- Schema Types ---")
  console.log("User fields:", Object.keys(User.fields))
  console.log("Post fields:", Object.keys(Post.fields))
})

// Run all examples
const runExample1 = example1.pipe(Effect.provide(SqliteDrizzleLive))

const runExample2 = example2.pipe(
  Effect.provide(DB.Client)
)

const runExample3 = example3.pipe(
  Effect.provide(UserService.Default),
  Effect.provide(PostService.Default),
  Effect.provide(DB.Client)
)

// Execute examples sequentially
Effect.runPromise(
  Effect.all([runExample1, runExample2, runExample3])
).then(
  () => console.log("\n✓ All examples completed successfully!"),
  (error: unknown) => console.error("\n✗ Error:", error)
)
