'use strict';

var isArray = Array.isArray || function(obj) {
  return Object.prototype.toString.call( arg ) === '[object Array]';
}
var isObject = function(obj) {
  return obj === Object(obj);
}

export function deepExtend() {
  if (arguments.length < 1 || typeof arguments[0] !== 'object') {
    return false;
  } else if (arguments.length < 2) {
    return arguments[0];
  }

  var target = arguments[0];
  var args = Array.prototype.slice.call(arguments, 1);
  var key, val, src, clone, tmpBuf;

  args.forEach(function (obj) {
    if (typeof obj !== 'object') return;

    for (key in obj) {
      if ( ! (key in obj)) continue;
      src = target[key];
      val = obj[key];

      if (val === target) continue;

      if (typeof val !== 'object' || val === null) {
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

      if (typeof src !== 'object' || src === null) {
        clone = (isArray(val)) ? [] : {};
        target[key] = deepExtend(clone, val);
        continue;
      }

      if (isArray(val)) {
        clone = (isArray(src)) ? src : [];
      } else {
        clone = (!isArray(src)) ? src : {};
      }

      target[key] = deepExtend(clone, val);
    }
  });

  return target;
}

export function mixin() {
  return {
    deepExtend
  }
}
export class Templater {
  constructor(data, parent) {
    this.data = data;
    this.parent = parent;
    this.dirty = false;
  }
  dot(path, value) {
    var parts = path ? path.split('.') : [];
    var ref = this.data;
    if (typeof value === 'undefined') {
      for (var i = 0, max = parts.length ; typeof ref !== 'undefined' && i < max; i++) {
        ref = ref[parts[i]];
      }
    } else {
      for (var i = 0, max = parts.length - 1, p = null ; p = parts[i], i < max; i++) {
        if (typeof ref[p] !== 'object') {
          ref[p] = (parseInt(parts[i + 1]) || parts[i + 1] == 0) ? [] : {};
        }
        ref = ref[p];
      }
      ref[p] = value;
      ref = ref[p];
    }
    return ref;
  }
  getPath(path) {
    var v = this.dot(path);
    return typeof v === 'undefined' ? (this.parent ? this.parent.get(path): undefined) : v;
  }
  getTypedPath(path, _type, _default) {
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
  setPath(path, value) {
    this.dirty = true;
    return this.dot(path, value);
  }
  unsetPath(path) {
    return this.set(path, null);
  }
  mergePath(path) {
    var p = this.parent;
    var _parent = p ? p.merge(path) : null;
    var _self = this.get(path);
    if (!_parent) {
      return deepExtend({}, _self);
    } else {
      return deepExtend(_parent, _self);
    }
  }
  isDirty() {
    return this.dirty;
  }
}
