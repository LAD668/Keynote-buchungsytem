---
name: security-review
description: Performs a structured security review with a comprehensive checklist (secrets, input validation, injection, authz/authn, XSS, CSRF, rate limiting, sensitive data exposure, dependency hygiene). Use when adding authentication, handling user input/uploads, creating API endpoints, working with secrets/credentials, integrating third-party APIs, or implementing payment/sensitive features.
---

# Security Review

Use this skill to identify common web app vulnerabilities and ensure changes follow security best practices.

## When to activate

- Implementing authentication or authorization
- Handling user input or file uploads
- Creating new API endpoints
- Working with secrets or credentials
- Implementing payment features
- Storing or transmitting sensitive data
- Integrating third-party APIs

## Output format

Provide findings grouped as:
- **Critical**: must fix before merge
- **High**: fix before release
- **Medium**: fix soon, acceptable with mitigation
- **Low**: polish / hardening

Each finding should include:
- what’s wrong
- where it is (file / function / route)
- concrete fix recommendation
- verification step (how to confirm it’s fixed)

## Checklist

### 1) Secrets management

#### ❌ Never do this

```typescript
const apiKey = "sk-proj-xxxxx"
const dbPassword = "password123"
```

#### ✅ Always do this

```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

if (!apiKey) {
  throw new Error("OPENAI_API_KEY not configured")
}
```

#### Verification

- [ ] No hardcoded API keys, tokens, or passwords
- [ ] All secrets in environment variables
- [ ] `.env.local` in `.gitignore`
- [ ] No secrets in git history
- [ ] Production secrets stored in hosting platform

### 2) Input validation

#### Always validate user input

```typescript
import { z } from "zod"

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
})

export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

#### File upload validation

```typescript
function validateFileUpload(file: File) {
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error("File too large (max 5MB)")
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type")
  }

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"]
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error("Invalid file extension")
  }

  return true
}
```

#### Verification

- [ ] All user inputs validated with schemas
- [ ] File uploads restricted (size, type, extension)
- [ ] No direct use of user input in queries
- [ ] Whitelist validation (not blacklist)
- [ ] Error messages don’t leak sensitive info

### 3) SQL injection prevention

#### ❌ Never concatenate SQL

```typescript
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

#### ✅ Always use parameterized queries

```typescript
const { data } = await supabase.from("users").select("*").eq("email", userEmail)

await db.query("SELECT * FROM users WHERE email = $1", [userEmail])
```

#### Verification

- [ ] All database queries use parameterized queries
- [ ] No string concatenation in SQL
- [ ] ORM/query builder used correctly

### 4) Authentication & authorization

#### Token storage

```typescript
localStorage.setItem("token", token)

res.setHeader(
  "Set-Cookie",
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
)
```

#### Authorization checks

```typescript
export async function deleteUser(userId: string, requesterId: string) {
  const requester = await db.users.findUnique({ where: { id: requesterId } })

  if (requester.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await db.users.delete({ where: { id: userId } })
}
```

#### Row level security (Supabase)

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### Verification

- [ ] Tokens stored in httpOnly cookies (not localStorage)
- [ ] Authorization checks before sensitive operations
- [ ] RLS enabled where applicable

### 5) XSS prevention

#### Sanitize user HTML

```typescript
import DOMPurify from "isomorphic-dompurify"

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p"],
    ALLOWED_ATTR: [],
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### Verification

- [ ] User-provided HTML sanitized
- [ ] No unvalidated dynamic HTML rendering

### 6) CSRF protection

#### Verification

- [ ] CSRF protection on state-changing operations (as applicable)
- [ ] Cookies use `SameSite=Strict` (or a justified alternative)

### 7) Rate limiting

#### Verification

- [ ] Rate limiting on API endpoints (especially auth + expensive operations)
- [ ] Stricter limits on sensitive endpoints (login, password reset)

### 8) Sensitive data exposure

#### Verification

- [ ] No passwords, tokens, or secrets in logs
- [ ] User-facing errors are generic; detailed info only in server logs
- [ ] No stack traces exposed to clients

### 9) Dependency security

#### Verification

- [ ] Lock files committed
- [ ] `npm audit` checked for known vulnerabilities
- [ ] Dependencies updated with a plan for breaking changes

## Pre-deployment checklist

- [ ] Secrets are only in env vars / secret manager
- [ ] Input validation is enforced at trust boundaries
- [ ] Authorization is checked server-side for every sensitive action
- [ ] User content can’t produce XSS
- [ ] No sensitive data leaks through errors/logging
- [ ] Dependencies reviewed for vulnerabilities

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Web Security Academy](https://portswigger.net/web-security)
