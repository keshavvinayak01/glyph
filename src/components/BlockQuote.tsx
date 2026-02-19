import React from 'react';
import { Box, Text } from 'ink';
import type { Token } from '../parser.js';
import { renderInlineTokens } from './Paragraph.js';

interface BlockQuoteProps {
  tokens: Token[];
}

export default function BlockQuote({ tokens }: BlockQuoteProps) {
  const content = tokens.map((token, i) => {
    if (token.type === 'paragraph' && 'tokens' in token && Array.isArray(token.tokens)) {
      return (
        <Text key={i} wrap="wrap" italic>
          {renderInlineTokens(token.tokens)}
        </Text>
      );
    }
    if ('text' in token) {
      return <Text key={i} italic>{(token as any).text}</Text>;
    }
    return null;
  });

  return (
    <Box
      borderStyle="bold"
      borderLeft
      borderRight={false}
      borderTop={false}
      borderBottom={false}
      borderColor="gray"
      paddingLeft={1}
      marginBottom={1}
    >
      <Box flexDirection="column">{content}</Box>
    </Box>
  );
}
