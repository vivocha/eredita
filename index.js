'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deepExtend = deepExtend;
exports.mixin = mixin;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isArray = Array.isArray || function (obj) {
  return Object.prototype.toString.call(arg) === '[object Array]';
};
var isObject = function isObject(obj) {
  return obj === Object(obj);
};

function deepExtend() {
  if (arguments.length < 1 || _typeof(arguments[0]) !== 'object') {
    return false;
  } else if (arguments.length < 2) {
    return arguments[0];
  }

  var target = arguments[0];
  var args = Array.prototype.slice.call(arguments, 1);
  var key, val, src, clone, tmpBuf;

  args.forEach(function (obj) {
    if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') return;

    for (key in obj) {
      if (!(key in obj)) continue;
      src = target[key];
      val = obj[key];

      if (val === target) continue;

      if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) !== 'object' || val === null) {
        target[key] = val;
        continue;
      } else if (val instanceof Buffer) {
        tmpBuf = new Buffer(val.length);
        val.copy(tmpBuf);
        target[key] = tmpBuf;
        continue;
      } else if (val instanceof Date) {
        target[key] = new Date(val.getTime());
        continue;
      }

      if ((typeof src === 'undefined' ? 'undefined' : _typeof(src)) !== 'object' || src === null) {
        clone = isArray(val) ? [] : {};
        target[key] = deepExtend(clone, val);
        continue;
      }

      if (isArray(val)) {
        clone = isArray(src) ? src : [];
      } else {
        clone = !isArray(src) ? src : {};
      }

      target[key] = deepExtend(clone, val);
    }
  });

  return target;
}

function mixin() {
  return {
    deepExtend: deepExtend
  };
}

var Templater = exports.Templater = function () {
  function Templater(data, parent) {
    _classCallCheck(this, Templater);

    this.data = data;
    this.parent = parent;
    this.dirty = false;
  }

  _createClass(Templater, [{
    key: 'dot',
    value: function dot(path, value) {
      var parts = path ? path.split('.') : [];
      var ref = this.data;
      if (typeof value === 'undefined') {
        for (var i = 0, max = parts.length; typeof ref !== 'undefined' && i < max; i++) {
          ref = ref[parts[i]];
        }
      } else {
        for (var i = 0, max = parts.length - 1, p = null; p = parts[i], i < max; i++) {
          if (_typeof(ref[p]) !== 'object') {
            ref[p] = parseInt(parts[i + 1]) || parts[i + 1] == 0 ? [] : {};
          }
          ref = ref[p];
        }
        ref[p] = value;
        ref = ref[p];
      }
      return ref;
    }
  }, {
    key: 'getPath',
    value: function getPath(path) {
      var v = this.dot(path);
      return typeof v === 'undefined' ? this.parent ? this.parent.get(path) : undefined : v;
    }
  }, {
    key: 'getTypedPath',
    value: function getTypedPath(path, _type, _default) {
      var v = this.get(path);
      if (isObject(v) && !isArray(v)) {
        var type = _type.toLowerCase();
        if (typeof v[type] !== 'undefined') {
          return v[type];
        } else if (_default) {
          return v[_default];
        } else {
          return undefined;
        }
      } else {
        return v;
      }
    }
  }, {
    key: 'setPath',
    value: function setPath(path, value) {
      this.dirty = true;
      return this.dot(path, value);
    }
  }, {
    key: 'unsetPath',
    value: function unsetPath(path) {
      return this.set(path, null);
    }
  }, {
    key: 'mergePath',
    value: function mergePath(path) {
      var p = this.parent;
      var _parent = p ? p.merge(path) : null;
      var _self = this.get(path);
      if (!_parent) {
        return deepExtend({}, _self);
      } else {
        return deepExtend(_parent, _self);
      }
    }
  }, {
    key: 'isDirty',
    value: function isDirty() {
      return this.dirty;
    }
  }]);

  return Templater;
}();

//# sourceMappingURL=index.js.map