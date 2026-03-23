export interface Metrics {
  ttft: number; // Time to first token (ms)
  totalLatency: number; // Total request-response time (ms)
  tokensPerSecond: number;
  tokenCount: number;
  interTokenLatencies: number[]; // ms between tokens
  completedAt: string;
}

export type RequestMode = 'chat' | 'observe' | 'benchmark';

export interface StoredRequest {
  id: number;
  mode: RequestMode;
  createdAt: string;
  contextHash: string | null;
  requestBody: any;
  responseBody: any;
  metrics: Metrics;
}

export interface Settings {
  targetUrl: string;
  targetApiKey: string;
}
