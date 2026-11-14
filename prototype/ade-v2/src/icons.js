const paths = {
  home: '<path d="M3 9.5 10 3l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1Z"/>',
  decisions: '<path d="M10 2.6 17.4 10 10 17.4 2.6 10Z"/><path d="m7.3 10 1.9 1.9 3.6-3.8"/>',
  runs: '<rect x="2.8" y="4.5" width="14.4" height="11" rx="1.4"/><path d="m6.5 8 2.2 2-2.2 2M10.5 12h3.2"/>',
  agents: '<circle cx="7" cy="7" r="2.6"/><path d="M2.8 16.4c.4-2.8 2.1-4.3 4.2-4.3s3.8 1.5 4.2 4.3"/><circle cx="14.2" cy="8.2" r="2"/><path d="M12.8 16.4c.2-2.2 1.5-3.4 3.2-3.4 1.6 0 2.7 1.1 3 3.1"/>',
  projects: '<path d="m10 2.8 7 3.4-7 3.4-7-3.4Z"/><path d="m3 10 7 3.4 7-3.4M3 13.6l7 3.4 7-3.4"/>',
  evidence: '<path d="M10 2.6 16.4 5v4.7c0 4-2.7 6.7-6.4 7.7-3.7-1-6.4-3.7-6.4-7.7V5Z"/><path d="m6.9 9.8 2 2 4-4.2"/>',
  connections: '<path d="M7.2 12.8 4.8 15.2a2.6 2.6 0 0 1-3.7-3.7l2.4-2.4a2.6 2.6 0 0 1 3.7 0"/><path d="m12.8 7.2 2.4-2.4a2.6 2.6 0 0 1 3.7 3.7l-2.4 2.4a2.6 2.6 0 0 1-3.7 0"/><path d="m7.4 12.6 5.2-5.2"/>',
  search: '<circle cx="8.8" cy="8.8" r="5.2"/><path d="m12.6 12.6 4.2 4.2"/>',
  plus: '<path d="M10 4.2v11.6M4.2 10h11.6"/>',
  chevronDown: '<path d="m5.5 8 4.5 4.5L14.5 8"/>',
  chevronRight: '<path d="m8 5.5 4.5 4.5L8 14.5"/>',
  arrowLeft: '<path d="M16 10H4M8.5 5.5 4 10l4.5 4.5"/>',
  arrowRight: '<path d="M4 10h12M11.5 5.5 16 10l-4.5 4.5"/>',
  external: '<path d="M8 4H4v12h12v-4M11 4h5v5M16 4l-6 6"/>',
  check: '<path d="m4.5 10.2 3.3 3.3 7.7-8"/>',
  alert: '<path d="M10 3 18 17H2Z"/><path d="M10 8v4M10 14.6v.4"/>',
  clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4.4l2.8 1.6"/>',
  branch: '<circle cx="5.5" cy="5" r="1.8"/><circle cx="5.5" cy="15" r="1.8"/><circle cx="14.5" cy="7" r="1.8"/><path d="M5.5 6.8v6.4M7.3 5h4.2a1.2 1.2 0 0 1 1.2 1.2V7"/>',
  file: '<path d="M5 2.8h6l4 4V17H5Z"/><path d="M11 2.8v4.4h4"/>',
  terminal: '<rect x="2.8" y="3.8" width="14.4" height="12.4" rx="1.3"/><path d="m6.2 8 2.1 2-2.1 2M10.2 12h3.4"/>',
  cpu: '<rect x="5.5" y="5.5" width="9" height="9" rx="1"/><path d="M8.5 2.8v2.7M11.5 2.8v2.7M8.5 14.5v2.7M11.5 14.5v2.7M2.8 8.5h2.7M2.8 11.5h2.7M14.5 8.5h2.7M14.5 11.5h2.7"/>',
  link: '<path d="M8.2 11.8 11.8 8.2"/><path d="M6.6 13.4 4.9 15a2.6 2.6 0 0 1-3.7-3.7l1.7-1.7a2.6 2.6 0 0 1 3.7 0"/><path d="m13.4 6.6 1.7-1.7a2.6 2.6 0 0 1 3.7 3.7l-1.7 1.7a2.6 2.6 0 0 1-3.7 0"/>',
  lock: '<rect x="4.2" y="8.4" width="11.6" height="8.2" rx="1.2"/><path d="M6.6 8.4V6.2a3.4 3.4 0 0 1 6.8 0v2.2"/>',
  key: '<circle cx="6.5" cy="10" r="3.2"/><path d="M9.7 10h7.1M14.2 10v2.4M16.8 10v1.6"/>',
  refresh: '<path d="M16.2 10a6.2 6.2 0 1 1-1.8-4.4"/><path d="M16.6 3.4v4.2h-4.2"/>',
  copy: '<rect x="6.5" y="6.5" width="9.2" height="9.2" rx="1"/><path d="M4.3 12.6V4.3h8.3"/>',
  more: '<circle cx="5" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>',
  close: '<path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/>',
  panel: '<rect x="2.8" y="3.8" width="14.4" height="12.4" rx="1.3"/><path d="M12.8 3.8v12.4"/>',
  command: '<path d="M7.2 3.8A2.2 2.2 0 1 0 7.2 8.2h5.6a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0-2.2 2.2v8.2a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 0 0-2.2-2.2H7.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 2.2-2.2V5.8a2.2 2.2 0 0 0-2.2-2Z"/>',
  tour: '<circle cx="10" cy="10" r="7"/><path d="m8.2 7.8 5 2.2-5 2.2Z"/>',
  filter: '<path d="M3 5h14l-5.4 6.2V16l-3.2 1.4v-6.2Z"/>',
  flag: '<path d="M5 17V3.5c3.2-1.2 6.6 1.2 10 0V12c-3.4 1.2-6.8-1.2-10 0"/>',
  book: '<path d="M3.5 4.2c2.2-1 4.4-1 6.5.4v11.6c-2.1-1.4-4.3-1.4-6.5-.4Z"/><path d="M16.5 4.2c-2.2-1-4.4-1-6.5.4v11.6c2.1-1.4 4.3-1.4 6.5-.4Z"/>',
  globe: '<circle cx="10" cy="10" r="7"/><path d="M3.2 10h13.6M10 3c1.8 2 2.8 4.4 2.8 7s-1 5-2.8 7c-1.8-2-2.8-4.4-2.8-7s1-5 2.8-7Z"/>',
  database: '<ellipse cx="10" cy="4.8" rx="6.4" ry="2.2"/><path d="M3.6 4.8v10.4c0 1.2 2.9 2.2 6.4 2.2s6.4-1 6.4-2.2V4.8M3.6 10c0 1.2 2.9 2.2 6.4 2.2s6.4-1 6.4-2.2"/>',
  tool: '<path d="M12.3 3.4a4.2 4.2 0 0 0-5.2 5.2L3 12.7 7.3 17l4.1-4.1a4.2 4.2 0 0 0 5.2-5.2l-2.8 2.8-2.6-2.6Z"/>',
  message: '<path d="M3 4.5h14v9.2H9.2L5 17v-3.3H3Z"/>',
  user: '<circle cx="10" cy="7" r="3"/><path d="M3.8 17c.5-3.3 2.6-5 6.2-5s5.7 1.7 6.2 5"/>',
  activity: '<path d="M2.8 10h3l2-4.6 3.2 9.2 2.1-4.6h4.1"/>',
  grid: '<rect x="3" y="3" width="5.4" height="5.4" rx=".6"/><rect x="11.6" y="3" width="5.4" height="5.4" rx=".6"/><rect x="3" y="11.6" width="5.4" height="5.4" rx=".6"/><rect x="11.6" y="11.6" width="5.4" height="5.4" rx=".6"/>',
  list: '<path d="M7 5h10M7 10h10M7 15h10"/><circle cx="3.8" cy="5" r=".7"/><circle cx="3.8" cy="10" r=".7"/><circle cx="3.8" cy="15" r=".7"/>',
  sliders: '<path d="M4 5h12M4 10h12M4 15h12"/><circle cx="7" cy="5" r="1.4"/><circle cx="13" cy="10" r="1.4"/><circle cx="9" cy="15" r="1.4"/>',
  pulse: '<path d="M2.8 10h3l2-4.6 3.2 9.2 2.1-4.6h4.1"/>',
  play: '<path d="M6.5 4.3v11.4L15.5 10Z"/>',
  stop: '<rect x="5.2" y="5.2" width="9.6" height="9.6" rx="1"/>',
  shield: '<path d="M10 2.6 16.4 5v4.7c0 4-2.7 6.7-6.4 7.7-3.7-1-6.4-3.7-6.4-7.7V5Z"/>',
  dot: '<circle cx="10" cy="10" r="3.2"/>',
};

export function icon(name, size = 16, extra = "") {
  const path = paths[name] || paths.dot;
  return `<svg class="icon ${extra}" width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function avatar(person, size = 28) {
  if (!person) return "";
  const kind = person.kind === "human" ? "human" : "agent";
  const label = person.initials || person.name.slice(0, 2).toUpperCase();
  return `<span class="avatar avatar--${kind}" style="--av-size:${size}px;--av-accent:var(--${person.color || "cyan"})" title="${person.name}">${label}</span>`;
}
