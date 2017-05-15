const isArray = Array.isArray;
const isObject = function(obj) {
  return obj === Object(obj);
};

export class Eredita {
  dirty: boolean = false;
  constructor(protected data: any, protected parent?: Eredita) {
    if (!this.data) throw new Error('missing data');
  }
  protected dot(path: string, value?: any): any {
    return Eredita.dot(this.data, path, value);
  }
  getPath(path: string): any {
    let v = this.dot(path);
    return typeof v === 'undefined' ? (this.parent ? this.parent.getPath(path): undefined) : v;
  }
  getTypedPath(path: string, type: string, def?: any): any {
    let v = this.getPath(path);
    if (isObject(v) && !isArray(v)) {
      const _type = type.toLowerCase();
      if (typeof v[_type] !== 'undefined') {
        return v[_type];
      } else if (def) {
        return v[def];
      } else {
        return undefined;
      }
    } else {
      return v;
    }
  }
  setPath(path: string, value: any): any {
    this.dirty = true;
    return this.dot(path, value);
  }
  unsetPath(path: string): any {
    return this.setPath(path, null);
  }
  mergePath(path: string): any {
    let p = this.parent;
    let _parent = p ? p.mergePath(path) : null;
    let _self = this.getPath(path);
    if (!_parent) {
      return Eredita.deepExtend({}, _self);
    } else {
      return Eredita.deepExtend(_parent, _self);
    }
  }
  isDirty(): boolean {
    return this.dirty;
  }

  static dot(data: any, path: string, value?: any): any {
    const parts = path ? path.split('.') : [];
    let ref = data;
    if (typeof value === 'undefined') {
      for (let i = 0, max = parts.length ; typeof ref !== 'undefined' && i < max; i++) {
        ref = ref[parts[i]];
      }
    } else {
      let p = null;
      for (let i = 0, max = parts.length - 1 ; p = parts[i], i < max; i++) {
        if (typeof ref[p] !== 'object') {
          ref[p] = (parseInt(parts[i + 1]) || parts[i + 1] == '0') ? [] : {};
        }
        ref = ref[p];
      }
      ref[p] = value;
      ref = ref[p];
    }
    return ref;
  }
  static deepExtend(target: any, ...args: object[]): any {
    if (!target) {
      throw new Error('missing target');
    } else if (typeof target !== 'object') {
      throw new Error('invalid target');
    } else if (!args.length) {
      return target;
    }

    let key, val, src, clone, tmpBuf;

    for (let obj of args) {
      if (typeof obj !== 'object') {
        throw new Error('invalid argument');
      }

      for (key in obj) {
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
          target[key] = Eredita.deepExtend(clone, val);
          continue;
        }

        if (isArray(val)) {
          clone = (isArray(src)) ? src : [];
        } else {
          clone = (!isArray(src)) ? src : {};
        }

        target[key] = Eredita.deepExtend(clone, val);
      }
    }

    return target;
  }
}

export const deepExtend = Eredita.deepExtend;

export function mixin() {
  return {
    deepExtend
  }
}
