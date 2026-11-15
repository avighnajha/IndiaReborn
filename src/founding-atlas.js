import snapshots from "./geography/founding.json";

const starts = {
  bihar: { name: "Bihar", kind: "British Indian province", pin: [333, 226], callout: [359, 197] },
  orissa: { name: "Orissa", kind: "British Indian province", pin: [344, 311], callout: [374, 330] },
  mayurbhanj: { name: "Mayurbhanj", kind: "Princely state", pin: [357, 286], callout: [392, 269] },
  "west-bengal": { name: "West Bengal", kind: "Western districts of British Bengal", pin: [383, 276], callout: [433, 302] },
  bombay: { name: "Bombay", kind: "British Indian province", pin: [139, 336], callout: [65, 333] },
  punjab: { name: "Punjab", kind: "Eastern districts of British Punjab", pin: [190, 134], callout: [112, 123] },
  madras: { name: "Madras", kind: "British Indian province", pin: [256, 434], callout: [287, 449] },
  central: { name: "C.P. and Berar", kind: "British Indian province", pin: [234, 299], callout: [172, 257] },
  assam: { name: "Assam", kind: "British Indian province", pin: [440, 221], callout: [453, 190] },
};

export const startKind = (key) => starts[key]?.kind ?? "Regional administration";

export function nationalAtlas(selected, census = 1941) {
  const records = snapshots[census];
  const hasOutlines = records.length > 0;
  if (!hasOutlines && census !== 1941) return '<p>Historical census outlines are unavailable in this build.</p>';
  const zones = records.map(({ name, kind, path }) => {
    const key = name === "Bengal" || name === "West Bengal" ? "west-bengal"
      : name === "Central Province and Berar" || name === "Madhya Pradesh" ? "central" : name.toLowerCase();
    const playable = Object.hasOwn(starts, key);
    return `<path class="founding-zone ${kind}${key === selected && (key !== "central" || kind === "province") ? " selected" : ""}" d="${path}"${playable && census === 1941 && (key !== "central" || kind === "province") ? ` data-atlas-start="${key}"` : ""}><title>${name}</title></path>`;
  }).join("");
  const pins = census === 1941 ? Object.entries(starts).map(([key, { name, pin: [x, y], callout: [tx, ty] }]) => `
    <g data-atlas-start="${key}" class="founding-pin${key === selected ? " selected" : ""}">
      <line x1="${x}" y1="${y}" x2="${tx - 5}" y2="${ty - 4}" />
      <circle cx="${x}" cy="${y}" r="4" />
      <rect x="${tx - 4}" y="${ty - 14}" width="${name.length * 7.7 + 9}" height="20" rx="3" />
      <text x="${tx}" y="${ty}">${name}</text>
    </g>`).join("") : "";
  return `<div class="founding-chart">
    <svg viewBox="0 0 565 532" role="img" aria-label="${hasOutlines ? `Indian subcontinent reference map, ${census} census outlines` : "Campaign starting locations"}">
      <defs>
        <pattern id="atlas-grid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" fill="none" stroke="#536d62" stroke-opacity=".30" /></pattern>
        <radialGradient id="atlas-sea"><stop stop-color="#294640" /><stop offset="1" stop-color="#142725" /></radialGradient>
      </defs>
      <rect width="565" height="532" fill="url(#atlas-sea)" /><rect width="565" height="532" fill="url(#atlas-grid)" />
      <g fill-rule="evenodd">${zones}</g>
      <g class="founding-context"><text x="46" y="112">${census === 1941 ? "NORTHWEST FRONTIER" : "WEST PAKISTAN"}</text>
        <text x="316" y="148">NEPAL</text><text x="400" y="212">BHUTAN</text>
        <text x="394" y="252">${census === 1941 ? "EASTERN BENGAL" : "EAST PAKISTAN"}</text><text x="502" y="310">BURMA</text>
        <text x="60" y="371">ARABIAN SEA</text><text x="385" y="423">BAY OF BENGAL</text><text x="282" y="507">CEYLON</text></g>
      ${pins}
      <g class="founding-compass"><path d="M32 34V75M26 46l6-12 6 12" /><text x="29" y="26">N</text></g>
    </svg>
    <div class="founding-chart-caption">${hasOutlines ? `<span>${census} census reference</span><span>Mapped extent of present-day India</span>`
      : "<span>Campaign starting locations</span><span>Historical outlines unavailable in this build</span>"}</div>
  </div>`;
}
