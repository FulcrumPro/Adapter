'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};



function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var polyfill = createCommonjsModule(function (module, exports) {
(function (global, factory) {
	factory();
}(commonjsGlobal, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

function allSettled(arr) {
  var P = this;
  return new P(function(resolve, reject) {
    if (!(arr && typeof arr.length !== 'undefined')) {
      return reject(
        new TypeError(
          typeof arr +
            ' ' +
            arr +
            ' is not iterable(cannot read property Symbol(Symbol.iterator))'
        )
      );
    }
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        var then = val.then;
        if (typeof then === 'function') {
          then.call(
            val,
            function(val) {
              res(i, val);
            },
            function(e) {
              args[i] = { status: 'rejected', reason: e };
              if (--remaining === 0) {
                resolve(args);
              }
            }
          );
          return;
        }
      }
      args[i] = { status: 'fulfilled', value: val };
      if (--remaining === 0) {
        resolve(args);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.allSettled = allSettled;

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof commonjsGlobal !== 'undefined') {
    return commonjsGlobal;
  }
  throw new Error('unable to locate global object');
})();

// Expose the polyfill if Promise is undefined or set to a
// non-function value. The latter can be due to a named HTMLElement
// being exposed by browsers for legacy reasons.
// https://github.com/taylorhakes/promise-polyfill/issues/114
if (typeof globalNS['Promise'] !== 'function') {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
} else if (!globalNS.Promise.allSettled) {
  globalNS.Promise.allSettled = allSettled;
}

})));
});

var contains = function (other) {
    if (arguments.length < 1) {
        throw new TypeError('1 argument is required');
    }
    if (typeof other !== 'object') {
        throw new TypeError('Argument 1 (”other“) to Node.contains must be an instance of Node');
    }
    var node = other;
    do {
        if (this === node) {
            return true;
        }
        if (node) {
            node = node.parentNode;
        }
    } while (node);
    return false;
};
function registerDocumentContainsPolyfill() {
    // tslint:disable-next-line
    if (typeof document === 'object' && typeof document.contains !== 'function') {
        Object.getPrototypeOf(document).contains = contains;
    }
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};









function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}









/** @deprecated */


/** @deprecated */

var eventemitter3 = createCommonjsModule(function (module) {
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
{
  module.exports = EventEmitter;
}
});

var eventemitter3_1 = eventemitter3.EventEmitter;

/* eslint no-void: "off" */

// Loaded ready states
var loadedStates = ['interactive', 'complete'];

// Return Promise
var whenDomReady = function whenDomReady(cb, doc) {
	return new Promise(function (resolve) {
		// Allow doc to be passed in as the lone first param
		if (cb && typeof cb !== 'function') {
			doc = cb;
			cb = null;
		}

		// Use global document if we don't have one
		doc = doc || window.document;

		// Handle DOM load
		var done = function done() {
			return resolve(void (cb && setTimeout(cb)));
		};

		// Resolve now if DOM has already loaded
		// Otherwise wait for DOMContentLoaded
		if (loadedStates.indexOf(doc.readyState) !== -1) {
			done();
		} else {
			doc.addEventListener('DOMContentLoaded', done);
		}
	});
};

// Promise chain helper
whenDomReady.resume = function (doc) {
	return function (val) {
		return whenDomReady(doc).then(function () {
			return val;
		});
	};
};

var containers = []; // will store container HTMLElement references
var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

var usage = 'insert-css: You need to provide a CSS string. Usage: insertCss(cssString[, options]).';

function insertCss(css, options) {
    options = options || {};

    if (css === undefined) {
        throw new Error(usage);
    }

    var position = options.prepend === true ? 'prepend' : 'append';
    var container = options.container !== undefined ? options.container : document.querySelector('head');
    var containerId = containers.indexOf(container);

    // first time we see this container, create the necessary entries
    if (containerId === -1) {
        containerId = containers.push(container) - 1;
        styleElements[containerId] = {};
    }

    // try to get the correponding container + position styleElement, create it otherwise
    var styleElement;

    if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
        styleElement = styleElements[containerId][position];
    } else {
        styleElement = styleElements[containerId][position] = createStyleElement();

        if (position === 'prepend') {
            container.insertBefore(styleElement, container.childNodes[0]);
        } else {
            container.appendChild(styleElement);
        }
    }

    // strip potential UTF-8 BOM if css was read from a file
    if (css.charCodeAt(0) === 0xFEFF) { css = css.substr(1, css.length); }

    // actually add the stylesheet
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText += css;
    } else {
        styleElement.textContent += css;
    }

    return styleElement;
}

function createStyleElement() {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    return styleElement;
}

var insertCss_1 = insertCss;
var insertCss_2 = insertCss;

insertCss_1.insertCss = insertCss_2;

var elementClass = function(opts) {
  return new ElementClass(opts)
};

function indexOf(arr, prop) {
  if (arr.indexOf) return arr.indexOf(prop)
  for (var i = 0, len = arr.length; i < len; i++)
    if (arr[i] === prop) return i
  return -1
}

function ElementClass(opts) {
  if (!(this instanceof ElementClass)) return new ElementClass(opts)
  var self = this;
  if (!opts) opts = {};

  // similar doing instanceof HTMLElement but works in IE8
  if (opts.nodeType) opts = {el: opts};

  this.opts = opts;
  this.el = opts.el || document.body;
  if (typeof this.el !== 'object') this.el = document.querySelector(this.el);
}

ElementClass.prototype.add = function(className) {
  var el = this.el;
  if (!el) return
  if (el.className === "") return el.className = className
  var classes = el.className.split(' ');
  if (indexOf(classes, className) > -1) return classes
  classes.push(className);
  el.className = classes.join(' ');
  return classes
};

ElementClass.prototype.remove = function(className) {
  var el = this.el;
  if (!el) return
  if (el.className === "") return
  var classes = el.className.split(' ');
  var idx = indexOf(classes, className);
  if (idx > -1) classes.splice(idx, 1);
  el.className = classes.join(' ');
  return classes
};

ElementClass.prototype.has = function(className) {
  var el = this.el;
  if (!el) return
  var classes = el.className.split(' ');
  return indexOf(classes, className) > -1
};

ElementClass.prototype.toggle = function(className) {
  var el = this.el;
  if (!el) return
  if (this.has(className)) this.remove(className);
  else this.add(className);
};

var lib = createCommonjsModule(function (module, exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ERR_IFRAME_ALREADY_ATTACHED_TO_DOM = exports.ERR_NOT_IN_IFRAME = exports.ERR_CONNECTION_TIMEOUT = exports.ERR_CONNECTION_DESTROYED = void 0;
var HANDSHAKE = 'handshake';
var HANDSHAKE_REPLY = 'handshake-reply';
var CALL = 'call';
var REPLY = 'reply';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';
var MESSAGE = 'message';
var DATA_CLONE_ERROR = 'DataCloneError';
var ERR_CONNECTION_DESTROYED = 'ConnectionDestroyed';
exports.ERR_CONNECTION_DESTROYED = ERR_CONNECTION_DESTROYED;
var ERR_CONNECTION_TIMEOUT = 'ConnectionTimeout';
exports.ERR_CONNECTION_TIMEOUT = ERR_CONNECTION_TIMEOUT;
var ERR_NOT_IN_IFRAME = 'NotInIframe';
exports.ERR_NOT_IN_IFRAME = ERR_NOT_IN_IFRAME;
var ERR_IFRAME_ALREADY_ATTACHED_TO_DOM = 'IframeAlreadyAttachedToDom';
exports.ERR_IFRAME_ALREADY_ATTACHED_TO_DOM = ERR_IFRAME_ALREADY_ATTACHED_TO_DOM;
var CHECK_IFRAME_IN_DOC_INTERVAL = 60000;
var DEFAULT_PORTS = {
  'http:': '80',
  'https:': '443'
};
var URL_REGEX = /^(https?:|file:)?\/\/([^/:]+)?(:(\d+))?/;
var Penpal = {
  ERR_CONNECTION_DESTROYED: ERR_CONNECTION_DESTROYED,
  ERR_CONNECTION_TIMEOUT: ERR_CONNECTION_TIMEOUT,
  ERR_NOT_IN_IFRAME: ERR_NOT_IN_IFRAME,
  ERR_IFRAME_ALREADY_ATTACHED_TO_DOM: ERR_IFRAME_ALREADY_ATTACHED_TO_DOM,

  /**
   * Promise implementation.
   * @type {Constructor}
   */
  Promise: function () {
    try {
      return window ? window.Promise : null;
    } catch (e) {
      return null;
    }
  }(),

  /**
   * Whether debug messages should be logged.
   * @type {boolean}
   */
  debug: false
};
/**
 * @return {number} A unique ID (not universally unique)
 */

var generateId = function () {
  var id = 0;
  return function () {
    return ++id;
  };
}();
/**
 * Logs a message.
 * @param {...*} args One or more items to log
 */


var log = function log() {
  if (Penpal.debug) {
    var _console;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (_console = console).log.apply(_console, ['[Penpal]'].concat(args)); // eslint-disable-line no-console

  }
};
/**
 * Converts a URL into an origin.
 * @param {string} url
 * @return {string} The URL's origin
 */


var getOriginFromUrl = function getOriginFromUrl(url) {
  var location = document.location;
  var regexResult = URL_REGEX.exec(url);
  var protocol;
  var hostname;
  var port;

  if (regexResult) {
    // It's an absolute URL. Use the parsed info.
    // regexResult[1] will be undefined if the URL starts with //
    protocol = regexResult[1] ? regexResult[1] : location.protocol;
    hostname = regexResult[2];
    port = regexResult[4];
  } else {
    // It's a relative path. Use the current location's info.
    protocol = location.protocol;
    hostname = location.hostname;
    port = location.port;
  } // If the protocol is file, the origin is "null"
  // The origin of a document with file protocol is an opaque origin
  // and its serialization "null" [1]
  // [1] https://html.spec.whatwg.org/multipage/origin.html#origin


  if (protocol === "file:") {
    return "null";
  } // If the port is the default for the protocol, we don't want to add it to the origin string
  // or it won't match the message's event.origin.


  var portSuffix = port && port !== DEFAULT_PORTS[protocol] ? ":".concat(port) : '';
  return "".concat(protocol, "//").concat(hostname).concat(portSuffix);
};
/**
 * A simplified promise class only used internally for when destroy() is called. This is
 * used to destroy connections synchronously while promises typically resolve asynchronously.
 *
 * @param {Function} executor
 * @returns {Object}
 * @constructor
 */


var DestructionPromise = function DestructionPromise(executor) {
  var handlers = [];
  executor(function () {
    handlers.forEach(function (handler) {
      handler();
    });
  });
  return {
    then: function then(handler) {
      handlers.push(handler);
    }
  };
};
/**
 * Converts an error object into a plain object.
 * @param {Error} Error object.
 * @returns {Object}
 */


var serializeError = function serializeError(_ref) {
  var name = _ref.name,
      message = _ref.message,
      stack = _ref.stack;
  return {
    name: name,
    message: message,
    stack: stack
  };
};
/**
 * Converts a plain object into an error object.
 * @param {Object} Object with error properties.
 * @returns {Error}
 */


var deserializeError = function deserializeError(obj) {
  var deserializedError = new Error();
  Object.keys(obj).forEach(function (key) {
    return deserializedError[key] = obj[key];
  });
  return deserializedError;
};
/**
 * Augments an object with methods that match those defined by the remote. When these methods are
 * called, a "call" message will be sent to the remote, the remote's corresponding method will be
 * executed, and the method's return value will be returned via a message.
 * @param {Object} callSender Sender object that should be augmented with methods.
 * @param {Object} info Information about the local and remote windows.
 * @param {Array} methodNames Names of methods available to be called on the remote.
 * @param {Promise} destructionPromise A promise resolved when destroy() is called on the penpal
 * connection.
 * @returns {Object} The call sender object with methods that may be called.
 */


var connectCallSender = function connectCallSender(callSender, info, methodNames, destroy, destructionPromise) {
  var localName = info.localName,
      local = info.local,
      remote = info.remote,
      remoteOrigin = info.remoteOrigin;
  var destroyed = false;
  log("".concat(localName, ": Connecting call sender"));

  var createMethodProxy = function createMethodProxy(methodName) {
    return function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      log("".concat(localName, ": Sending ").concat(methodName, "() call")); // This handles the case where the iframe has been removed from the DOM
      // (and therefore its window closed), the consumer has not yet
      // called destroy(), and the user calls a method exposed by
      // the remote. We detect the iframe has been removed and force
      // a destroy() immediately so that the consumer sees the error saying
      // the connection has been destroyed.

      if (remote.closed) {
        destroy();
      }

      if (destroyed) {
        var error = new Error("Unable to send ".concat(methodName, "() call due ") + "to destroyed connection");
        error.code = ERR_CONNECTION_DESTROYED;
        throw error;
      }

      return new Penpal.Promise(function (resolve, reject) {
        var id = generateId();

        var handleMessageEvent = function handleMessageEvent(event) {
          if (event.source === remote && event.origin === remoteOrigin && event.data.penpal === REPLY && event.data.id === id) {
            log("".concat(localName, ": Received ").concat(methodName, "() reply"));
            local.removeEventListener(MESSAGE, handleMessageEvent);
            var returnValue = event.data.returnValue;

            if (event.data.returnValueIsError) {
              returnValue = deserializeError(returnValue);
            }

            (event.data.resolution === FULFILLED ? resolve : reject)(returnValue);
          }
        };

        local.addEventListener(MESSAGE, handleMessageEvent);
        remote.postMessage({
          penpal: CALL,
          id: id,
          methodName: methodName,
          args: args
        }, remoteOrigin);
      });
    };
  };

  destructionPromise.then(function () {
    destroyed = true;
  });
  methodNames.reduce(function (api, methodName) {
    api[methodName] = createMethodProxy(methodName);
    return api;
  }, callSender);
};
/**
 * Listens for "call" messages coming from the remote, executes the corresponding method, and
 * responds with the return value.
 * @param {Object} info Information about the local and remote windows.
 * @param {Object} methods The keys are the names of the methods that can be called by the remote
 * while the values are the method functions.
 * @param {Promise} destructionPromise A promise resolved when destroy() is called on the penpal
 * connection.
 * @returns {Function} A function that may be called to disconnect the receiver.
 */


var connectCallReceiver = function connectCallReceiver(info, methods, destructionPromise) {
  var localName = info.localName,
      local = info.local,
      remote = info.remote,
      remoteOrigin = info.remoteOrigin;
  var destroyed = false;
  log("".concat(localName, ": Connecting call receiver"));

  var handleMessageEvent = function handleMessageEvent(event) {
    if (event.source === remote && event.origin === remoteOrigin && event.data.penpal === CALL) {
      var _event$data = event.data,
          methodName = _event$data.methodName,
          args = _event$data.args,
          id = _event$data.id;
      log("".concat(localName, ": Received ").concat(methodName, "() call"));

      if (methodName in methods) {
        var createPromiseHandler = function createPromiseHandler(resolution) {
          return function (returnValue) {
            log("".concat(localName, ": Sending ").concat(methodName, "() reply"));

            if (destroyed) {
              // It's possible to throw an error here, but it would need to be thrown asynchronously
              // and would only be catchable using window.onerror. This is because the consumer
              // is merely returning a value from their method and not calling any function
              // that they could wrap in a try-catch. Even if the consumer were to catch the error,
              // the value of doing so is questionable. Instead, we'll just log a message.
              log("".concat(localName, ": Unable to send ").concat(methodName, "() reply due to destroyed connection"));
              return;
            }

            var message = {
              penpal: REPLY,
              id: id,
              resolution: resolution,
              returnValue: returnValue
            };

            if (resolution === REJECTED && returnValue instanceof Error) {
              message.returnValue = serializeError(returnValue);
              message.returnValueIsError = true;
            }

            try {
              remote.postMessage(message, remoteOrigin);
            } catch (err) {
              // If a consumer attempts to send an object that's not cloneable (e.g., window),
              // we want to ensure the receiver's promise gets rejected.
              if (err.name === DATA_CLONE_ERROR) {
                remote.postMessage({
                  penpal: REPLY,
                  id: id,
                  resolution: REJECTED,
                  returnValue: serializeError(err),
                  returnValueIsError: true
                }, remoteOrigin);
              }

              throw err;
            }
          };
        };

        new Penpal.Promise(function (resolve) {
          return resolve(methods[methodName].apply(methods, args));
        }).then(createPromiseHandler(FULFILLED), createPromiseHandler(REJECTED));
      }
    }
  };

  local.addEventListener(MESSAGE, handleMessageEvent);
  destructionPromise.then(function () {
    destroyed = true;
    local.removeEventListener(MESSAGE, handleMessageEvent);
  });
};
/**
 * @typedef {Object} Child
 * @property {Promise} promise A promise which will be resolved once a connection has
 * been established.
 * @property {HTMLIframeElement} iframe The created iframe element.
 * @property {Function} destroy A method that, when called, will remove the iframe element from
 * the DOM and clean up event listeners.
 */

/**
 * Creates an iframe, loads a webpage into the URL, and attempts to establish communication with
 * the iframe.
 * @param {Object} options
 * @param {string} options.url The URL of the webpage that should be loaded into the created iframe.
 * @param {HTMLElement} [options.appendTo] The container to which the iframe should be appended.
 * @param {Object} [options.methods={}] Methods that may be called by the iframe.
 * @param {Number} [options.timeout] The amount of time, in milliseconds, Penpal should wait
 * for the child to respond before rejecting the connection promise.
 * @return {Child}
 */


Penpal.connectToChild = function (_ref2) {
  var url = _ref2.url,
      appendTo = _ref2.appendTo,
      iframe = _ref2.iframe,
      _ref2$methods = _ref2.methods,
      methods = _ref2$methods === void 0 ? {} : _ref2$methods,
      timeout = _ref2.timeout;

  if (iframe && iframe.parentNode) {
    var error = new Error('connectToChild() must not be called with an iframe already attached to DOM');
    error.code = ERR_IFRAME_ALREADY_ATTACHED_TO_DOM;
    throw error;
  }

  var destroy;
  var connectionDestructionPromise = new DestructionPromise(function (resolveConnectionDestructionPromise) {
    destroy = resolveConnectionDestructionPromise;
  });
  var parent = window;
  iframe = iframe || document.createElement('iframe');
  iframe.src = url;
  var childOrigin = getOriginFromUrl(url);
  var promise = new Penpal.Promise(function (resolveConnectionPromise, reject) {
    var connectionTimeoutId;

    if (timeout !== undefined) {
      connectionTimeoutId = setTimeout(function () {
        var error = new Error("Connection to child timed out after ".concat(timeout, "ms"));
        error.code = ERR_CONNECTION_TIMEOUT;
        reject(error);
        destroy();
      }, timeout);
    } // We resolve the promise with the call sender. If the child reconnects (for example, after
    // refreshing or navigating to another page that uses Penpal, we'll update the call sender
    // with methods that match the latest provided by the child.


    var callSender = {};
    var receiverMethodNames;
    var destroyCallReceiver;

    var handleMessage = function handleMessage(event) {
      var child = iframe.contentWindow;

      if (event.source === child && event.origin === childOrigin && event.data.penpal === HANDSHAKE) {
        log('Parent: Received handshake, sending reply'); // If event.origin is "null", the remote protocol is file:
        // and we must post messages with "*" as targetOrigin [1]
        // [1] https://developer.mozilla.org/fr/docs/Web/API/Window/postMessage#Utiliser_window.postMessage_dans_les_extensions

        var remoteOrigin = event.origin === "null" ? "*" : event.origin;
        event.source.postMessage({
          penpal: HANDSHAKE_REPLY,
          methodNames: Object.keys(methods)
        }, remoteOrigin);
        var info = {
          localName: 'Parent',
          local: parent,
          remote: child,
          remoteOrigin: remoteOrigin
        }; // If the child reconnected, we need to destroy the previous call receiver before setting
        // up a new one.

        if (destroyCallReceiver) {
          destroyCallReceiver();
        } // When this promise is resolved, it will destroy the call receiver (stop listening to
        // method calls from the child) and delete its methods off the call sender.


        var callReceiverDestructionPromise = new DestructionPromise(function (resolveCallReceiverDestructionPromise) {
          connectionDestructionPromise.then(resolveCallReceiverDestructionPromise);
          destroyCallReceiver = resolveCallReceiverDestructionPromise;
        });
        connectCallReceiver(info, methods, callReceiverDestructionPromise); // If the child reconnected, we need to remove the methods from the previous call receiver
        // off the sender.

        if (receiverMethodNames) {
          receiverMethodNames.forEach(function (receiverMethodName) {
            delete callSender[receiverMethodName];
          });
        }

        receiverMethodNames = event.data.methodNames;
        connectCallSender(callSender, info, receiverMethodNames, destroy, connectionDestructionPromise);
        clearTimeout(connectionTimeoutId);
        resolveConnectionPromise(callSender);
      }
    };

    parent.addEventListener(MESSAGE, handleMessage);
    log('Parent: Loading iframe');
    (appendTo || document.body).appendChild(iframe); // This is to prevent memory leaks when the iframe is removed
    // from the document and the consumer hasn't called destroy().
    // Without this, event listeners attached to the window would
    // stick around and since the event handlers have a reference
    // to the iframe in their closures, the iframe would stick around
    // too.

    var checkIframeInDocIntervalId = setInterval(function () {
      if (!document.body.contains(iframe)) {
        clearInterval(checkIframeInDocIntervalId);
        destroy();
      }
    }, CHECK_IFRAME_IN_DOC_INTERVAL);
    connectionDestructionPromise.then(function () {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }

      parent.removeEventListener(MESSAGE, handleMessage);
      clearInterval(checkIframeInDocIntervalId);
      var error = new Error('Connection destroyed');
      error.code = ERR_CONNECTION_DESTROYED;
      reject(error);
    });
  });
  return {
    promise: promise,
    iframe: iframe,
    destroy: destroy
  };
};
/**
 * @typedef {Object} Parent
 * @property {Promise} promise A promise which will be resolved once a connection has
 * been established.
 */

/**
 * Attempts to establish communication with the parent window.
 * @param {Object} options
 * @param {string} [options.parentOrigin=*] Valid parent origin used to restrict communication.
 * @param {Object} [options.methods={}] Methods that may be called by the parent window.
 * @param {Number} [options.timeout] The amount of time, in milliseconds, Penpal should wait
 * for the parent to respond before rejecting the connection promise.
 * @return {Parent}
 */


Penpal.connectToParent = function () {
  var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref3$parentOrigin = _ref3.parentOrigin,
      parentOrigin = _ref3$parentOrigin === void 0 ? '*' : _ref3$parentOrigin,
      _ref3$methods = _ref3.methods,
      methods = _ref3$methods === void 0 ? {} : _ref3$methods,
      timeout = _ref3.timeout;

  if (window === window.top) {
    var error = new Error('connectToParent() must be called within an iframe');
    error.code = ERR_NOT_IN_IFRAME;
    throw error;
  }

  var destroy;
  var connectionDestructionPromise = new DestructionPromise(function (resolveConnectionDestructionPromise) {
    destroy = resolveConnectionDestructionPromise;
  });
  var child = window;
  var parent = child.parent;
  var promise = new Penpal.Promise(function (resolveConnectionPromise, reject) {
    var connectionTimeoutId;

    if (timeout !== undefined) {
      connectionTimeoutId = setTimeout(function () {
        var error = new Error("Connection to parent timed out after ".concat(timeout, "ms"));
        error.code = ERR_CONNECTION_TIMEOUT;
        reject(error);
        destroy();
      }, timeout);
    }

    var handleMessageEvent = function handleMessageEvent(event) {
      if ((parentOrigin === '*' || parentOrigin === event.origin) && event.source === parent && event.data.penpal === HANDSHAKE_REPLY) {
        log('Child: Received handshake reply');
        child.removeEventListener(MESSAGE, handleMessageEvent);
        var info = {
          localName: 'Child',
          local: child,
          remote: parent,
          remoteOrigin: event.origin
        };
        var callSender = {};
        connectCallReceiver(info, methods, connectionDestructionPromise);
        connectCallSender(callSender, info, event.data.methodNames, destroy, connectionDestructionPromise);
        clearTimeout(connectionTimeoutId);
        resolveConnectionPromise(callSender);
      }
    };

    child.addEventListener(MESSAGE, handleMessageEvent);
    connectionDestructionPromise.then(function () {
      child.removeEventListener(MESSAGE, handleMessageEvent);
      var error = new Error('Connection destroyed');
      error.code = ERR_CONNECTION_DESTROYED;
      reject(error);
    });
    log('Child: Sending handshake');
    parent.postMessage({
      penpal: HANDSHAKE,
      methodNames: Object.keys(methods)
    }, parentOrigin);
  });
  return {
    promise: promise,
    destroy: destroy
  };
};

var _default = Penpal;
exports.default = _default;
});

var Penpal = unwrapExports(lib);

var Stats = /** @class */ (function () {
    function Stats(meta) {
        this.$meta = meta;
        this.originalRows = this.$meta.count_rows;
        this.acceptedRows = this.$meta.count_rows_accepted || null;
        this.originalColumns = this.$meta.count_columns || null;
        this.matchedColumns = this.$meta.count_columns_matched || null;
    }
    return Stats;
}());

var EndUser = /** @class */ (function () {
    function EndUser(meta) {
        this.$user = meta;
        this.id = this.$user.id;
        this.userId = this.$user.userId;
        this.name = this.$user.name;
        this.email = this.$user.name;
        this.companyName = this.$user.companyName;
        this.companyId = this.$user.companyId;
    }
    return EndUser;
}());

var UploadFile = /** @class */ (function () {
    function UploadFile(file) {
        this.$file = file;
        this.id = this.$file.id;
        this.filename = this.$file.filename;
        this.filesize = this.$file.filesize;
        this.filetype = this.$file.filetype;
        this.url = this.$file.url;
    }
    return UploadFile;
}());

var StreamedResults = /** @class */ (function () {
    function StreamedResults(data, meta) {
        this.$meta = meta;
        this.$data = data;
        this.rawOutput = this.$data;
        this.validData = this.$data
            .filter(function (v) { return v.valid; })
            .filter(function (v) { return !v.deleted; })
            .map(function (v) { return v.data; });
        this.data = this.validData;
        this.deletedData = this.$data.filter(function (v) { return v.deleted; }).map(function (v) { return v.data; });
        this.allData = this.$data.map(function (v) { return v.data; });
        this.remainingChunks = Math.ceil((this.totalChunks - this.currentChunk) / this.$meta.inChunks);
        this.totalChunks = Math.ceil(this.$meta.count_rows_accepted / this.$meta.inChunks);
        this.chunkSize = this.$meta.inChunks;
        this.currentChunk = (this.$meta.pointer + this.chunkSize) / this.chunkSize;
        this.hasMore = this.$meta.hasMore;
    }
    return StreamedResults;
}());

var Results = /** @class */ (function () {
    function Results(data, meta, importer) {
        var _this = this;
        this.$meta = meta;
        this.$data = data;
        this.$importer = importer;
        this.rawOutput = this.blobOnly(this.$data, 'rawOutput');
        this.validData = this.blobOnly(this.$data
            .filter(function (v) { return v.valid; })
            .filter(function (v) { return !v.deleted; })
            .map(function (v) { return v.data; }), 'validData');
        this.data = this.blobOnly(this.validData, 'data');
        this.deletedData = this.blobOnly(this.$data.filter(function (v) { return v.deleted; }).map(function (v) { return v.data; }), 'deletedData');
        this.allData = this.blobOnly(this.$data.map(function (v) { return v.data; }), 'allData');
        this.batchId = this.$meta.batchID;
        this.stats = new Stats(this.$meta);
        this.customer = this.$meta.endUser ? new EndUser(this.$meta.endUser) : null;
        this.originalFile = this.$meta.originalFile ? new UploadFile(this.$meta.originalFile) : null;
        this.csvFile = this.getCSVFile();
        this.fileName = this.$meta.filename || null;
        this.managed = this.$meta.managed || false;
        this.manual = this.$meta.manual;
        this.config = this.$meta.config;
        this.parsingConfig = this.$meta.parsing_config;
        this.skippedRows = this.$meta.skipped_rows || null;
        this.headersRaw = this.$meta.headers_raw || null;
        this.headersMatched = this.$meta.headers_matched || null;
        this.customColumns = this.$meta.custom_columns;
        this.categoryFieldMap = this.$meta.category_field_map || null;
        this.failureReason = this.$meta.failure_reason || null;
        this.submittedAt = this.$meta.submitted_at || null;
        this.failedAt = this.$meta.failed_at || null;
        this.createdAt = this.$meta.created_at;
        this.stylesheet = this.$meta.stylesheet;
        this.nextChunk = function () { return _this.getNextChunk(); };
    }
    Results.prototype.getCSVFile = function () {
        if (this.$meta.originalFile) {
            if (this.$meta.originalFile.filetype === 'csv') {
                return new UploadFile(this.$meta.originalFile);
            }
            else {
                if (this.$meta.csvFile) {
                    return new UploadFile(this.$meta.csvFile);
                }
            }
        }
        return null;
    };
    Results.prototype.getNextChunk = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.$meta.inChunks) {
                return reject("\"nextChunk()\" is only accessible when using \"inChunks\". Please see docs for \"requestDataFromUser\".");
            }
            _this.$importer.$ready.then(function (child) {
                console.log('child.nextChunk()');
                child.nextChunk().then(function (data) {
                    console.log('nextChunk()', data);
                    resolve(data.results.length ? new StreamedResults(data.results, data.meta) : null);
                }, function (err) {
                    console.log('nextChunk(err)', err);
                });
            });
        });
    };
    Results.prototype.blobOnly = function (v, method, alt) {
        if (alt === void 0) { alt = 'nextChunk()'; }
        if (this.$meta.inChunks) {
            throw new Error("\"" + method + "\" is not accessible when using \"inChunks\". Please see docs for \"" + alt + "\" instead.");
        }
        return v;
    };
    return Results;
}());

var FlatfileImporter$1 = /** @class */ (function (_super) {
    __extends(FlatfileImporter, _super);
    function FlatfileImporter(apiKey, options, customer) {
        var _this = _super.call(this) || this;
        _this.$fieldHooks = [];
        _this.$stepHooks = {};
        _this.apiKey = apiKey;
        _this.options = options;
        _this.customer = customer;
        _this.uuid = _this.$generateUuid();
        _this.$ready = new FlatfileImporter.Promise(function (resolve, reject) {
            _this.$resolver = resolve;
            _this.$rejecter = reject;
        });
        whenDomReady(function () {
            _this.initialize();
        });
        return _this;
    }
    /**
     * This will by default always be `https://www.flatfile.io/importer/:key` unless you are
     * an enterprise customer that is self-hosting the application. In which case, this
     * will be the URL of your enterprise installd Flatfile importer index page
     */
    FlatfileImporter.setMountUrl = function (url) {
        this.MOUNT_URL = url;
    };
    /**
     * This allows you to opt into or out of specific versions of the Flatfile SDK
     */
    FlatfileImporter.setVersion = function (version) {
        switch (version) {
            case 1:
                this.MOUNT_URL = 'https://kiosk-lite.flatfile.io/?key=:key';
                break;
            case 2:
                this.MOUNT_URL = 'https://portal-2.flatfile.io/?key=:key';
                break;
            default:
                throw new Error(version + " is not a valid version");
        }
    };
    FlatfileImporter.prototype.setUserBulkInitHook = function (cb) {
        this.UserBulkInitHook = cb;
    };
    /**
     * Call open() to activate the importer overlay dialog.
     */
    FlatfileImporter.prototype.open = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        options = __assign(__assign({}, options), { bulkInit: true, hasRecordHook: !!this.$recordHook, hasInteractionEventCallback: !!this.$interactionEventCallback, stepHooks: Object.keys(this.$stepHooks), fieldHooks: this.$fieldHooks.map(function (v) { return v.field; }), endUser: this.customer });
        this.$ready.then(function (child) {
            elementClass(document.body).add('flatfile-active');
            var el = document.getElementById("flatfile-" + _this.uuid);
            if (el) {
                el.style.display = 'block';
            }
            child.open(options);
        });
    };
    /**
     * Use load() when you want a promise returned. This is necessary if you want to use
     * async/await for an es6 implementation
     * @deprecated
     */
    FlatfileImporter.prototype.load = function () {
        var _this = this;
        return new FlatfileImporter.Promise(function (resolve, reject) {
            _this.open();
            var cleanup = function () {
                _this.removeListener('close', loadRejectHandler);
                _this.removeListener('complete', loadResolveHandler);
            };
            function loadResolveHandler(rows) {
                resolve(rows);
                cleanup();
            }
            function loadRejectHandler(err) {
                reject(err);
                cleanup();
            }
            _this.on('close', loadRejectHandler);
            _this.on('complete', loadResolveHandler);
        });
    };
    /**
     * Use requestDataFromUser() when you want a promise returned. This is necessary if you want to use
     * async/await for an es6 implementation
     */
    FlatfileImporter.prototype.requestDataFromUser = function (options) {
        if (options === void 0) { options = {}; }
        this.open(__assign(__assign({}, options), { inChunks: options.inChunks || null, expectsExpandedResults: true }));
        return this.responsePromise();
    };
    /**
     * This will display a progress indicator inside the importer if you anticipate that handling
     * the output of the importer may take some time.
     */
    FlatfileImporter.prototype.displayLoader = function (msg) {
        this.$ready.then(function (child) {
            child.displayLoader(msg);
        });
    };
    /**
     * This will display a dialog inside of the importer with an error icon and the message you
     * pass. The user will be able to acknowledge the error and be returned to the import data
     * spreadsheet to ideally fix any issues or attempt submitting again.
     * @deprecated
     */
    FlatfileImporter.prototype.displayError = function (msg) {
        this.$ready.then(function (child) {
            child.displayError(msg);
        });
    };
    /**
     * This will display a dialog inside of the importer with an error icon and the message you
     * pass. The user will be able to acknowledge the error and be returned to the import data
     * spreadsheet to ideally fix any issues or attempt submitting again.
     *
     * @param corrections - allows user to do server-side validation and provide error / warning
     * messages or value overrides
     */
    FlatfileImporter.prototype.requestCorrectionsFromUser = function (msg, corrections) {
        this.$ready.then(function (child) {
            child.displayError(msg, corrections);
        });
        return this.responsePromise();
    };
    /**
     * This will display a dialog inside of the importer with a success icon and the message you
     * pass.
     *
     * @return Promise that will be resolved when user closes the dialog.
     */
    FlatfileImporter.prototype.displaySuccess = function (msg) {
        var _this = this;
        this.$ready.then(function (child) {
            child.displaySuccess(msg);
        });
        return new Promise(function (resolve) {
            var handleSuccess = function () {
                resolve();
                _this.removeListener('close', handleSuccess);
            };
            _this.on('close', handleSuccess);
        });
    };
    /**
     * Set the customer information for this import
     */
    FlatfileImporter.prototype.setCustomer = function (customer) {
        this.customer = customer;
    };
    /**
     * Set the language for the Portal
     */
    FlatfileImporter.prototype.setLanguage = function (lang) {
        this.$ready.then(function (child) {
            child.setLanguage(lang);
        });
    };
    FlatfileImporter.prototype.addVirtualField = function (field, options) {
        if (options === void 0) { options = {}; }
        this.$ready.then(function (child) {
            child.addVirtualField({ field: field, options: options });
        });
    };
    /**
     * Set the customer information for this import
     */
    FlatfileImporter.prototype.registerRecordHook = function (callback) {
        this.$recordHook = callback;
    };
    FlatfileImporter.prototype.registerNetworkErrorCallback = function (callback) {
        this.$networkErrorCallback = callback;
    };
    FlatfileImporter.prototype.registerBeforeFetchCallback = function (callback) {
        this.$beforeFetchCallback = callback;
    };
    FlatfileImporter.prototype.registerInteractionEventCallback = function (callback) {
        this.$interactionEventCallback = callback;
    };
    FlatfileImporter.prototype.registerFieldHook = function (field, cb) {
        this.$fieldHooks.push({ field: field, cb: cb });
    };
    FlatfileImporter.prototype.registerStepHook = function (step, callback) {
        this.$stepHooks[step] = callback;
    };
    /**
     * Call close() from the parent window in order to hide the importer. You can do this after
     * handling the import callback so your users don't have to click the confirmation button
     */
    FlatfileImporter.prototype.close = function () {
        this.$ready.then(function (child) {
            child.close();
        });
    };
    FlatfileImporter.prototype.handleClose = function () {
        elementClass(document.body).remove('flatfile-active');
        var el = document.getElementById("flatfile-" + this.uuid);
        if (el) {
            el.style.display = 'none';
        }
    };
    FlatfileImporter.prototype.initialize = function () {
        var _this = this;
        insertCss_1("\n      .flatfile-component {\n        position: fixed;\n        top: 0;\n        bottom: 0;\n        right: 0;\n        left: 0;\n        display: none;\n        z-index: 100000;\n      }\n      .flatfile-component iframe {\n        width: 100%;\n        height: 100%;\n        position: absolute;\n        border-width: 0;\n      }\n      body.flatfile-active {\n        overflow: hidden;\n        overscroll-behavior-x: none;\n      }\n    ");
        document.body.insertAdjacentHTML('beforeend', "<div id=\"flatfile-" + this.uuid + "\" class=\"flatfile-component\"></div>");
        var timeout = setTimeout(function () {
            return console.error('[Flatfile] Looks like Portal takes too long to load. Please visit our Help Center (https://help.flatfile.io/support/solutions/articles/64000263381-my-importer-isn-t-loading) or contact Flatfile support for any help.');
        }, 5000);
        this.handshake = Penpal.connectToChild({
            appendTo: document.getElementById("flatfile-" + this.uuid) || undefined,
            url: FlatfileImporter.MOUNT_URL.replace(':key', this.apiKey),
            methods: {
                results: function (data) {
                    _this.emit('results', data.results, data.meta);
                },
                complete: function (data) {
                    _this.emit('complete', data.rows, data.meta);
                },
                close: function () {
                    _this.emit('close');
                    _this.handleClose();
                },
                networkErrorCallback: function (error) {
                    return _this.$networkErrorCallback ? _this.$networkErrorCallback(error) : undefined;
                },
                beforeFetchCallback: function (req) {
                    return _this.$beforeFetchCallback ? _this.$beforeFetchCallback(req) : undefined;
                },
                interactionEventCallback: function (req) {
                    return _this.$interactionEventCallback ? _this.$interactionEventCallback(req) : undefined;
                },
                dataHookCallback: function (row, index, mode) {
                    try {
                        return _this.$recordHook ? _this.$recordHook(row, index, mode) : undefined;
                    }
                    catch (_a) {
                        var message = _a.message, stack = _a.stack;
                        console.error("Flatfile Record Hook Error on row " + index + ":\n  " + stack, { row: row, mode: mode });
                        return {};
                    }
                },
                bulkHookCallback: function (rows, mode) {
                    try {
                        if (_this.UserBulkInitHook) {
                            return _this.UserBulkInitHook(rows, mode);
                        }
                        var hooks = _this.$recordHook
                            ? Promise.all(rows.map(function (_a) {
                                var row = _a[0], index = _a[1];
                                try {
                                    var hook = _this.$recordHook(row, index, mode);
                                    return hook;
                                }
                                catch (e) {
                                    e.row = row;
                                    e.index = index;
                                    throw e;
                                }
                            }))
                            : undefined;
                        return hooks;
                    }
                    catch (_a) {
                        var stack = _a.stack, row = _a.row, index = _a.index;
                        console.error("Flatfile Record Hook Error on row " + index + ":\n  " + stack, { row: row, mode: mode });
                        return {};
                    }
                },
                fieldHookCallback: function (values, meta) {
                    var fieldHook = _this.$fieldHooks.find(function (v) { return v.field === meta.field; });
                    if (!fieldHook) {
                        return undefined;
                    }
                    try {
                        return fieldHook.cb(values, meta);
                    }
                    catch (_a) {
                        var stack = _a.stack;
                        console.error("Flatfile Field Hook Error on field \"" + meta.field + "\":\n  " + stack, {
                            meta: meta,
                            values: values
                        });
                        return [];
                    }
                },
                stepHookCallback: function (step, payload) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, stack;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!this.$stepHooks[step]) {
                                    return [2 /*return*/, undefined];
                                }
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, this.$stepHooks[step](payload)];
                            case 2: return [2 /*return*/, _b.sent()];
                            case 3:
                                _a = _b.sent();
                                stack = _a.stack;
                                console.error("Flatfile Step Hook Error on step \"" + step + "\":\n  " + stack, {
                                    payload: payload
                                });
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
                ready: function () {
                    _this.handshake.promise
                        .then(function (child) {
                        _this.$resolver(child);
                        if (_this.customer) {
                            child.setUser(_this.customer);
                        }
                    })
                        .catch(function (err) {
                        console.error(err);
                    });
                    return _this.options;
                }
            }
        });
        this.handshake.promise.then(function () {
            if (timeout)
                clearTimeout(timeout);
        });
        this.handshake.promise.catch(function (err) {
            _this.$rejecter(err);
        });
    };
    FlatfileImporter.prototype.$generateUuid = function () {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };
    FlatfileImporter.prototype.responsePromise = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var loadResolveHandler = function (rows, meta) { return __awaiter(_this, void 0, void 0, function () {
                var results;
                return __generator(this, function (_a) {
                    results = new Results(rows, meta, this);
                    resolve(results);
                    cleanup();
                    return [2 /*return*/];
                });
            }); };
            function loadRejectHandler(err) {
                reject(err);
                cleanup();
            }
            var self = _this;
            function cleanup() {
                self.removeListener('close', loadRejectHandler);
                self.removeListener('results', loadResolveHandler);
            }
            _this.on('close', loadRejectHandler);
            _this.on('results', loadResolveHandler);
        });
    };
    FlatfileImporter.Promise = Promise;
    FlatfileImporter.MOUNT_URL = 'https://portal-2.flatfile.io/?key=:key';
    return FlatfileImporter;
}(eventemitter3_1));

registerDocumentContainsPolyfill();

module.exports = FlatfileImporter$1;
//# sourceMappingURL=index.cjs.js.map
