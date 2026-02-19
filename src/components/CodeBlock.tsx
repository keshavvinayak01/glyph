import React from 'react';
import { Text, Box } from 'ink';
import { highlightCode } from '../utils/highlight.js';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const highlighted = highlightCode(code.replace(/\n$/, ''), language);
  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginBottom={1}
      flexDirection="column"
    >
      {language && (
        <Text dimColor italic>{language}</Text>
      )}
      <Text>{highlighted}</Text>
    </Box>
  );
}
