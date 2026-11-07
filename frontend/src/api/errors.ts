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
