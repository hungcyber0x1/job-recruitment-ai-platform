const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const DEV_CLIENT_PORT_RANGES = [
  [3000, 3010],
  [5173, 5183],
];

function expandLoopbackOrigin(origin) {
  const normalized = String(origin ?? '').trim();
  if (!normalized) {
    return [];
  }

  const expanded = new Set([normalized]);

  try {
    const parsed = new URL(normalized);
    const loopbacks = ['localhost', '127.0.0.1', '::1'];

    if (loopbacks.includes(parsed.hostname)) {
      loopbacks.forEach((lb) => {
        const u = new URL(normalized);
        u.hostname = lb === '::1' ? '[::1]' : lb;
        expanded.add(u.toString().replace(/\/$/, ''));
      });
    }
  } catch {
    return [normalized];
  }

  return [...expanded];
}

function getDevelopmentLoopbackOrigins() {
  const origins = [];

  DEV_CLIENT_PORT_RANGES.forEach(([start, end]) => {
    for (let port = start; port <= end; port += 1) {
      origins.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    }
  });

  return origins;
}

function getAllowedOrigins() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : DEFAULT_ALLOWED_ORIGINS;
  const developmentOrigins =
    process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_LOOPBACK_ORIGINS !== 'false'
      ? getDevelopmentLoopbackOrigins()
      : [];

  const expanded = [...configuredOrigins, ...developmentOrigins]
    .flatMap(expandLoopbackOrigin)
    .filter(Boolean);
  return [...new Set(expanded)];
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  DEV_CLIENT_PORT_RANGES,
  expandLoopbackOrigin,
  getAllowedOrigins,
  getDevelopmentLoopbackOrigins,
};
