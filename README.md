# EffectTS SQL / Drizzle

Just trying out different approaches to SQL with EffectTS and Drizzle ORM.

## Approaches

- **Example 1**: Raw SQL + Drizzle ORM - uses both SqlClient for raw queries and Drizzle for type-safe operations
- **Example 2**: Schema-aware DB service - uses the DB service with `db.query` API for schema knowledge
- **Example 3**: Repository pattern with Effect Schema - adds validation and business logic layer

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
