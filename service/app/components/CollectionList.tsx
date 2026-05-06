import { type FC } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import type { MongoCollection } from '@/shared/types.js';

interface CollectionListProps {
  dbName: string;
  collections: MongoCollection[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEnter?: (index: number) => void;
  onBack?: () => void;
}

export const CollectionList: FC<CollectionListProps> = ({
  dbName,
  collections,
  selectedIndex,
  onSelect,
  onEnter,
  onBack,
}) => {
  const { stdout } = useStdout();

  useInput((value, key) => {
    if (key.upArrow || value === 'k') {
      onSelect(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || value === 'j') {
      onSelect(Math.min(collections.length - 1, selectedIndex + 1));
    } else if (key.return && onEnter) {
      onEnter(selectedIndex);
    } else if (value === 'h' && onBack) {
      onBack();
    }
  });

  const width = Math.min(stdout.columns - 4, 80);
  const maxRows = Math.max(stdout.rows - 9, 5);
  const visibleStart = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(maxRows / 2), Math.max(0, collections.length - maxRows))
  );
  const visibleEnd = Math.min(collections.length, visibleStart + maxRows);
  const visible = collections.slice(visibleStart, visibleEnd);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="yellow"
      width={width}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color="yellow">
          Collections
        </Text>
        <Text dimColor>db: {dbName}</Text>
      </Box>
      {collections.length === 0 ? (
        <Box justifyContent="center" paddingY={1}>
          <Text dimColor italic>(no collections in this database)</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {visible.map((coll, idx) => {
            const realIdx = visibleStart + idx;
            const selected = realIdx === selectedIndex;
            return (
              <Box key={coll.name}>
                <Text
                  color={selected ? 'black' : 'white'}
                  backgroundColor={selected ? 'yellow' : undefined}
                >
                  {selected ? '▶ ' : '  '}
                  {coll.name}
                  {coll.type && coll.type !== 'collection' ? ` [${coll.type}]` : ''}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>↑/k: up</Text>
        <Text dimColor>↓/j: down</Text>
        <Text dimColor>Enter: open</Text>
        <Text dimColor>h/Esc Esc: back</Text>
      </Box>
    </Box>
  );
};
