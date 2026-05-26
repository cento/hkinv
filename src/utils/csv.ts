/**
 * CSV Export utility for invoices and customers.
 */

export function exportToCsv(filename: string, headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines: string[] = [];
  lines.push(headers.map(escape).join(','));
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }

  const bom = '\uFEFF';
  return bom + lines.join('\r\n');
}

export function formatDateForCsv(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr;
}
