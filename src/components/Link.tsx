import React from 'react';
import { Text } from 'ink';

interface LinkProps {
  text: string;
  url: string;
}

export default function Link({ text, url }: LinkProps) {
  return (
    <Text>
      <Text color="blue" underline>{text}</Text>
      <Text dimColor>{` (${url})`}</Text>
    </Text>
  );
}
