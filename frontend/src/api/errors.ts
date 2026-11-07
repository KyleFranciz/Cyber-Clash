/** An error carrying the HTTP status, so callers can act on 409 vs 422 vs 404. */
export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, message?: string) {
    super(message ?? `${status} from ${path}`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

/**
 * Statuses that mean "this endpoint is not built yet" rather than "the server
 * answered and said no". Only these fall through to the mock; a 409 or 422 is
 * a real answer from a real backend and must surface.
 */
export const NOT_IMPLEMENTED_STATUSES = new Set([404, 405, 501, 502, 503]);

/**
 * Whether a failed response means the route is unavailable, so the mock should
 * answer instead.
 *
 * The awkward case is 500. When nothing is listening on the backend port, the
 * Vite dev proxy reports the connection failure as a plain-text 500 -- which
 * is the single most common state while a teammate's routes do not exist yet.
 * A real FastAPI error, by contrast, answers 500 with a JSON body. So a
 * non-JSON 500 is treated as "no backend", and a JSON 500 is a genuine server
 * error and is re-thrown.
 */
export function isEndpointUnavailable(status: number, contentType: string | null): boolean {
  if (NOT_IMPLEMENTED_STATUSES.has(status)) return true;
  return status === 500 && !(contentType ?? "").includes("json");
}
