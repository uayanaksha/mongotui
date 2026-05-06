import { useEffect, type FC } from 'react';
import { Box, Text } from 'ink';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  retryIn?: number;
}

export const ErrorScreen: FC<ErrorScreenProps> = ({ message, onRetry, retryIn = 4000 }) => {
  useEffect(() => {
    const timeout = setTimeout(onRetry, retryIn);
    return () => clearTimeout(timeout);
  }, [onRetry, retryIn]);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
      <Text bold color="red">
        ❌ Error
      </Text>
      <Box marginY={1}>
        <Text>{message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Retrying in {Math.ceil(retryIn / 1000)} second(s)...
        </Text>
      </Box>
    </Box>
  );
};
