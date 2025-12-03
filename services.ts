import { Effect, Schema } from "effect"
import { DB } from "./db"
import { User, Post, UserInsert, PostInsert } from "./models"
import { users, posts } from "./schema"
import { eq } from "drizzle-orm"

export class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function* () {
    const db = yield* DB

    const createUser = (input: typeof UserInsert.Type) =>
      Effect.gen(function* () {
        yield* Schema.decodeUnknown(UserInsert)(input)

        const result = yield* db
          .insert(users)
          .values(input)
          .returning()

        const inserted = result[0]
        if (!inserted) {
          return yield* Effect.fail(new Error("Failed to insert user"))
        }

        return yield* Schema.decodeUnknown(User)(inserted)
      })

    const getUserById = (id: number) =>
      Effect.gen(function* () {
        const result = yield* db
          .select()
          .from(users)
          .where(eq(users.id, id))

        const first = result[0]
        if (!first) {
          return yield* Effect.fail(new Error(`User ${id} not found`))
        }

        return yield* Schema.decodeUnknown(User)(first)
      })

    const listUsers = Effect.gen(function* () {
      const results = yield* db.select().from(users)
      return yield* Effect.forEach(results, (item) => Schema.decodeUnknown(User)(item))
    })

    const updateUser = (id: number, input: Partial<typeof UserInsert.Type>) =>
      Effect.gen(function* () {
        const result = yield* db
          .update(users)
          .set(input)
          .where(eq(users.id, id))
          .returning()

        const updated = result[0]
        if (!updated) {
          return yield* Effect.fail(new Error(`User ${id} not found`))
        }

        return yield* Schema.decodeUnknown(User)(updated)
      })

    return { createUser, getUserById, listUsers, updateUser } as const
  })
}) {}

export class PostService extends Effect.Service<PostService>()("PostService", {
  effect: Effect.gen(function* () {
    const db = yield* DB

    const createPost = (input: typeof PostInsert.Type) =>
      Effect.gen(function* () {
        yield* Schema.decodeUnknown(PostInsert)(input)

        const result = yield* db
          .insert(posts)
          .values(input)
          .returning()

        const inserted = result[0]
        if (!inserted) {
          return yield* Effect.fail(new Error("Failed to insert post"))
        }

        return yield* Schema.decodeUnknown(Post)(inserted)
      })

    const getPostById = (id: number) =>
      Effect.gen(function* () {
        const result = yield* db
          .select()
          .from(posts)
          .where(eq(posts.id, id))

        const first = result[0]
        if (!first) {
          return yield* Effect.fail(new Error(`Post ${id} not found`))
        }

        return yield* Schema.decodeUnknown(Post)(first)
      })

    const getPostsByUserId = (userId: number) =>
      Effect.gen(function* () {
        const results = yield* db
          .select()
          .from(posts)
          .where(eq(posts.userId, userId))

        return yield* Effect.forEach(results, (item) => Schema.decodeUnknown(Post)(item))
      })

    const listPosts = Effect.gen(function* () {
      const results = yield* db.select().from(posts)
      return yield* Effect.forEach(results, (item) => Schema.decodeUnknown(Post)(item))
    })

    return { createPost, getPostById, getPostsByUserId, listPosts } as const
  })
}) {}
