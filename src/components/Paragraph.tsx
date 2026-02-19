import React from 'react';
import { Text, Box } from 'ink';
import type { Token } from '../parser.js';
import InlineCode from './InlineCode.js';
import Link from './Link.js';

interface ParagraphProps {
  tokens: Token[];
}

export function renderInlineTokens(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, i) => {
    switch (token.type) {
      case 'strong':
        return (
          <Text key={i} bold>
            {token.tokens ? renderInlineTokens(token.tokens) : token.text}
          </Text>
        );
      case 'em':
        return (
          <Text key={i} italic>
            {token.tokens ? renderInlineTokens(token.tokens) : token.text}
          </Text>
        );
      case 'del':
        return (
          <Text key={i} strikethrough>
            {token.tokens ? renderInlineTokens(token.tokens) : token.text}
          </Text>
        );
      case 'codespan':
        return <InlineCode key={i} code={token.text} />;
      case 'link':
        return <Link key={i} text={token.text} url={token.href} />;
      case 'image':
        return (
          <Text key={i} dimColor>
            [Image: {token.text || token.href}]
          </Text>
        );
      case 'br':
        return <Text key={i}>{'\n'}</Text>;
      case 'text':
        if ('tokens' in token && Array.isArray(token.tokens)) {
          return <Text key={i}>{renderInlineTokens(token.tokens)}</Text>;
        }
        return <Text key={i}>{token.text}</Text>;
      case 'escape':
        return <Text key={i}>{token.text}</Text>;
      default:
        if ('text' in token) {
          return <Text key={i}>{(token as any).text}</Text>;
        }
        return null;
    }
  });
}

export default function Paragraph({ tokens }: ParagraphProps) {
  return (
    <Box marginBottom={1}>
      <Text wrap="wrap">{renderInlineTokens(tokens)}</Text>
    </Box>
  );
}
