// Copyright (c) 2011 Kevin Rabsatt
//
// An iteration wrapper that can pass calls to the wrapped list.

/**
 * Calls any functions defined on a class on all items.
 *
 * @param {class}  The type of items.
 * @param {Array}  An array of items to wrap.
 * @constructor
 */
function Iterator(wrapped, items) {
  this._items = items;
  for (f in wrapped.prototype) {
    if (typeof(wrapped.prototype[f]) == 'function') {
      // Doing this in a function call to create a clean closure.
      // Creating the function here causes f to change value
      // in the scope of the generated function.
      this.addFunction(f);
    }
  }
};

/**
 * Allows the wrapper to expose a method on the wrapped type.
 *
 * @param {string} f  The name of the function to expose.
 */
Iterator.prototype.addFunction = function(f) {
  this[f] = function() {
    for (var i = 0; i < this._items.length; ++i) {
      var item = this._items[i];
      item[f].apply(item, arguments);
    }
    return this;
  };
};

/**
 * Calls a function on each wrapped item.
 *
 * @param {function} f  A function to call on each item.
 */
Iterator.prototype.each = function(f) {
  for (var i = 0; i < this._items.length; ++i) {
    f(this._items[i], i);
  }
  return this;
};
