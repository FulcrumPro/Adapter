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
    FlatfileImporter.setUserBulkInitHook = function (cb) {
        FlatfileImporter.UserBulkInitHook = cb;
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
                        if (FlatfileImporter.UserBulkInitHook) {
                            return FlatfileImporter.UserBulkInitHook(rows, mode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW1wb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLCtDQUE0QztBQUM1QyxpREFBeUM7QUFDekMseUNBQWtDO0FBQ2xDLCtDQUF3QztBQUN4QyxpQ0FBMkI7QUFnQjNCLHFDQUFtQztBQUVuQztJQUFzQyw0Q0FBWTtJQStCaEQsMEJBQVksTUFBYyxFQUFFLE9BQWtCLEVBQUUsUUFBeUI7UUFBekUsWUFDRSxpQkFBTyxTQWFSO1FBakJPLGlCQUFXLEdBQW9ELEVBQUUsQ0FBQTtRQUNqRSxnQkFBVSxHQUFjLEVBQWUsQ0FBQTtRQUk3QyxLQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtRQUNwQixLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixLQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtRQUN4QixLQUFJLENBQUMsSUFBSSxHQUFHLEtBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtRQUNoQyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDekQsS0FBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUE7WUFDeEIsS0FBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7UUFDekIsQ0FBQyxDQUFDLENBQUE7UUFFRix3QkFBWSxDQUFDO1lBQ1gsS0FBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ25CLENBQUMsQ0FBQyxDQUFBOztJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ1csNEJBQVcsR0FBekIsVUFBMEIsR0FBVztRQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQTtJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDVywyQkFBVSxHQUF4QixVQUF5QixPQUFjO1FBQ3JDLFFBQVEsT0FBTyxFQUFFO1lBQ2YsS0FBSyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLEdBQUcsMENBQTBDLENBQUE7Z0JBQzNELE1BQUs7WUFDUCxLQUFLLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFNBQVMsR0FBRyx3Q0FBd0MsQ0FBQTtnQkFDekQsTUFBSztZQUNQO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUksT0FBTyw0QkFBeUIsQ0FBQyxDQUFBO1NBQ3ZEO0lBQ0gsQ0FBQztJQUVhLG9DQUFtQixHQUFqQyxVQUFrQyxFQUE2QztRQUU3RSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDekMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsK0JBQUksR0FBSixVQUFLLE9BQVk7UUFBakIsaUJBa0JDO1FBbEJJLHdCQUFBLEVBQUEsWUFBWTtRQUNmLE9BQU8seUNBQ0YsT0FBTyxLQUNWLFFBQVEsRUFBRSxJQUFJLEVBQ2QsYUFBYSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUNqQywyQkFBMkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUM3RCxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQ3ZDLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxLQUFLLEVBQVAsQ0FBTyxDQUFDLEVBQ2hELE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxHQUN2QixDQUFBO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLO1lBQ3JCLHVCQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1lBQ2xELElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBWSxLQUFJLENBQUMsSUFBTSxDQUFDLENBQUE7WUFDekQsSUFBSSxFQUFFLEVBQUU7Z0JBQ04sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO2FBQzNCO1lBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNyQixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsK0JBQUksR0FBSjtRQUFBLGlCQXNCQztRQXJCQyxPQUFPLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDbEQsS0FBSSxDQUFDLElBQUksRUFBRSxDQUFBO1lBRVgsSUFBTSxPQUFPLEdBQUc7Z0JBQ2QsS0FBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtnQkFDL0MsS0FBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtZQUNyRCxDQUFDLENBQUE7WUFFRCxTQUFTLGtCQUFrQixDQUFDLElBQW1CO2dCQUM3QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ2IsT0FBTyxFQUFFLENBQUE7WUFDWCxDQUFDO1lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxHQUFHO2dCQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ1gsT0FBTyxFQUFFLENBQUE7WUFDWCxDQUFDO1lBRUQsS0FBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtZQUNuQyxLQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO1FBQ3pDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVEOzs7T0FHRztJQUNILDhDQUFtQixHQUFuQixVQUFvQixPQUErQjtRQUEvQix3QkFBQSxFQUFBLFlBQStCO1FBQ2pELElBQUksQ0FBQyxJQUFJLHVDQUFNLE9BQU8sS0FBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxJQUFHLENBQUE7UUFDM0YsT0FBTyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILHdDQUFhLEdBQWIsVUFBYyxHQUFZO1FBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSztZQUNyQixLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzFCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsdUNBQVksR0FBWixVQUFhLEdBQVk7UUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLO1lBQ3JCLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILHFEQUEwQixHQUExQixVQUEyQixHQUFZLEVBQUUsV0FBaUM7UUFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLO1lBQ3JCLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBQ3RDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gseUNBQWMsR0FBZCxVQUFlLEdBQVk7UUFBM0IsaUJBYUM7UUFaQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFDLEtBQUs7WUFDckIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUMzQixDQUFDLENBQUMsQ0FBQTtRQUVGLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPO1lBQ3pCLElBQU0sYUFBYSxHQUFHO2dCQUNwQixPQUFPLEVBQUUsQ0FBQTtnQkFDVCxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtZQUM3QyxDQUFDLENBQUE7WUFFRCxLQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtRQUNqQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILHNDQUFXLEdBQVgsVUFBWSxRQUF3QjtRQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtJQUMxQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxzQ0FBVyxHQUFYLFVBQVksSUFBWTtRQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFDLEtBQUs7WUFDckIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN6QixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCwwQ0FBZSxHQUFmLFVBQWdCLEtBQTZCLEVBQUUsT0FBa0M7UUFBbEMsd0JBQUEsRUFBQSxZQUFrQztRQUMvRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFDLEtBQUs7WUFDckIsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUssT0FBQSxFQUFFLE9BQU8sU0FBQSxFQUFFLENBQUMsQ0FBQTtRQUMzQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILDZDQUFrQixHQUFsQixVQUFtQixRQUF5QztRQUMxRCxJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQTtJQUM3QixDQUFDO0lBRUQsdURBQTRCLEdBQTVCLFVBQTZCLFFBQW1EO1FBQzlFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxRQUFRLENBQUE7SUFDdkMsQ0FBQztJQUVELHNEQUEyQixHQUEzQixVQUE0QixRQUFrRDtRQUM1RSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsUUFBUSxDQUFBO0lBQ3RDLENBQUM7SUFFRCwyREFBZ0MsR0FBaEMsVUFBaUMsUUFBdUQ7UUFDdEYsSUFBSSxDQUFDLHlCQUF5QixHQUFHLFFBQVEsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsNENBQWlCLEdBQWpCLFVBQWtCLEtBQWEsRUFBRSxFQUFxQjtRQUNwRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssT0FBQSxFQUFFLEVBQUUsSUFBQSxFQUFFLENBQUMsQ0FBQTtJQUN0QyxDQUFDO0lBRUQsMkNBQWdCLEdBQWhCLFVBQTRDLElBQU8sRUFBRSxRQUE2QjtRQUNoRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQTtJQUNsQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZ0NBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSztZQUNyQixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDZixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFTyxzQ0FBVyxHQUFuQjtRQUNFLHVCQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1FBQ3JELElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBWSxJQUFJLENBQUMsSUFBTSxDQUFDLENBQUE7UUFDekQsSUFBSSxFQUFFLEVBQUU7WUFDTixFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7U0FDMUI7SUFDSCxDQUFDO0lBRU8scUNBQVUsR0FBbEI7UUFBQSxpQkFnSkM7UUEvSUMsb0JBQVMsQ0FBQyw2YkFvQlQsQ0FBQyxDQUFBO1FBRUYsUUFBUSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FDOUIsV0FBVyxFQUNYLHdCQUFxQixJQUFJLENBQUMsSUFBSSwyQ0FBcUMsQ0FDcEUsQ0FBQTtRQUNELElBQU0sT0FBTyxHQUFHLFVBQVUsQ0FDeEI7WUFDRSxPQUFBLE9BQU8sQ0FBQyxLQUFLLENBQ1gseU5BQXlOLENBQzFOO1FBRkQsQ0FFQyxFQUNILElBQUksQ0FDTCxDQUFBO1FBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxnQkFBTSxDQUFDLGNBQWMsQ0FBQztZQUNyQyxRQUFRLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFZLElBQUksQ0FBQyxJQUFNLENBQUMsSUFBSSxTQUFTO1lBQ3ZFLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzVELE9BQU8sRUFBRTtnQkFDUCxPQUFPLEVBQUUsVUFBQyxJQUFJO29CQUNaLEtBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUMvQyxDQUFDO2dCQUNELFFBQVEsRUFBRSxVQUFDLElBQUk7b0JBQ2IsS0FBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQzdDLENBQUM7Z0JBQ0QsS0FBSyxFQUFFO29CQUNMLEtBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7b0JBQ2xCLEtBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtnQkFDcEIsQ0FBQztnQkFDRCxvQkFBb0IsRUFBRSxVQUFDLEtBQUs7b0JBQzFCLE9BQU8sS0FBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtnQkFDbkYsQ0FBQztnQkFDRCxtQkFBbUIsRUFBRSxVQUFDLEdBQUc7b0JBQ3ZCLE9BQU8sS0FBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtnQkFDL0UsQ0FBQztnQkFDRCx3QkFBd0IsRUFBRSxVQUFDLEdBQUc7b0JBQzVCLE9BQU8sS0FBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtnQkFDekYsQ0FBQztnQkFDRCxnQkFBZ0IsRUFBRSxVQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSTtvQkFDakMsSUFBSTt3QkFDRixPQUFPLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO3FCQUN6RTtvQkFBQyxPQUFPLEVBQWtCLEVBQUU7d0JBQXBCLElBQUUsT0FBTyxhQUFBLEVBQUUsS0FBSyxXQUFFO3dCQUN6QixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUFxQyxLQUFLLGFBQVEsS0FBTyxFQUFFLEVBQUUsR0FBRyxLQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsQ0FBQyxDQUFBO3dCQUV2RixPQUFPLEVBQUUsQ0FBQTtxQkFDVjtnQkFDSCxDQUFDO2dCQUNELGdCQUFnQixFQUFFLFVBQUMsSUFBSSxFQUFFLElBQUk7b0JBQzNCLElBQUk7d0JBQ0YsSUFBSSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRTs0QkFDckMsT0FBTyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7eUJBQ3REO3dCQUVELElBQU0sS0FBSyxHQUFHLEtBQUksQ0FBQyxXQUFXOzRCQUM1QixDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDVCxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUMsRUFBWTtvQ0FBWCxHQUFHLFFBQUEsRUFBRSxLQUFLLFFBQUE7Z0NBQ25CLElBQUk7b0NBQ0YsSUFBTSxJQUFJLEdBQUcsS0FBSSxDQUFDLFdBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO29DQUNoRCxPQUFPLElBQUksQ0FBQztpQ0FDYjtnQ0FBQyxPQUFPLENBQUMsRUFBRTtvQ0FDVixDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQTtvQ0FDWCxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtvQ0FDZixNQUFNLENBQUMsQ0FBQTtpQ0FDUjs0QkFDSCxDQUFDLENBQUMsQ0FDSDs0QkFDSCxDQUFDLENBQUMsU0FBUyxDQUFDO3dCQUNaLE9BQU8sS0FBSyxDQUFDO3FCQUNoQjtvQkFBQyxPQUFPLEVBQXFCLEVBQUU7d0JBQXZCLElBQUUsS0FBSyxXQUFBLEVBQUUsR0FBRyxTQUFBLEVBQUUsS0FBSyxXQUFFO3dCQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUFxQyxLQUFLLGFBQVEsS0FBTyxFQUFFLEVBQUUsR0FBRyxLQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsQ0FBQyxDQUFBO3dCQUV2RixPQUFPLEVBQUUsQ0FBQTtxQkFDVjtnQkFDSCxDQUFDO2dCQUNELGlCQUFpQixFQUFFLFVBQUMsTUFBTSxFQUFFLElBQUk7b0JBQzlCLElBQU0sU0FBUyxHQUFHLEtBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxFQUF0QixDQUFzQixDQUFDLENBQUE7b0JBQ3RFLElBQUksQ0FBQyxTQUFTLEVBQUU7d0JBQ2QsT0FBTyxTQUFTLENBQUE7cUJBQ2pCO29CQUNELElBQUk7d0JBQ0YsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQTtxQkFDbEM7b0JBQUMsT0FBTyxFQUFTLEVBQUU7d0JBQVgsSUFBRSxLQUFLLFdBQUU7d0JBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMENBQXVDLElBQUksQ0FBQyxLQUFLLGVBQVMsS0FBTyxFQUFFOzRCQUMvRSxJQUFJLE1BQUE7NEJBQ0osTUFBTSxRQUFBO3lCQUNQLENBQUMsQ0FBQTt3QkFFRixPQUFPLEVBQUUsQ0FBQTtxQkFDVjtnQkFDSCxDQUFDO2dCQUNELGdCQUFnQixFQUFFLFVBQU8sSUFBSSxFQUFFLE9BQU87Ozs7O2dDQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQ0FDMUIsc0JBQU8sU0FBUyxFQUFBO2lDQUNqQjs7OztnQ0FFUSxxQkFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFBO29DQUEzQyxzQkFBTyxTQUFvQyxFQUFBOzs7Z0NBQ2xDLEtBQUssV0FBQTtnQ0FDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUFxQyxJQUFJLGVBQVMsS0FBTyxFQUFFO29DQUN2RSxPQUFPLFNBQUE7aUNBQ1IsQ0FBQyxDQUFBOzs7OztxQkFFTDtnQkFDRCxLQUFLLEVBQUU7b0JBQ0wsS0FBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPO3lCQUNuQixJQUFJLENBQUMsVUFBQyxLQUFLO3dCQUNWLEtBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ3JCLElBQUksS0FBSSxDQUFDLFFBQVEsRUFBRTs0QkFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7eUJBQzdCO29CQUNILENBQUMsQ0FBQzt5QkFDRCxLQUFLLENBQUMsVUFBQyxHQUFHO3dCQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBQ3BCLENBQUMsQ0FBQyxDQUFBO29CQUNKLE9BQU8sS0FBSSxDQUFDLE9BQU8sQ0FBQTtnQkFDckIsQ0FBQzthQUNGO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQzFCLElBQUksT0FBTztnQkFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBQyxHQUFHO1lBQy9CLEtBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDckIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRU8sd0NBQWEsR0FBckI7UUFDRSxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDbEcsQ0FBQztJQUVPLDBDQUFlLEdBQXZCO1FBQUEsaUJBdUJDO1FBdEJDLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtZQUNqQyxJQUFNLGtCQUFrQixHQUFHLFVBQU8sSUFBeUIsRUFBRSxJQUFZOzs7b0JBQ2pFLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsSUFBSSxFQUFFLElBQVksRUFBRSxJQUFJLENBQUMsQ0FBQTtvQkFDckQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO29CQUNoQixPQUFPLEVBQUUsQ0FBQTs7O2lCQUNWLENBQUE7WUFFRCxTQUFTLGlCQUFpQixDQUFDLEdBQUc7Z0JBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDWCxPQUFPLEVBQUUsQ0FBQTtZQUNYLENBQUM7WUFFRCxJQUFNLElBQUksR0FBRyxLQUFJLENBQUE7WUFFakIsU0FBUyxPQUFPO2dCQUNkLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUE7Z0JBQy9DLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDLENBQUE7WUFDcEQsQ0FBQztZQUVELEtBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUE7WUFDbkMsS0FBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtRQUN4QyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFuYmEsd0JBQU8sR0FBRyxPQUFPLENBQUE7SUFDaEIsMEJBQVMsR0FBVyx3Q0FBd0MsQ0FBQTtJQW1iN0UsdUJBQUM7Q0FBQSxBQXJiRCxDQUFzQyw0QkFBWSxHQXFiakQ7QUFyYlksNENBQWdCIn0=