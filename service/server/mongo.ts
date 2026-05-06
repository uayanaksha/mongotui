import { MongoClient, type Db } from 'mongodb';
import type { MongoDatabase, MongoCollection, MongoDocument } from '@/shared/types.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(uri: string): Promise<Db> {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    return db;
  } catch (error) {
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export async function getDatabases(): Promise<MongoDatabase[]> {
  if (!client) throw new Error('Not connected to MongoDB');

  try {
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    return result.databases.map(database => ({
      name: database.name,
      sizeOnDisk: database.sizeOnDisk,
      empty: database.empty
    }));
  } catch (error) {
    throw new Error(`Failed to list databases: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getCollections(dbName: string): Promise<MongoCollection[]> {
  if (!client) throw new Error('Not connected to MongoDB');

  try {
    const targetDb = client.db(dbName);
    const collections = await targetDb.listCollections().toArray();
    return collections.map(coll => ({
      name: coll.name,
      type: coll.type
    }));
  } catch (error) {
    throw new Error(`Failed to list collections: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getDocuments(dbName: string, collName: string, limit: number = 20, skip: number = 0): Promise<MongoDocument[]> {
  if (!client) throw new Error('Not connected to MongoDB');

  try {
    const targetDb = client.db(dbName);
    const collection = targetDb.collection(collName);
    const docs = await collection
      .find({})
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs.map(doc => ({
      ...doc,
      _id: String(doc._id)
    } as MongoDocument));
  } catch (error) {
    throw new Error(`Failed to fetch documents: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getDocumentCount(dbName: string, collName: string): Promise<number> {
  if (!client) throw new Error('Not connected to MongoDB');

  try {
    const targetDb = client.db(dbName);
    const collection = targetDb.collection(collName);
    return await collection.countDocuments();
  } catch (error) {
    throw new Error(`Failed to count documents: ${error instanceof Error ? error.message : String(error)}`);
  }
}
