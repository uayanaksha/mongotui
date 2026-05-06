import { type FC } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import type { MongoDatabase } from '@/shared/types.js';

interface DatabaseListProps {
  databases: MongoDatabase[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEnter?: (index: number) => void;
}

export const DatabaseList: FC<DatabaseListProps> = ({
  databases,
  selectedIndex,
  onSelect,
  onEnter,
}) => {
  const { stdout } = useStdout();

  useInput((value, key) => {
    if (key.upArrow || value === 'k') {
      onSelect(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || value === 'j') {
      onSelect(Math.min(databases.length - 1, selectedIndex + 1));
    } else if (key.return && onEnter) {
      onEnter(selectedIndex);
    }
  });

  const width = Math.min(stdout.columns - 4, 80);
  const maxRows = Math.max(stdout.rows - 8, 5);
  const visibleStart = Math.max(0, Math.min(selectedIndex - Math.floor(maxRows / 2), databases.length - maxRows));
  const visibleEnd = Math.min(databases.length, visibleStart + maxRows);
  const visible = databases.slice(visibleStart, visibleEnd);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="green"
      width={width}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="green">
          Databases ({databases.length})
        </Text>
      </Box>
      <Box flexDirection="column">
        {visible.map((db, idx) => {
          const realIdx = visibleStart + idx;
          const selected = realIdx === selectedIndex;
          return (
            <Box key={db.name}>
              <Text
                color={selected ? 'black' : 'white'}
                backgroundColor={selected ? 'cyan' : undefined}
              >
                {selected ? '▶ ' : '  '}
                {db.name}
                {db.sizeOnDisk ? ` (${(db.sizeOnDisk / 1024 / 1024).toFixed(1)} MB)` : ''}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>↑/k: up</Text>
        <Text dimColor>↓/j: down</Text>
        <Text dimColor>Enter: select</Text>
        <Text dimColor>Esc Esc: exit</Text>
      </Box>
    </Box>
  );
};
