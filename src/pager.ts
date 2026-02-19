import { renderFullDocument } from './renderer.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const ESC = '\x1b';
const CSI = `${ESC}[`;

// Alternate screen buffer
const enterAltScreen = `${CSI}?1049h`;
const exitAltScreen = `${CSI}?1049l`;
const hideCursor = `${CSI}?25l`;
const showCursor = `${CSI}?25h`;
const clearScreen = `${CSI}2J`;
const moveTo = (row: number, col: number) => `${CSI}${row + 1};${col + 1}H`;

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

export function startPager(markdown: string, filePath?: string): void {
  let lines = renderFullDocument(markdown);
  let totalLines = lines.length;

  let scrollOffset = 0;
  let searchMode = false;
  let searchInput = '';
  let searchQuery = '';
  let matchIndices: number[] = [];

  function getTermSize() {
    return {
      rows: process.stdout.rows || 24,
      cols: process.stdout.columns || 80,
    };
  }

  function computeMatches() {
    if (!searchQuery) {
      matchIndices = [];
      return;
    }
    matchIndices = [];
    const q = searchQuery.toLowerCase();
    lines.forEach((line, i) => {
      if (stripAnsi(line).toLowerCase().includes(q)) {
        matchIndices.push(i);
      }
    });
  }

  function render() {
    const { rows, cols } = getTermSize();
    const viewHeight = rows - 1; // 1 line for status bar
    const maxScroll = Math.max(0, totalLines - viewHeight);

    // Clamp scroll
    if (scrollOffset > maxScroll) scrollOffset = maxScroll;
    if (scrollOffset < 0) scrollOffset = 0;

    let output = moveTo(0, 0);

    // Render visible lines
    for (let i = 0; i < viewHeight; i++) {
      const lineIdx = scrollOffset + i;
      const line = lineIdx < totalLines ? lines[lineIdx] : '';
      // Truncate to terminal width (using plain length) and pad/clear to end of line
      output += line + `${CSI}K`;
      if (i < viewHeight - 1) output += '\n';
    }

    // Status bar on last row
    output += moveTo(rows - 1, 0);

    const scrollPercent = totalLines <= viewHeight
      ? 100
      : Math.round((scrollOffset / maxScroll) * 100);

    let status: string;
    if (searchMode) {
      status = `/${searchInput}`;
    } else if (searchQuery) {
      status = ` "${searchQuery}" ${matchIndices.length} matches | n/N:next/prev | q:quit `;
    } else {
      const end = Math.min(scrollOffset + viewHeight, totalLines);
      const editHint = filePath ? '  E:edit' : '';
      status = ` ${scrollOffset + 1}-${end}/${totalLines} (${scrollPercent}%) | j/k:scroll  /:search${editHint}  q:quit `;
    }

    // Inverse video for status bar, pad to full width
    const padded = status.padEnd(cols);
    output += `${CSI}7m${padded}${CSI}0m`;

    process.stdout.write(output);
  }

  function reloadFile() {
    if (!filePath) return;
    const content = fs.readFileSync(filePath, 'utf8');
    lines = renderFullDocument(content);
    totalLines = lines.length;
    const { rows } = getTermSize();
    const viewHeight = rows - 1;
    const maxScroll = Math.max(0, totalLines - viewHeight);
    if (scrollOffset > maxScroll) scrollOffset = maxScroll;
    if (searchQuery) computeMatches();
  }

  function openEditor() {
    if (!filePath) return;

    // Leave alt screen, restore terminal for vim
    process.stdout.write(showCursor + exitAltScreen);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }

    const editor = process.env.EDITOR || 'vim';
    spawnSync(editor, [filePath], { stdio: 'inherit' });

    // Re-enter pager: re-read file, re-render
    reloadFile();

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdout.write(enterAltScreen + hideCursor + clearScreen);
    render();
  }

  function cleanup() {
    process.stdout.write(showCursor + exitAltScreen);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  }

  // Enter alternate screen, hide cursor
  process.stdout.write(enterAltScreen + hideCursor + clearScreen);

  // Set up raw input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  render();

  process.stdout.on('resize', () => {
    process.stdout.write(clearScreen);
    render();
  });

  process.stdin.on('data', (data: string) => {
    const { rows } = getTermSize();
    const viewHeight = rows - 1;
    const maxScroll = Math.max(0, totalLines - viewHeight);

    if (searchMode) {
      if (data === '\r' || data === '\n') {
        // Enter: confirm search
        searchMode = false;
        searchQuery = searchInput;
        computeMatches();
        // Jump to first match
        if (matchIndices.length > 0) {
          scrollOffset = Math.min(matchIndices[0], maxScroll);
        }
        render();
        return;
      }
      if (data === '\x1b') {
        // Escape: cancel search
        searchMode = false;
        searchInput = '';
        render();
        return;
      }
      if (data === '\x7f' || data === '\b') {
        // Backspace
        searchInput = searchInput.slice(0, -1);
        render();
        return;
      }
      // Regular character
      if (data.length === 1 && data.charCodeAt(0) >= 32) {
        searchInput += data;
        render();
      }
      return;
    }

    // Ctrl+C or q: quit
    if (data === '\x03' || data === 'q') {
      cleanup();
      process.exit(0);
    }

    // E : open in editor
    if (data === 'E' && filePath) {
      openEditor();
      return;
    }

    // / : search
    if (data === '/') {
      searchMode = true;
      searchInput = '';
      render();
      return;
    }

    // Arrow keys are ESC sequences: ESC [ A (up), ESC [ B (down)
    if (data === '\x1b[A' || data === 'k') {
      scrollOffset = Math.max(0, scrollOffset - 1);
    } else if (data === '\x1b[B' || data === 'j') {
      scrollOffset = Math.min(maxScroll, scrollOffset + 1);
    } else if (data === '\x1b[5~' || data === 'b') {
      // Page Up
      scrollOffset = Math.max(0, scrollOffset - viewHeight);
    } else if (data === '\x1b[6~' || data === ' ') {
      // Page Down
      scrollOffset = Math.min(maxScroll, scrollOffset + viewHeight);
    } else if (data === 'g') {
      scrollOffset = 0;
    } else if (data === 'G') {
      scrollOffset = maxScroll;
    } else if (data === 'n' && searchQuery) {
      // Next match
      const next = matchIndices.find(idx => idx > scrollOffset);
      if (next !== undefined) {
        scrollOffset = Math.min(next, maxScroll);
      } else if (matchIndices.length > 0) {
        scrollOffset = Math.min(matchIndices[0], maxScroll);
      }
    } else if (data === 'N' && searchQuery) {
      // Previous match
      const prev = matchIndices.filter(idx => idx < scrollOffset);
      if (prev.length > 0) {
        scrollOffset = Math.min(prev[prev.length - 1], maxScroll);
      } else if (matchIndices.length > 0) {
        scrollOffset = Math.min(matchIndices[matchIndices.length - 1], maxScroll);
      }
    }

    render();
  });
}
