import { useState, useEffect, type FC } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

interface URIInputProps {
  initialValue?: string;
  error?: string;
  onSubmit: (uri: string) => void;
}

export const URIInput: FC<URIInputProps> = ({ initialValue = '', error, onSubmit }) => {
  const { stdout } = useStdout();
  const [input, setInput] = useState(initialValue);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useInput((value, key) => {
    if (key.return) {
      onSubmit(input.trim());
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (key.ctrl && value === 'u') {
      setInput('');
    } else if (!key.ctrl && !key.meta && value && value.length > 0) {
      setInput(prev => prev + value);
    }
  });

  const width = Math.min(stdout.columns - 4, 80);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="cyan"
      width={width}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          MongoTUI — MongoDB Connection
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text>Paste your MongoDB URI below:</Text>
      </Box>
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>
          {input}
          <Text color="cyan">{cursorVisible ? '█' : ' '}</Text>
        </Text>
      </Box>
      {error && (
        <Box marginTop={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>Enter: connect</Text>
        <Text dimColor>Ctrl+U: clear</Text>
        <Text dimColor>Ctrl+C: exit</Text>
      </Box>
    </Box>
  );
};
