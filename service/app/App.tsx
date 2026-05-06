import { useState, useEffect, useRef, type FC } from 'react';
import { Box, useApp, useInput, useStdout } from 'ink';
import { URIInput } from '@/app/components/URIInput.js';
import { Loading } from '@/app/components/Loading.js';
import { ErrorScreen } from '@/app/components/ErrorScreen.js';
import { DatabaseList } from '@/app/components/DatabaseList.js';
import { CollectionList } from '@/app/components/CollectionList.js';
import { DocumentsView } from '@/app/components/DocumentsView.js';
import type { AppState } from '@/shared/types.js';
import {
  connectMongo,
  getDatabases,
  getCollections,
  getDocuments,
  disconnectMongo,
} from '@/server/mongo.js';
import { loadConfig, saveConfig, validateMongoURI } from '@/server/config.js';

const PAGE_SIZE = 20;

const useTerminalSize = () => {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    columns: stdout.columns ?? 80,
    rows: stdout.rows ?? 24,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({ columns: stdout.columns, rows: stdout.rows });
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  return size;
};

export const App: FC = () => {
  const { exit } = useApp();
  const { columns, rows } = useTerminalSize();
  const lastEscape = useRef<number>(0);
  const historyRef = useRef<AppState[]>([]);

  const [state, setState] = useState<AppState>(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      return { screen: 'loading', message: 'Connecting to MongoDB...' };
    }
    return { screen: 'mongo-uri-input' };
  });

  const handleExit = async () => {
    await disconnectMongo();
    exit();
  };

  const handleConnect = async (uri: string) => {
    if (!validateMongoURI(uri)) {
      setState({
        screen: 'mongo-uri-input',
        error: 'Invalid MongoDB URI. Must start with mongodb:// or mongodb+srv://',
      });
      return;
    }

    setState({ screen: 'loading', message: 'Connecting to MongoDB...' });

    try {
      await connectMongo(uri);
      saveConfig({ uri, timestamp: Date.now() });
      const databases = await getDatabases();
      historyRef.current = [];
      setState({ screen: 'databases', databases, selectedIndex: 0 });
    } catch (error) {
      setState({
        screen: 'error',
        message: error instanceof Error ? error.message : String(error),
        previousScreen: { screen: 'mongo-uri-input' },
      });
    }
  };

  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig && state.screen === 'loading') {
      void handleConnect(savedConfig.uri);
    }
  }, []);

  const handleDatabaseSelect = (index: number) => {
    if (state.screen === 'databases') {
      setState({ ...state, selectedIndex: index });
    }
  };

  const handleDatabaseEnter = async (index: number) => {
    if (state.screen !== 'databases') return;
    const db = state.databases[index];
    if (!db) return;

    const checkpoint: AppState = { ...state, selectedIndex: index };
    historyRef.current.push(checkpoint);
    setState({ screen: 'loading', message: `Loading collections from ${db.name}…` });

    try {
      const collections = await getCollections(db.name);
      setState({
        screen: 'collections',
        dbName: db.name,
        collections,
        selectedIndex: 0,
      });
    } catch (error) {
      setState({
        screen: 'error',
        message: error instanceof Error ? error.message : String(error),
        previousScreen: checkpoint,
      });
    }
  };

  const handleCollectionSelect = (index: number) => {
    if (state.screen === 'collections') {
      setState({ ...state, selectedIndex: index });
    }
  };

  const handleCollectionEnter = async (index: number) => {
    if (state.screen !== 'collections') return;
    const coll = state.collections[index];
    if (!coll) return;

    const checkpoint: AppState = { ...state, selectedIndex: index };
    historyRef.current.push(checkpoint);
    setState({ screen: 'loading', message: `Loading documents from ${coll.name}…` });

    try {
      const documents = await getDocuments(state.dbName, coll.name, PAGE_SIZE, 0);
      setState({
        screen: 'documents',
        dbName: state.dbName,
        collName: coll.name,
        documents,
        selectedIndex: 0,
        offset: 0,
      });
    } catch (error) {
      setState({
        screen: 'error',
        message: error instanceof Error ? error.message : String(error),
        previousScreen: checkpoint,
      });
    }
  };

  const handleDocumentSelect = (index: number) => {
    if (state.screen === 'documents') {
      setState({ ...state, selectedIndex: index });
    }
  };

  const fetchDocumentPage = async (snapshot: Extract<AppState, { screen: 'documents' }>, newOffset: number) => {
    setState({ screen: 'loading', message: 'Loading documents…' });
    try {
      const documents = await getDocuments(snapshot.dbName, snapshot.collName, PAGE_SIZE, newOffset);
      if (documents.length === 0 && newOffset > 0) {
        setState(snapshot);
        return;
      }
      setState({
        screen: 'documents',
        dbName: snapshot.dbName,
        collName: snapshot.collName,
        documents,
        selectedIndex: 0,
        offset: newOffset,
      });
    } catch (error) {
      setState({
        screen: 'error',
        message: error instanceof Error ? error.message : String(error),
        previousScreen: snapshot,
      });
    }
  };

  const handleDocumentPageUp = () => {
    if (state.screen !== 'documents') return;
    const newOffset = Math.max(0, state.offset - PAGE_SIZE);
    if (newOffset === state.offset) return;
    void fetchDocumentPage(state, newOffset);
  };

  const handleDocumentPageDown = () => {
    if (state.screen !== 'documents') return;
    void fetchDocumentPage(state, state.offset + PAGE_SIZE);
  };

  const handleErrorRetry = () => {
    if (state.screen === 'error') {
      setState(state.previousScreen);
    }
  };

  const navigateBack = async () => {
    const previous = historyRef.current.pop();
    if (previous) {
      setState(previous);
    } else {
      await handleExit();
    }
  };

  useInput((_value, key) => {
    if (!key.escape) return;
    const now = Date.now();
    if (now - lastEscape.current < 500) {
      lastEscape.current = 0;
      void navigateBack();
    } else {
      lastEscape.current = now;
    }
  });

  const renderScreen = () => {
    switch (state.screen) {
      case 'mongo-uri-input':
        return <URIInput error={state.error} onSubmit={handleConnect} />;
      case 'loading':
        return <Loading message={state.message} />;
      case 'error':
        return <ErrorScreen message={state.message} onRetry={handleErrorRetry} />;
      case 'databases':
        return (
          <DatabaseList
            databases={state.databases}
            selectedIndex={state.selectedIndex}
            onSelect={handleDatabaseSelect}
            onEnter={(idx) => void handleDatabaseEnter(idx)}
          />
        );
      case 'collections':
        return (
          <CollectionList
            dbName={state.dbName}
            collections={state.collections}
            selectedIndex={state.selectedIndex}
            onSelect={handleCollectionSelect}
            onEnter={(idx) => void handleCollectionEnter(idx)}
            onBack={() => void navigateBack()}
          />
        );
      case 'documents':
        return (
          <DocumentsView
            dbName={state.dbName}
            collName={state.collName}
            documents={state.documents}
            selectedIndex={state.selectedIndex}
            offset={state.offset}
            pageSize={PAGE_SIZE}
            onSelect={handleDocumentSelect}
            onPageUp={handleDocumentPageUp}
            onPageDown={handleDocumentPageDown}
            onBack={() => void navigateBack()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      width={columns}
      height={rows - 1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {renderScreen()}
    </Box>
  );
};
