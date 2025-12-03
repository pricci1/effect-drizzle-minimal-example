import { Schema } from "effect"
import type { users, posts } from "./schema"

type DrizzleInferSelect<T> = T extends { $inferSelect: infer S } ? S : never
type UserRow = DrizzleInferSelect<typeof users>
type PostRow = DrizzleInferSelect<typeof posts>

const DateFromSelf = Schema.DateFromSelf

export class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.NonEmptyString,
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ),
  createdAt: Schema.NullOr(DateFromSelf)
}) {}

export const UserInsert = Schema.Struct({
  name: Schema.NonEmptyString,
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ),
  createdAt: Schema.optional(Schema.NullOr(DateFromSelf))
})

export class Post extends Schema.Class<Post>("Post")({
  id: Schema.Number,
  userId: Schema.Number,
  title: Schema.NonEmptyString.pipe(
    Schema.minLength(1),
    Schema.maxLength(255)
  ),
  content: Schema.NullOr(Schema.String),
  createdAt: Schema.NullOr(DateFromSelf)
}) {}

export const PostInsert = Schema.Struct({
  userId: Schema.Number,
  title: Schema.NonEmptyString.pipe(
    Schema.minLength(1),
    Schema.maxLength(255)
  ),
  content: Schema.NullOr(Schema.String),
  createdAt: Schema.optional(Schema.NullOr(DateFromSelf))
})

type AssertUserCompatible = UserRow extends {
  id: number
  name: string
  email: string
  createdAt: Date | null
} ? true : "User schema mismatch"

type AssertPostCompatible = PostRow extends {
  id: number
  userId: number
  title: string
  content: string | null
  createdAt: Date | null
} ? true : "Post schema mismatch"

export type SchemaAssertions = AssertUserCompatible & AssertPostCompatible
