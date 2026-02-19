import React from 'react';
import { Box, Text } from 'ink';

interface TableProps {
  header: string[];
  rows: string[][];
  align: Array<'left' | 'center' | 'right' | null>;
}

export default function Table({ header, rows, align }: TableProps) {
  const colCount = header.length;
  const colWidths: number[] = [];

  for (let c = 0; c < colCount; c++) {
    let max = header[c].length;
    for (const row of rows) {
      if (row[c] && row[c].length > max) max = row[c].length;
    }
    colWidths.push(max);
  }

  function pad(text: string, width: number, alignment: 'left' | 'center' | 'right' | null): string {
    const diff = width - text.length;
    if (diff <= 0) return text;
    switch (alignment) {
      case 'right':
        return ' '.repeat(diff) + text;
      case 'center': {
        const left = Math.floor(diff / 2);
        return ' '.repeat(left) + text + ' '.repeat(diff - left);
      }
      default:
        return text + ' '.repeat(diff);
    }
  }

  const topBorder = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
  const midBorder = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
  const botBorder = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

  function renderRow(cells: string[], bold: boolean) {
    const content = cells.map((cell, c) =>
      ' ' + pad(cell, colWidths[c], align[c]) + ' '
    ).join('│');
    return bold
      ? <Text bold>│{content}│</Text>
      : <Text>│{content}│</Text>;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>{topBorder}</Text>
      {renderRow(header, true)}
      <Text>{midBorder}</Text>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          {renderRow(row, false)}
        </React.Fragment>
      ))}
      <Text>{botBorder}</Text>
    </Box>
  );
}
