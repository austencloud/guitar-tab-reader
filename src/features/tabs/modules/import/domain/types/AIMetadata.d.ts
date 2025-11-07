/**
 * AI metadata from smart import
 * Tracks AI model usage and responses
 */
export interface AIMetadata {
    model: string;
    inputTokens: number;
    outputTokens: number;
    rawResponse: string;
}
