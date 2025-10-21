// valueObject of requests: number, perMs: number, burst?: number

export interface RateLimitRule {
    requests: number;
    perMs: number;
    burst?: number;
}