import { SqlClient } from "@effect/sql"
import { SqliteClient } from "@effect/sql-sqlite-bun"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { Effect, Layer } from "effect"
import * as schema from "./schema"

// SQLite client layer using Bun's built-in SQLite
export const SqlClientLive = SqliteClient.layer({
  filename: ":memory:" // Use in-memory database, or specify a file path like "./test.db"
})

// Alternative: Use a file-based database
// export const SqlClientLive = SqliteClient.layer({
//   filename: "./test.db"
// })

// Drizzle ORM layer that depends on the SQL client
export const SqliteDrizzleLive = SqliteDrizzle.layer.pipe(
  Layer.provideMerge(SqlClientLive)
)

// Schema-aware service approach (alternative pattern)
export class DB extends Effect.Service<DB>()("DB", {
  effect: SqliteDrizzle.make({ schema })
}) {
  static Client = this.Default.pipe(Layer.provideMerge(SqlClientLive))
}
