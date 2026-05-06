export interface MongoURIConfig {
  uri: string;
  timestamp: number;
}

export interface MongoDatabase {
  name: string;
  sizeOnDisk?: number;
  empty?: boolean;
}

export interface MongoCollection {
  name: string;
  type?: string;
}

export interface MongoDocument {
  _id: string;
  [key: string]: unknown;
}

export type AppState =
  | { screen: 'mongo-uri-input'; error?: string }
  | { screen: 'loading'; message: string }
  | { screen: 'databases'; databases: MongoDatabase[]; selectedIndex: number }
  | { screen: 'collections'; dbName: string; collections: MongoCollection[]; selectedIndex: number }
  | { screen: 'documents'; dbName: string; collName: string; documents: MongoDocument[]; selectedIndex: number; offset: number }
  | { screen: 'error'; message: string; previousScreen: AppState };
