import React from 'react';
import { Box, Text } from 'ink';
import type { Token } from '../parser.js';
import { renderInlineTokens } from './Paragraph.js';

interface ListProps {
  ordered: boolean;
  start?: number;
  items: Array<{
    tokens: Token[];
    task?: boolean;
    checked?: boolean;
  }>;
  depth?: number;
}

function renderListItemContent(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, i) => {
    if (token.type === 'text' && 'tokens' in token && Array.isArray(token.tokens)) {
      return <Text key={i} wrap="wrap">{renderInlineTokens(token.tokens)}</Text>;
    }
    if (token.type === 'paragraph' && 'tokens' in token && Array.isArray(token.tokens)) {
      return <Text key={i} wrap="wrap">{renderInlineTokens(token.tokens)}</Text>;
    }
    if (token.type === 'list') {
      const listToken = token as any;
      return (
        <ListComponent
          key={i}
          ordered={listToken.ordered}
          start={listToken.start}
          items={listToken.items}
          depth={(listToken._depth || 0) + 1}
        />
      );
    }
    if ('text' in token) {
      return <Text key={i}>{(token as any).text}</Text>;
    }
    return null;
  });
}

function ListComponent({ ordered, start, items, depth = 0 }: ListProps) {
  const indent = '  '.repeat(depth);

  return (
    <Box flexDirection="column" marginBottom={depth === 0 ? 1 : 0}>
      {items.map((item, i) => {
        const bullet = ordered
          ? `${(start || 1) + i}. `
          : '• ';

        const checkbox = item.task
          ? (item.checked ? '[x] ' : '[ ] ')
          : '';

        return (
          <Box key={i} flexDirection="column">
            <Box>
              <Text>{indent}{bullet}{checkbox}</Text>
              <Box flexDirection="column">
                {renderListItemContent(item.tokens)}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default function List({ ordered, start, items, depth }: ListProps) {
  return <ListComponent ordered={ordered} start={start} items={items} depth={depth} />;
}
