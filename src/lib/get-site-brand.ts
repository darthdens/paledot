import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";

import { brandFromHost, type SiteBrand } from "./site-brand";

// Server: read the address the visitor typed (so link previews get the right
// brand). Browser: read it from the current location.
export const getSiteBrand = createIsomorphicFn()
  .server((): SiteBrand => {
    const url = getRequestUrl();
    const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? url.host;
    return brandFromHost(host, url.search);
  })
  .client((): SiteBrand => brandFromHost(window.location.host, window.location.search));
