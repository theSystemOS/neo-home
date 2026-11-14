export function route() {
  const raw = location.hash.replace(/^#/, "") || "/home";
  const [pathPart, queryPart] = raw.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  return {
    raw,
    path: `/${segments.join("/")}`,
    segments,
    query: new URLSearchParams(queryPart || ""),
  };
}

export function navigate(path) {
  const next = `#${path.startsWith("/") ? path : `/${path}`}`;
  if (location.hash === next) return;
  location.hash = next;
}

export function onRouteChange(listener) {
  addEventListener("hashchange", () => listener(route()));
}
