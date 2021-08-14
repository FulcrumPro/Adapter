"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Results = void 0;
var stats_1 = require("./stats");
var user_1 = require("./user");
var upload_file_1 = require("./upload-file");
var streamed_results_1 = require("./streamed-results");
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
        this.stats = new stats_1.Stats(this.$meta);
        this.customer = this.$meta.endUser ? new user_1.EndUser(this.$meta.endUser) : null;
        this.originalFile = this.$meta.originalFile ? new upload_file_1.UploadFile(this.$meta.originalFile) : null;
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
                return new upload_file_1.UploadFile(this.$meta.originalFile);
            }
            else {
                if (this.$meta.csvFile) {
                    return new upload_file_1.UploadFile(this.$meta.csvFile);
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
                    resolve(data.results.length ? new streamed_results_1.StreamedResults(data.results, data.meta) : null);
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
exports.Results = Results;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZXN1bHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlDQUErQjtBQUUvQiwrQkFBZ0M7QUFDaEMsNkNBQTBDO0FBQzFDLHVEQUFvRDtBQUdwRDtJQXVKRSxpQkFBWSxJQUF5QixFQUFFLElBQVUsRUFBRSxRQUEwQjtRQUE3RSxpQkFnREM7UUEvQ0MsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7UUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7UUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUE7UUFFekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUE7UUFFdkQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUM1QixJQUFJLENBQUMsS0FBSzthQUNQLE1BQU0sQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxLQUFLLEVBQVAsQ0FBTyxDQUFDO2FBQ3RCLE1BQU0sQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBVixDQUFVLENBQUM7YUFDekIsR0FBRyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLElBQUksRUFBTixDQUFNLENBQUMsRUFDckIsV0FBVyxDQUNaLENBQUE7UUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUVqRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE9BQU8sRUFBVCxDQUFTLENBQUMs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