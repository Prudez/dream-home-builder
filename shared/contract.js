// Single source of truth for API request/response shapes and validation.
// Client and server both import this file. The server validates every
// request against it at the boundary. The client never redefines shapes
// inline — it reads them from here.

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
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

// Event taxonomy. test_event proved the pipe in Phase 1; Phase 2 added the
// shell and canvas interaction events; Phase 3 added customization and
// financing events; Phase 4 adds the reveal/lead-capture events, all logged
// by the batched event queue.
export const EVENT_TYPES = [
  'test_event',
  'session_start',
  'shell_chosen',
  'room_added',
  'room_moved',
  'room_resized',
  'room_removed',
  'floor_viewed',
  'finish_changed',
  'colour_changed',
  'furniture_changed',
  'financing_answered',
  'premium_crossed',
  'design_finished',
  'lead_submitted',
  'session_abandoned',
];

// Kenyan mobile number formats: +254/254/0 prefix followed by a Safaricom/
// Airtel-style 7xxxxxxxx line or a 1xxxxxxxx line (newer number ranges).
// Shared so the server's validation and the client's inline field feedback
// never drift apart.
export function isKenyanPhone(input) {
  if (typeof input !== 'string') return false;
  const stripped = input.replace(/[\s-]/g, '');
  return /^(?:\+254|254|0)(7\d{8}|1\d{8})$/.test(stripped);
}

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

function validateDesignRoomEntry(entry, index) {
  const errors = [];
  if (!isPlainObject(entry)) {
    return [`rooms[${index}] must be an object`];
  }
  if (!isNonEmptyString(entry.type)) {
    errors.push(`rooms[${index}].type must be a non-empty string`);
  }
  for (const field of ['x', 'y', 'w', 'h', 'floor']) {
    if (!isNonNegativeInt(entry[field])) {
      errors.push(`rooms[${index}].${field} must be a non-negative integer`);
    }
  }
  if (entry.finishKey != null && !isNonEmptyString(entry.finishKey)) {
    errors.push(`rooms[${index}].finishKey must be a string or null`);
  }
  if (!isNonNegativeInt(entry.colorIndex)) {
    errors.push(`rooms[${index}].colorIndex must be a non-negative integer`);
  }
  if (entry.furnitureId != null && !isPositiveInt(entry.furnitureId)) {
    errors.push(`rooms[${index}].furnitureId must be a positive integer or null`);
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

  getSalesLeads: {
    method: 'GET',
    path: '/api/sales/leads',
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

  createDesign: {
    method: 'POST',
    path: '/api/designs',
    // Fires once, when the player clicks "Finish my design". The server
    // recomputes total/profile/matches from the submitted rooms rather than
    // trusting any client-sent total.
    validateRequest(body) {
      const errors = [];
      if (!isPlainObject(body)) return ['body must be an object'];
      if (!isNonEmptyString(body.sessionId)) {
        errors.push('sessionId must be a non-empty string');
      }
      if (!isNonEmptyString(body.shellKey)) {
        errors.push('shellKey must be a non-empty string');
      }
      if (!isNonEmptyString(body.stylePack)) {
        errors.push('stylePack must be a non-empty string');
      }
      if (!isPositiveInt(body.floors)) {
        errors.push('floors must be a positive integer');
      }
      if (!isNonEmptyArray(body.rooms)) {
        errors.push('rooms must be a non-empty array');
      } else {
        body.rooms.forEach((entry, i) => errors.push(...validateDesignRoomEntry(entry, i)));
      }
      return errors;
    },
  },

  createLead: {
    method: 'POST',
    path: '/api/leads',
    validateRequest(body) {
      const errors = [];
      if (!isPlainObject(body)) return ['body must be an object'];
      if (!isNonEmptyString(body.sessionId)) {
        errors.push('sessionId must be a non-empty string');
      }
      if (!isNonEmptyString(body.designId)) {
        errors.push('designId must be a non-empty string');
      }
      if (!isNonEmptyString(body.whatsapp) || !isKenyanPhone(body.whatsapp)) {
        errors.push('whatsapp must be a valid Kenyan phone number');
      }
      return errors;
    },
  },
};
