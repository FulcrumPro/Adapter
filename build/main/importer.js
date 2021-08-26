"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlatfileImporter = void 0;
var tslib_1 = require("tslib");
var eventemitter3_1 = require("eventemitter3");
var when_dom_ready_1 = require("when-dom-ready");
var insert_css_1 = require("insert-css");
var element_class_1 = require("element-class");
var penpal_1 = require("penpal");
var results_1 = require("./results");
var FlatfileImporter = /** @class */ (function (_super) {
    tslib_1.__extends(FlatfileImporter, _super);
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
        when_dom_ready_1.default(function () {
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
        options = tslib_1.__assign(tslib_1.__assign({}, options), { bulkInit: true, hasRecordHook: !!this.$recordHook, hasInteractionEventCallback: !!this.$interactionEventCallback, stepHooks: Object.keys(this.$stepHooks), fieldHooks: this.$fieldHooks.map(function (v) { return v.field; }), endUser: this.customer });
        this.$ready.then(function (child) {
            element_class_1.default(document.body).add('flatfile-active');
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
        this.open(tslib_1.__assign(tslib_1.__assign({}, options), { inChunks: options.inChunks || null, expectsExpandedResults: true }));
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
        element_class_1.default(document.body).remove('flatfile-active');
        var el = document.getElementById("flatfile-" + this.uuid);
        if (el) {
            el.style.display = 'none';
        }
    };
    FlatfileImporter.prototype.initialize = function () {
        var _this = this;
        insert_css_1.default("\n      .flatfile-component {\n        position: fixed;\n        top: 0;\n        bottom: 0;\n        right: 0;\n        left: 0;\n        display: none;\n        z-index: 100000;\n      }\n      .flatfile-component iframe {\n        width: 100%;\n        height: 100%;\n        position: absolute;\n        border-width: 0;\n      }\n      body.flatfile-active {\n        overflow: hidden;\n        overscroll-behavior-x: none;\n      }\n    ");
        document.body.insertAdjacentHTML('beforeend', "<div id=\"flatfile-" + this.uuid + "\" class=\"flatfile-component\"></div>");
        var timeout = setTimeout(function () {
            return console.error('[Flatfile] Looks like Portal takes too long to load. Please visit our Help Center (https://help.flatfile.io/support/solutions/articles/64000263381-my-importer-isn-t-loading) or contact Flatfile support for any help.');
        }, 5000);
        this.handshake = penpal_1.default.connectToChild({
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
                stepHookCallback: function (step, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var _a, stack;
                    return tslib_1.__generator(this, function (_b) {
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
            var loadResolveHandler = function (rows, meta) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var results;
                return tslib_1.__generator(this, function (_a) {
                    results = new results_1.Results(rows, meta, this);
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
}(eventemitter3_1.EventEmitter));
exports.FlatfileImporter = FlatfileImporter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW1wb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLCtDQUE0QztBQUM1QyxpREFBeUM7QUFDekMseUNBQWtDO0FBQ2xDLCtDQUF3QztBQUN4QyxpQ0FBMkI7QUFnQjNCLHFDQUFtQztBQUVuQztJQUFzQyw0Q0FBWTtJQStCaEQsMEJBQVksTUFBYyxFQUFFLE9BQWtCLEVBQUUsUUFBeUI7UUFBekUsWUFDRSxpQkFBTyxTQWFSO1FBakJPLGlCQUFXLEdBQW9ELEVBQUUsQ0FBQTtRQUNqRSxnQkFBVSxHQUFjLEVBQWUsQ0FBQTtRQUk3QyxLQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtRQUNwQixLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixLQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtRQUN4QixLQUFJLENBQUMsSUFBSSxHQUFHLEtBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtRQUNoQyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDekQsS0FBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUE7WUFDeEIsS0FBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7UUFDekIsQ0FBQyxDQUFDLENBQUE7UUFFRix3QkFBWSxDQUFDO1lBQ1gsS0FBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ25CLENBQUMsQ0FBQyxDQUFBOztJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ1csNEJBQVcsR0FBekIsVUFBMEIsR0FBVztRQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQTtJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDVywyQkFBVSxHQUF4QixVQUF5QixPQUFjO1FBQ3JDLFFBQVEsT0FBTyxFQUFFO1lBQ2YsS0FBSyxDQUFDO2dCQUNKLElB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