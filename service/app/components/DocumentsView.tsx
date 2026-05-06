import { useEffect, useState, type FC } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import type { MongoDocument } from '@/shared/types.js';

interface DocumentsViewProps {
  dbName: string;
  collName: string;
  documents: MongoDocument[];
  selectedIndex: number;
  offset: number;
  pageSize?: number;
  onSelect: (index: number) => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  onBack?: () => void;
}

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + '…';

const formatDocument = (doc: MongoDocument): string => {
  try {
    return JSON.stringify(
      doc,
      (_key, value) => {
        if (typeof value === 'bigint') return value.toString();
        if (value instanceof Date) return value.toISOString();
        return value;
      },
      2
    );
  } catch {
    return String(doc);
  }
};

export const DocumentsView: FC<DocumentsViewProps> = ({
  dbName,
  collName,
  documents,
  selectedIndex,
  offset,
  pageSize = 20,
  onSelect,
  onPageUp,
  onPageDown,
  onBack,
}) => {
  const { stdout } = useStdout();
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');
  const [previewScrollY, setPreviewScrollY] = useState(0);
  const [previewScrollX, setPreviewScrollX] = useState(0);

  const totalCols = Math.max(stdout.columns - 2, 60);
  const totalRows = Math.max(stdout.rows - 2, 12);
  const listWidth = Math.max(20, Math.floor(totalCols * 0.3));
  const previewWidth = totalCols - listWidth - 2;

  const maxListRows = Math.max(totalRows - 6, 3);
  const visibleStart = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(maxListRows / 2), Math.max(0, documents.length - maxListRows))
  );
  const visibleEnd = Math.min(documents.length, visibleStart + maxListRows);
  const visibleDocs = documents.slice(visibleStart, visibleEnd);

  const selectedDoc = documents[selectedIndex];
  const previewLines = selectedDoc ? formatDocument(selectedDoc).split('\n') : ['(empty)'];
  const maxPreviewRows = Math.max(totalRows - 6, 3);
  const previewInnerWidth = Math.max(1, previewWidth - 4);
  const longestLine = previewLines.reduce((m, l) => Math.max(m, l.length), 0);
  const maxScrollY = Math.max(0, previewLines.length - maxPreviewRows);
  const maxScrollX = Math.max(0, longestLine - previewInnerWidth);

  const docKey = selectedDoc ? String(selectedDoc._id) : '';
  useEffect(() => {
    setPreviewScrollY(0);
    setPreviewScrollX(0);
  }, [docKey]);

  useInput((value, key) => {
    if (key.tab) {
      setActivePane((p) => (p === 'left' ? 'right' : 'left'));
      return;
    }
    if (activePane === 'left') {
      if (key.upArrow || value === 'k') {
        onSelect(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow || value === 'j') {
        onSelect(Math.min(documents.length - 1, selectedIndex + 1));
      } else if (key.pageUp && onPageUp) {
        onPageUp();
      } else if (key.pageDown && onPageDown) {
        onPageDown();
      } else if (value === 'h' && onBack) {
        onBack();
      }
    } else {
      if (key.upArrow || value === 'k') {
        setPreviewScrollY((y) => Math.max(0, y - 1));
      } else if (key.downArrow || value === 'j') {
        setPreviewScrollY((y) => Math.min(maxScrollY, y + 1));
      } else if (key.leftArrow || value === 'h') {
        setPreviewScrollX((x) => Math.max(0, x - 4));
      } else if (key.rightArrow || value === 'l') {
        setPreviewScrollX((x) => Math.min(maxScrollX, x + 4));
      }
    }
  });

  const safeScrollY = Math.min(previewScrollY, maxScrollY);
  const safeScrollX = Math.min(previewScrollX, maxScrollX);
  const visiblePreview = previewLines.slice(safeScrollY, safeScrollY + maxPreviewRows);
  const previewScrollable = maxScrollY > 0 || maxScrollX > 0;

  return (
    <Box flexDirection="column" width={totalCols} height={totalRows}>
      <Box justifyContent="space-between" paddingX={1}>
        <Text bold color="magenta">
          {dbName}.{collName}
        </Text>
        <Text dimColor>
          {documents.length === 0
            ? 'no documents'
            : `${offset + selectedIndex + 1} / ${offset + documents.length}+ (page size: ${pageSize})`}
        </Text>
      </Box>

      <Box flexGrow={1}>
        <Box
          flexDirection="column"
          width={listWidth}
          borderStyle="round"
          borderColor={activePane === 'left' ? 'magenta' : 'gray'}
          paddingX={1}
        >
          <Text bold color={activePane === 'left' ? 'magenta' : 'gray'}>Documents</Text>
          {documents.length === 0 ? (
            <Box paddingY={1}>
              <Text dimColor italic>(empty)</Text>
            </Box>
          ) : (
            visibleDocs.map((doc, idx) => {
              const realIdx = visibleStart + idx;
              const selected = realIdx === selectedIndex;
              const label = truncate(String(doc._id), listWidth - 6);
              return (
                <Box key={`${doc._id}-${realIdx}`}>
                  <Text
                    color={selected ? 'black' : 'white'}
                    backgroundColor={selected ? 'magenta' : undefined}
                  >
                    {selected ? '▶ ' : '  '}
                    {label}
                  </Text>
                </Box>
              );
            })
          )}
        </Box>

        <Box
          flexDirection="column"
          width={previewWidth}
          borderStyle="round"
          borderColor={activePane === 'right' ? 'cyan' : 'gray'}
          paddingX={1}
          marginLeft={1}
        >
          <Text bold color={activePane === 'right' ? 'cyan' : 'gray'}>Preview</Text>
          {visiblePreview.map((line, idx) => (
            <Text key={idx}>{line.slice(safeScrollX, safeScrollX + previewInnerWidth)}</Text>
          ))}
          {previewScrollable && (
            <Text dimColor italic>
              {`L ${safeScrollY + 1}-${Math.min(safeScrollY + maxPreviewRows, previewLines.length)}/${previewLines.length}${
                maxScrollX > 0
                  ? ` · C ${safeScrollX + 1}-${Math.min(safeScrollX + previewInnerWidth, longestLine)}/${longestLine}`
                  : ''
              }`}
            </Text>
          )}
        </Box>
      </Box>

      <Box justifyContent="space-between" paddingX={1}>
        <Text dimColor>
          {activePane === 'left' ? '↑/k ↓/j: scroll · PgUp/PgDn: page' : '↑/k ↓/j ←/h →/l: scroll'}
        </Text>
        <Text dimColor>Tab: switch pane</Text>
        <Text dimColor>{activePane === 'left' ? 'h/Esc Esc: back' : 'Esc Esc: back'}</Text>
      </Box>
    </Box>
  );
};
