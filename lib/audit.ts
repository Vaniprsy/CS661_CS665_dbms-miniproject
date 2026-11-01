import { MongoClient } from "mongodb";

let client: MongoClient | undefined;
export async function writeAudit(event: { actorId: number; action: string; entity: string; entityId?: number; metadata?: object }) {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DATABASE) throw new Error("MongoDB audit logging is not configured");
  client ??= new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  await client.db(process.env.MONGODB_DATABASE).collection("audit_events").insertOne({ ...event, createdAt: new Date() });
}
export async function readAudit() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DATABASE) throw new Error("MongoDB audit logging is not configured");
  client ??= new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client.db(process.env.MONGODB_DATABASE).collection("audit_events").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
}
