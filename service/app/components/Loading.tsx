import { useState, useEffect, type FC } from 'react';
import { Box, Text } from 'ink';

interface LoadingProps {
  message?: string;
}

export const Loading: FC<LoadingProps> = ({ message = 'Loading...' }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const spinners = ['⠋', '⠙', '⠹', '⠸'];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan">{spinners[frame]} {message}</Text>
      </Box>
    </Box>
  );
};
