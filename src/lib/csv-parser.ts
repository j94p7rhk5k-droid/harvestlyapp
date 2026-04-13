export interface ParsedFile {
  name: string;
  type: 'csv' | 'pdf' | 'image';
  content: string; // text for CSV, base64 for PDF/image
  mediaType?: string; // e.g. 'image/png', 'application/pdf'
}

/**
 * Parse a CSV: clean it up and cap at 100 rows for token limits.
 */
export function parseCSV(text: string): string {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return text;

  return lines
    .filter((line) => line.trim().length > 0)
    .slice(0, 100)
    .join('\n');
}

/**
 * Read a File as text (for CSV).
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Read a File as base64 data URL (for PDFs).
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get raw base64
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Process a File into a ParsedFile for the API.
 */
export async function processFile(file: File): Promise<ParsedFile> {
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (isPdf) {
    const base64 = await readFileAsBase64(file);
    return { name: file.name, type: 'pdf', content: base64, mediaType: 'application/pdf' };
  }

  if (isImage) {
    const base64 = await readFileAsBase64(file);
    return { name: file.name, type: 'image', content: base64, mediaType: file.type };
  }

  // CSV / text
  const text = await readFileAsText(file);
  return { name: file.name, type: 'csv', content: parseCSV(text) };
}
