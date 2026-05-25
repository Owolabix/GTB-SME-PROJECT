/** Allow browser calls from localhost UI to ngrok-backed API routes. */
export function withApiCors(request: Request, extra?: Record<string, string>): Record<string, string> {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
    ...extra,
  };
}
