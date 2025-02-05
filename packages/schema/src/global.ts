const GLOBALS = Object.create(null) as powership;

function define() {
  try {
    if (typeof globalThis === 'object' && globalThis) {
      Object.defineProperty(globalThis, 'powership', {
        get() {
          return GLOBALS;
        },
      });
    }
  } catch (e) {}

  try {
    if (typeof global === 'object' && global) {
      Object.defineProperty(global, 'powership', {
        get() {
          return GLOBALS;
        },
      });
    }
  } catch (e) {}

  try {
    Object.defineProperty(window, 'powership', {
      get() {
        return GLOBALS;
      },
    });
  } catch (e) {}
}

define();

declare global {
  interface powership {}

  interface Window {
    powership: powership;
  }

  const powership: powership;
}

export {};

import './__globals__';
