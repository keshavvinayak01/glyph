/**
 * Parse CSV content into a 2D array of strings.
 * Handles quoted fields, commas within quotes, and escaped quotes.
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split('\n');
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];

      if (inQuotes) {
        if (ch === '"') {
          // Check for escaped quote ""
          if (j + 1 < line.length && line[j + 1] === '"') {
            currentField += '"';
            j++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentField.trim());
          currentField = '';
        } else {
          currentField += ch;
        }
      }
    }

    if (inQuotes) {
      // Field spans multiple lines
      currentField += '\n';
    } else {
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    }
  }

  return rows;
}

/**
 * Convert CSV content into a markdown table string.
 */
export function csvToMarkdown(content: string): string {
  const rows = parseCsv(content);
  if (rows.length === 0) return '';

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const lines: string[] = [];

  // Header row
  lines.push('| ' + headers.join(' | ') + ' |');

  // Separator row
  lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');

  // Data rows
  for (const row of dataRows) {
    // Pad row to match header length
    const padded = headers.map((_, i) => row[i] ?? '');
    lines.push('| ' + padded.join(' | ') + ' |');
  }

  return lines.join('\n');
}
