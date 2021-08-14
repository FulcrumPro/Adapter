"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = registerDocumentContainsPolyfill;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQuY29udGFpbnMucG9seWZpbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZG9jdW1lbnQuY29udGFpbnMucG9seWZpbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNLFFBQVEsR0FBRyxVQUFVLEtBQUs7SUFDOUIsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUN4QixNQUFNLElBQUksU0FBUyxDQUFDLHdCQUF3QixDQUFDLENBQUE7S0FDOUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUM3QixNQUFNLElBQUksU0FBUyxDQUFDLG1FQUFtRSxDQUFDLENBQUE7S0FDekY7SUFFRCxJQUFJLElBQUksR0FBRyxLQUFLLENBQUE7SUFDaEIsR0FBRztRQUNELElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNqQixPQUFPLElBQUksQ0FBQTtTQUNaO1FBQ0QsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQTtTQUN2QjtLQUNGLFFBQVEsSUFBSSxFQUFDO0lBRWQsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDLENBQUE7QUFFRCxTQUF3QixnQ0FBZ0M7SUFDdEQsMkJBQTJCO0lBQzNCLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLE9BQU8sUUFBUSxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUU7UUFDM0UsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO0tBQ3BEO0FBQ0gsQ0FBQztBQUxELG1EQUtDIn0=