import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";


// Create the handler with the new path
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter
});
