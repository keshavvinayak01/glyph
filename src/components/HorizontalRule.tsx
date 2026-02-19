import React from 'react';
import { Text } from 'ink';

export default function HorizontalRule() {
  const width = process.stdout.columns || 80;
  return <Text dimColor>{'─'.repeat(width)}</Text>;
}
