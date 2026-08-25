import { MongoClient, Db, Collection, ObjectId } from "mongodb";

export type LinkDocument = {
  _id?: ObjectId;
  userId?: string | null;
  slug: string;
  url: string;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ClickEventDocument = {
  _id?: ObjectId;
  linkId: string;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type UserAccount = {
  provider: "google" | "github" | "discord";
  providerAccountId: string;
};

export type UserDocument = {
  _id?: ObjectId;
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  accounts?: UserAccount[];
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AppStatsDocument = {
  _id: string; // 'global'
  totalLinks: number;
  updatedAt: Date;
};

const dbName = process.env.MONGODB_DB || "link";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClientPromise(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error("A variável de ambiente MONGODB_URI não está definida.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(process.env.MONGODB_URI);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(process.env.MONGODB_URI);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db(dbName);
}

export async function getLinksCollection(): Promise<Collection<LinkDocument>> {
  const db = await getDb();
  return db.collection<LinkDocument>("links");
}

export async function getClickEventsCollection(): Promise<Collection<ClickEventDocument>> {
  const db = await getDb();
  return db.collection<ClickEventDocument>("link_click_events");
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

export async function getAppStatsCollection(): Promise<Collection<AppStatsDocument>> {
  const db = await getDb();
  return db.collection<AppStatsDocument>("app_stats");
}

let indexesEnsured = false;

export async function ensureMongoIndexes(): Promise<void> {
  if (indexesEnsured) return;

  try {
    const db = await getDb();
    
    // Índices de links
    await db.collection("links").createIndex({ slug: 1 }, { unique: true });
    await db.collection("links").createIndex({ userId: 1 });

    // Índices de eventos
    await db.collection("link_click_events").createIndex({ linkId: 1 });
    await db.collection("link_click_events").createIndex({ createdAt: -1 });

    // Índices de usuários
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ "accounts.provider": 1, "accounts.providerAccountId": 1 });

    indexesEnsured = true;
  } catch (error) {
    console.error("Falha ao criar índices do MongoDB:", error);
  }
}
