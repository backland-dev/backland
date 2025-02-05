const GLOBALS: powership = Object.create(null);

function defineGlobals() {
  const defineProperty = (obj: any) => {
    if (obj && !Object.prototype.hasOwnProperty.call(obj, 'powership')) {
      Object.defineProperty(obj, 'powership', {
        configurable: false,
        enumerable: true,
        get: () => GLOBALS,
      });
    }
  };

  try {
    if (typeof globalThis !== 'undefined') defineProperty(globalThis);
  } catch (e) {}

  try {
    if (typeof global !== 'undefined') defineProperty(global);
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') defineProperty(window);
  } catch (e) {}
}

defineGlobals();

declare global {
  interface powership {}

  interface Window {
    powership: powership;
  }

  const powership: powership;

  namespace NodeJS {
    interface Global {
      powership: powership;
    }
  }
}

export {};

import './__globals__';
