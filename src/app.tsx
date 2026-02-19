import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { renderFullDocument } from './renderer.js';

interface AppProps {
  markdown: string;
}

export default function App({ markdown }: AppProps) {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const termHeight = (stdout?.rows || 24) - 2;

  const renderedLines = useMemo(() => renderFullDocument(markdown), [markdown]);
  const totalLines = renderedLines.length;
  const maxScroll = Math.max(0, totalLines - termHeight);

  const visibleLines = renderedLines.slice(scrollOffset, scrollOffset + termHeight);

  const matchLineIndices = useMemo(() => {
    if (!searchQuery) return [];
    const indices: number[] = [];
    // Strip ANSI for matching
    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
    renderedLines.forEach((line, i) => {
      if (stripAnsi(line).toLowerCase().includes(searchQuery.toLowerCase())) {
        indices.push(i);
      }
    });
    return indices;
  }, [renderedLines, searchQuery]);

  useInput((input, key) => {
    if (searchMode) {
      if (key.return) {
        setSearchMode(false);
        setSearchQuery(searchInput);
        if (searchInput) {
          const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
          const idx = renderedLines.findIndex(l =>
            stripAnsi(l).toLowerCase().includes(searchInput.toLowerCase())
          );
          if (idx >= 0) setScrollOffset(Math.min(idx, maxScroll));
        }
        return;
      }
      if (key.escape) {
        setSearchMode(false);
        setSearchInput('');
        return;
      }
      if (key.backspace || key.delete) {
        setSearchInput(prev => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchInput(prev => prev + input);
      }
      return;
    }

    if (input === 'q') {
      process.exit(0);
    }

    if (input === '/') {
      setSearchMode(true);
      setSearchInput('');
      return;
    }

    if (key.upArrow || input === 'k') {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }

    if (key.downArrow || input === 'j') {
      setScrollOffset(prev => Math.min(maxScroll, prev + 1));
    }

    if (key.pageUp || input === 'b') {
      setScrollOffset(prev => Math.max(0, prev - termHeight));
    }

    if (key.pageDown || input === ' ') {
      setScrollOffset(prev => Math.min(maxScroll, prev + termHeight));
    }

    if (input === 'g') {
      setScrollOffset(0);
    }

    if (input === 'G') {
      setScrollOffset(maxScroll);
    }

    if (input === 'n' && searchQuery) {
      const nextMatch = matchLineIndices.find(idx => idx > scrollOffset);
      if (nextMatch !== undefined) {
        setScrollOffset(Math.min(nextMatch, maxScroll));
      } else if (matchLineIndices.length > 0) {
        setScrollOffset(Math.min(matchLineIndices[0], maxScroll));
      }
    }

    if (input === 'N' && searchQuery) {
      const prevMatches = matchLineIndices.filter(idx => idx < scrollOffset);
      if (prevMatches.length > 0) {
        setScrollOffset(Math.min(prevMatches[prevMatches.length - 1], maxScroll));
      } else if (matchLineIndices.length > 0) {
        setScrollOffset(Math.min(matchLineIndices[matchLineIndices.length - 1], maxScroll));
      }
    }
  });

  const scrollPercent = totalLines <= termHeight
    ? 100
    : Math.round((scrollOffset / maxScroll) * 100);

  const statusLine = searchMode
    ? `/${searchInput}`
    : searchQuery
      ? `"${searchQuery}" ${matchLineIndices.length} matches | n/N: next/prev | q: quit`
      : `${scrollOffset + 1}-${Math.min(scrollOffset + termHeight, totalLines)}/${totalLines} (${scrollPercent}%) | j/k:scroll /: search q:quit`;

  return (
    <Box flexDirection="column" height={termHeight + 2}>
      <Box flexDirection="column" height={termHeight} overflow="hidden">
        {visibleLines.map((line, i) => (
          <Text key={scrollOffset + i}>{line}</Text>
        ))}
      </Box>
      <Box>
        <Text inverse bold>{` ${statusLine} `}</Text>
      </Box>
    </Box>
  );
}
