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
}) {
  static Insert = User.pipe(Schema.omit("id", "createdAt"))
}

export const UserInsert = User.Insert;

export class Post extends Schema.Class<Post>("Post")({
  id: Schema.Number,
  userId: Schema.Number,
  title: Schema.NonEmptyString.pipe(
    Schema.minLength(1),
    Schema.maxLength(255)
  ),
  content: Schema.NullOr(Schema.String),
  createdAt: Schema.NullOr(DateFromSelf)
}) {
  static Insert = Post.pipe(Schema.omit("id", "createdAt"))
}

export const PostInsert = Post.Insert;

// derived from https://github.com/sindresorhus/type-fest
type Expect<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;
type IsAny<T> = 0 extends 1 & NoInfer<T> ? true : false;
export type ExtendsStrict<Left, Right, Message = false> =
	IsAny<Left | Right> extends true
		? true
		: IsNever<Left> extends true
			? IsNever<Right>
			: [Left] extends [Right]
				? true
				: Message;

type _test1 = Expect<ExtendsStrict<UserRow, User, "User schema mismatch">>
type _test2 = Expect<ExtendsStrict<PostRow, Post, "Post schema mismatch">>
