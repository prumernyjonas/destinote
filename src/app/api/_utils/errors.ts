import { NextResponse } from "next/server";

/**
 * Vytvoří standardizovanou error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  const body: any = { error: message };
  if (details && process.env.NODE_ENV === "development") {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Wrapper pro async funkce s timeoutem
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Request timeout"
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId;
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError" || err.message === errorMessage) {
      throw new Error(errorMessage);
    }
    throw err;
  }
}

/**
 * Wrapper pro fetch s timeoutem
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}
