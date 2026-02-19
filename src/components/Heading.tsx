import React from 'react';
import { Text, Box } from 'ink';
import { renderFiglet } from '../utils/figlet.js';
import { headingStyles } from '../utils/theme.js';

interface HeadingProps {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export default function Heading({ depth, text }: HeadingProps) {
  if (depth === 1) {
    const ascii = renderFiglet(text);
    return (
      <Box flexDirection="column" marginY={1}>
        <Text bold color="cyan">{ascii}</Text>
      </Box>
    );
  }

  if (depth === 2) {
    return (
      <Box
        borderStyle="double"
        borderColor="green"
        paddingX={1}
        marginY={1}
      >
        <Text bold color="green">{text}</Text>
      </Box>
    );
  }

  const style = headingStyles[`h${depth}` as keyof typeof headingStyles];
  return (
    <Box marginY={1}>
      <Text {...style}>{text}</Text>
    </Box>
  );
}
