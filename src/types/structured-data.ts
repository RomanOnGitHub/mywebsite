/**
 * Типы для Schema.org structured data
 */

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}
