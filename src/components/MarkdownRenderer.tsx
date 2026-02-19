import React from 'react';
import { Box, Text } from 'ink';
import type { Token, Tokens } from '../parser.js';
import { getPlainText } from '../parser.js';
import Heading from './Heading.js';
import Paragraph from './Paragraph.js';
import CodeBlock from './CodeBlock.js';
import BlockQuote from './BlockQuote.js';
import List from './List.js';
import Table from './Table.js';
import HorizontalRule from './HorizontalRule.js';

interface MarkdownRendererProps {
  tokens: Tokens;
}

function renderToken(token: Token, index: number): React.ReactNode {
  switch (token.type) {
    case 'heading': {
      const text = getPlainText(token);
      return <Heading key={index} depth={token.depth as 1|2|3|4|5|6} text={text} />;
    }

    case 'paragraph':
      return <Paragraph key={index} tokens={token.tokens || []} />;

    case 'code':
      return <CodeBlock key={index} code={token.text} language={token.lang || undefined} />;

    case 'blockquote':
      return <BlockQuote key={index} tokens={token.tokens || []} />;

    case 'list': {
      const listToken = token as any;
      return (
        <List
          key={index}
          ordered={listToken.ordered}
          start={listToken.start}
          items={listToken.items.map((item: any) => ({
            tokens: item.tokens || [],
            task: item.task,
            checked: item.checked,
          }))}
        />
      );
    }

    case 'table': {
      const tableToken = token as any;
      const header = tableToken.header.map((cell: any) => getPlainText(cell));
      const rows = tableToken.rows.map((row: any[]) =>
        row.map((cell: any) => getPlainText(cell))
      );
      return <Table key={index} header={header} rows={rows} align={tableToken.align || []} />;
    }

    case 'hr':
      return <HorizontalRule key={index} />;

    case 'space':
      return <Text key={index}>{' '}</Text>;

    case 'html':
      return <Text key={index} dimColor>{(token as any).text}</Text>;

    default:
      if ('text' in token) {
        return <Text key={index}>{(token as any).text}</Text>;
      }
      return null;
  }
}

export default function MarkdownRenderer({ tokens }: MarkdownRendererProps) {
  return (
    <Box flexDirection="column">
      {tokens.map((token: Token, i: number) => renderToken(token, i))}
    </Box>
  );
}
