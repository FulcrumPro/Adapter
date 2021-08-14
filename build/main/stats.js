"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stats = void 0;
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
exports.Stats = Stats;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RhdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUE7SUF1QkUsZUFBWSxJQUFVO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1FBRWpCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUE7UUFDekMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQTtRQUMxRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQTtRQUN2RCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFBO0lBQ2hFLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FBQyxBQS9CRCxJQStCQztBQS9CWSxzQkFBSyJ9