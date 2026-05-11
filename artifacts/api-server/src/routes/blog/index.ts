import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { blogPostsTable, waitlistTable } from "@workspace/db";
import { requireAuth } from "../../lib/auth";

const router = Router();

function formatPost(p: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    author: p.author,
    category: p.category,
    tags: p.tags || [],
    status: p.status,
    published: p.published,
    readTime: p.readTime,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/blog/posts", async (req, res): Promise<void> => {
  const { published, category, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const conditions = [];
  if (published === "true") conditions.push(eq(blogPostsTable.published, true));
  if (category) conditions.push(eq(blogPostsTable.category, category));

  const posts = await db.select().from(blogPostsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(blogPostsTable.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  res.json(posts.map(formatPost));
});

router.post("/blog/posts", requireAuth, async (req, res): Promise<void> => {
  const { title, slug, excerpt, content, coverImageUrl, category, tags, published, seoTitle, seoDescription } = req.body;
  const readTime = content ? Math.ceil(content.split(" ").length / 200) : null;
  const user = (req as any).currentUser;

  const [post] = await db.insert(blogPostsTable).values({
    title, slug, excerpt, content, coverImageUrl, category, tags: tags || [],
    published: published || false,
    status: published ? "published" : "draft",
    readTime,
    seoTitle, seoDescription,
    author: user.name || user.email,
    publishedAt: published ? new Date() : undefined,
  }).returning();

  res.status(201).json(formatPost(post));
});

router.get("/blog/posts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const post = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, id)).then(r => r[0]);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatPost(post));
});

router.patch("/blog/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, excerpt, content, coverImageUrl, category, tags, published, seoTitle, seoDescription } = req.body;
  const readTime = content ? Math.ceil(content.split(" ").length / 200) : undefined;
  const [post] = await db.update(blogPostsTable).set({
    title, excerpt, content, coverImageUrl, category,
    tags: tags || undefined, published,
    status: published ? "published" : undefined,
    readTime, seoTitle, seoDescription,
    publishedAt: published ? new Date() : undefined,
  }).where(eq(blogPostsTable.id, id)).returning();
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatPost(post));
});

router.delete("/blog/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  res.sendStatus(204);
});

// Waitlist
router.post("/billing/waitlist", async (req, res): Promise<void> => {
  const { email, name, company } = req.body;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const existing = await db.select().from(waitlistTable).where(eq(waitlistTable.email, email)).then(r => r[0]);
  if (existing) { res.status(201).json({ id: existing.id, email: existing.email, name: existing.name, company: existing.company, position: existing.position, createdAt: existing.createdAt.toISOString() }); return; }

  const [{ count }] = await db.select({ count: eq(waitlistTable.id, waitlistTable.id) }).from(waitlistTable);
  const position = ((count as any) || 0) + 1;

  const [entry] = await db.insert(waitlistTable).values({ email, name, company, position }).returning();
  res.status(201).json({ id: entry.id, email: entry.email, name: entry.name, company: entry.company, position: entry.position, createdAt: entry.createdAt.toISOString() });
});

export default router;
