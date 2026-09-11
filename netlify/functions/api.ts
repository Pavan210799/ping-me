import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { app } from "../../server/index.ts";

const handle = serverless(app);

function requestPath(rawPath: string) {
  if (rawPath.startsWith("/api/") || rawPath === "/api" || rawPath.startsWith("/uploads/")) {
    return rawPath;
  }

  const stripped = rawPath.replace(/^\/\.netlify\/functions\/api\/?/, "");
  if (!stripped || stripped === "api") {
    return "/api";
  }
  if (stripped.startsWith("uploads/")) {
    return "/" + stripped;
  }
  if (stripped.startsWith("api/")) {
    return "/" + stripped;
  }
  return "/api/" + stripped;
}

export const handler: Handler = async (event, context) => {
  event.path = requestPath(event.path || "/");
  return handle(event, context);
};
