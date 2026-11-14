let revision = 0;
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function bump() {
  revision += 1;
  for (const listener of listeners) listener(revision);
}

export function revisionNumber() {
  return revision;
}
