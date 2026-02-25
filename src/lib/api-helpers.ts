import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/** Standard API response wrapper */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

/** Standard API error response */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

/** Custom error for validation failures */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Parse and validate request body. Throws ValidationError on failure. */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new ValidationError(`Validation error: ${messages}`);
    }
    if (err instanceof SyntaxError) {
      throw new ValidationError("Invalid JSON body");
    }
    throw new ValidationError("Failed to parse request body");
  }
}

/** Extract search params from request URL */
export function getSearchParams(request: Request) {
  const url = new URL(request.url);
  return url.searchParams;
}
