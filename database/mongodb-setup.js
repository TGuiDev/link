/**
 * MongoDB Setup & Indexes Script
 *
 * O aplicativo Link cria automaticamente os índices ao iniciar (`ensureMongoIndexes`).
 * Caso deseje criar manualmente via Mongo Shell ou MongoDB Compass:
 */

// 1. Coleção `links`
db.createCollection("links");
db.links.createIndex({ slug: 1 }, { unique: true });
db.links.createIndex({ userId: 1 });
db.links.createIndex({ createdAt: -1 });

// 2. Coleção `link_click_events`
db.createCollection("link_click_events");
db.link_click_events.createIndex({ linkId: 1 });
db.link_click_events.createIndex({ createdAt: -1 });

// 3. Coleção `users`
db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "accounts.provider": 1, "accounts.providerAccountId": 1 });

// 4. Coleção `app_stats`
db.createCollection("app_stats");
db.app_stats.updateOne(
  { _id: "global" },
  { $setOnInsert: { totalLinks: 0, updatedAt: new Date() } },
  { upsert: true }
);

print("Configuração de coleções e índices do MongoDB finalizada com sucesso!");
