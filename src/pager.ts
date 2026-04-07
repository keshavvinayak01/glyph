import { renderFullDocument, renderCsvTable, computeInitialColWidths } from './renderer.js';
import type { CsvData } from './renderer.js';
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

export function startPager(markdown: string, filePath?: string, csvData?: CsvData): void {
  // CSV interactive state
  const isCsv = !!csvData;
  let focusedCol: number | null = null;
  let colWidths: number[] = csvData ? computeInitialColWidths(csvData) : [];
  const RESIZE_STEP = 2;
  const MIN_COL_WIDTH = 3;

  function renderLines(): string[] {
    if (isCsv && csvData) {
      return renderCsvTable(csvData, colWidths, focusedCol);
    }
    return renderFullDocument(markdown);
  }

  let lines = renderLines();
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
      const csvHint = isCsv
        ? (focusedCol !== null
          ? ` | col ${focusedCol + 1}/${csvData!.headers.length}: "${csvData!.headers[focusedCol]}" | +/-:resize  Tab:next  0:reset`
          : ' | Tab/1-9:select col')
        : '';
      status = ` ${scrollOffset + 1}-${end}/${totalLines} (${scrollPercent}%) | j/k:scroll  /:search${editHint}${csvHint}  q:quit `;
    }

    // Inverse video for status bar, pad to full width
    const padded = status.padEnd(cols);
    output += `${CSI}7m${padded}${CSI}0m`;

    process.stdout.write(output);
  }

  function reloadFile() {
    if (!filePath) return;
    const content = fs.readFileSync(filePath, 'utf8');
    if (isCsv) {
      // For CSV, just re-render with current widths/focus
      lines = renderLines();
    } else {
      lines = renderFullDocument(content);
    }
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
    if (isCsv && csvData) {
      colWidths = computeInitialColWidths(csvData);
      lines = renderLines();
      totalLines = lines.length;
    }
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

    // CSV column controls
    if (isCsv && csvData) {
      const colCount = csvData.headers.length;
      let csvChanged = false;

      // Tab: cycle focus forward
      if (data === '\t') {
        focusedCol = focusedCol === null ? 0 : (focusedCol + 1) % colCount;
        csvChanged = true;
      }
      // Shift+Tab: cycle focus backward
      else if (data === '\x1b[Z') {
        focusedCol = focusedCol === null ? colCount - 1 : (focusedCol - 1 + colCount) % colCount;
        csvChanged = true;
      }
      // 1-9: jump to column
      else if (data >= '1' && data <= '9' && !searchQuery) {
        const col = parseInt(data) - 1;
        if (col < colCount) {
          focusedCol = col;
          csvChanged = true;
        }
      }
      // 0: reset widths and clear focus
      else if (data === '0' && !searchQuery) {
        focusedCol = null;
        colWidths = computeInitialColWidths(csvData);
        csvChanged = true;
      }
      // +/=: expand focused column (steal from neighbors)
      else if ((data === '+' || data === '=') && focusedCol !== null) {
        const totalBudget = colWidths.reduce((a, b) => a + b, 0);
        const maxW = csvData.naturalWidths[focusedCol];
        if (colWidths[focusedCol] < maxW) {
          colWidths[focusedCol] += RESIZE_STEP;
          // Shrink other columns to compensate
          let debt = RESIZE_STEP;
          for (let c = 0; c < colCount && debt > 0; c++) {
            if (c === focusedCol) continue;
            const shrink = Math.min(debt, colWidths[c] - MIN_COL_WIDTH);
            if (shrink > 0) {
              colWidths[c] -= shrink;
              debt -= shrink;
            }
          }
          if (debt > 0) colWidths[focusedCol] -= debt; // can't steal enough, undo
        }
        csvChanged = true;
      }
      // -: shrink focused column (give to neighbors)
      else if (data === '-' && focusedCol !== null) {
        if (colWidths[focusedCol] > MIN_COL_WIDTH) {
          const shrink = Math.min(RESIZE_STEP, colWidths[focusedCol] - MIN_COL_WIDTH);
          colWidths[focusedCol] -= shrink;
          // Distribute freed space to the narrowest columns
          let gift = shrink;
          // Sort other columns by width (ascending) to give to the most cramped
          const others = Array.from({ length: colCount }, (_, i) => i)
            .filter(i => i !== focusedCol)
            .sort((a, b) => colWidths[a] - colWidths[b]);
          for (const c of others) {
            if (gift <= 0) break;
            const give = Math.min(gift, Math.max(1, Math.floor(shrink / others.length)));
            colWidths[c] += give;
            gift -= give;
          }
          if (gift > 0) colWidths[others[0]] += gift;
        }
        csvChanged = true;
      }

      if (csvChanged) {
        lines = renderLines();
        totalLines = lines.length;
        if (searchQuery) computeMatches();
      }
    }

    render();
  });
}
