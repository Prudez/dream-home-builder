// Single source of truth for API request/response shapes and validation.
// Client and server both import this file. The server validates every
// request against it at the boundary. The client never redefines shapes
// inline — it reads them from here.

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// Every endpoint returns this shape on failure instead of an unhandled 500.
export function errorShape(code, message, details) {
  return { error: { code, message, details: details ?? null } };
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isBoolean(v) {
  return typeof v === 'boolean';
}
function isPositiveInt(v) {
  return Number.isInteger(v) && v > 0;
}
function isNonNegativeInt(v) {
  return Number.isInteger(v) && v >= 0;
}
function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Event taxonomy. test_event proved the pipe in Phase 1; Phase 2 adds the
// shell and canvas interaction events logged by the batched event queue.
export const EVENT_TYPES = [
  'test_event',
  'session_start',
  'shell_chosen',
  'room_added',
  'room_moved',
  'room_resized',
  'room_removed',
  'floor_viewed',
];

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function validateEventEntry(entry, index) {
  const errors = [];
  if (!isPlainObject(entry)) {
    return [`events[${index}] must be an object`];
  }
  if (!isNonEmptyString(entry.eventType)) {
    errors.push(`events[${index}].eventType must be a non-empty string`);
  }
  if (entry.payload != null && !isPlainObject(entry.payload)) {
    errors.push(`events[${index}].payload must be an object when present`);
  }
  if (entry.elapsedMs != null && !isNonNegativeInt(entry.elapsedMs)) {
    errors.push(`events[${index}].elapsedMs must be a non-negative integer when present`);
  }
  return errors;
}

export const contract = {
  health: {
    method: 'GET',
    path: '/api/health',
  },

  getCatalog: {
    method: 'GET',
    path: '/api/catalog',
  },

  createSession: {
    method: 'POST',
    path: '/api/sessions',
    // stylePack and floors are optional here — the shell stage that sets
    // them for real is contract.updateSessionShell, called once chosen.
    validateRequest(body) {
      const errors = [];
      if (!isPlainObject(body)) return ['body must be an object'];
      if (!isBoolean(body.consent)) {
        errors.push('consent must be a boolean');
      } else if (body.consent !== true) {
        errors.push('consent must be true to create a session');
      }
      if (body.stylePack != null && !isNonEmptyString(body.stylePack)) {
        errors.push('stylePack must be a non-empty string when present');
      }
      if (body.floors != null && !isPositiveInt(body.floors)) {
        errors.push('floors must be a positive integer when present');
      }
      if (body.device != null && !isNonEmptyString(body.device)) {
        errors.push('device must be a non-empty string when present');
      }
      return errors;
    },
  },

  updateSessionShell: {
    method: 'PATCH',
    path: '/api/sessions/:id',
    // Fires once, when the player confirms floors + style pack and leaves
    // the shell stage. Both fields are required together.
    validateRequest(body) {
      const errors = [];
      if (!isPlainObject(body)) return ['body must be an object'];
      if (!isNonEmptyString(body.stylePack)) {
        errors.push('stylePack must be a non-empty string');
      }
      if (!isPositiveInt(body.floors)) {
        errors.push('floors must be a positive integer');
      }
      return errors;
    },
  },

  logEvent: {
    method: 'POST',
    path: '/api/events',
    // Batched: the client queues interaction events client-side and
    // flushes them together on an interval, on page hide, and once the
    // queue crosses a size threshold.
    validateRequest(body) {
      const errors = [];
      if (!isPlainObject(body)) return ['body must be an object'];
      if (!isNonEmptyString(body.sessionId)) {
        errors.push('sessionId must be a non-empty string');
      }
      if (!isNonEmptyArray(body.events)) {
        errors.push('events must be a non-empty array');
      } else {
        body.events.forEach((entry, i) => errors.push(...validateEventEntry(entry, i)));
      }
      return errors;
    },
  },
};
