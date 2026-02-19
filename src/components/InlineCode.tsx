import React from 'react';
import { Text } from 'ink';

interface InlineCodeProps {
  code: string;
}

export default function InlineCode({ code }: InlineCodeProps) {
  return <Text backgroundColor="#333333">{` ${code} `}</Text>;
}
