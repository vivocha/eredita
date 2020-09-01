const chai = require('chai'),
  spies = require('chai-spies'),
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should(),
  lodash = require('lodash'),
  underscore = require('underscore'),
  eredita = require('../dist/index'),
  Eredita = eredita.Eredita;

chai.use(spies);
chai.use(chaiAsPromised);

describe('eredita', function () {
  describe('constructor', function () {
    it('should create an instance of Eredita with an empty object and no parent', function () {
      let data = {};
      let e = new Eredita(data);
      e.should.be.instanceOf(Eredita);
      e.data.should.equal(data);
      should.not.exist(e.parent);
    });

    it('should create an instance of Eredita with an empty object and a parent', function () {
      let data = {};
      let e1 = new Eredita(data);
      let e2 = new Eredita(data, e1);
      e2.parent.should.equal(e1);
    });

    it('should fail to create an instance of Eredita with an undefined object', function () {
      should.throw(
        function () {
          new Eredita();
        },
        Error,
        'missing data'
      );
    });
  });

  describe('dot', function () {
    let e1 = new Eredita({
      a: {
        b: {
          c: true,
          d: 5,
          e: 'pippo',
          f: [
            {
              g: true,
            },
          ],
        },
      },
    });
    let e2 = new Eredita(
      {
        a: {
          b: {
            c: false,
            d: 6,
          },
        },
      },
      e1
    );

    it('should return the root object if no path is specified', function () {
      e1.dot().should.equal(e1.data);
    });

    it('should return a nested variable from a dotted path (no parent)', function () {
      e1.dot('a.b.c').should.equal(true);
      e1.dot('a.b.e').should.equal('pippo');
      e1.dot('a.b.e').should.equal(e1.data.a.b.e);
    });

    it('should return a nested variable from a dotted path (with parent)', function () {
      e2.dot('a.b.c').should.equal(false);
      should.not.exist(e2.dot('a.b.e'));
    });

    it('should set a value to a new property given a dotted path (no parent)', function () {
      e1.dot('a.b.h', 10);
      e1.dot('a.b.h').should.equal(10);
      e1.dot('a.b.h').should.equal(e1.data.a.b.h);
    });

    it('should set a value to an existing property given a dotted path (no parent)', function () {
      e1.dot('a.b.h', 11);
      e1.dot('a.b.h').should.equal(11);
      e1.dot('a.b.h').should.equal(e1.data.a.b.h);
    });

    it('should not fail when setting a path that is not transversable', function () {
      e1.dot('a.b.c.z', 100);
      e1.data.a.b.c.should.be.a('object');
      e1.data.a.b.c.z.should.equal(100);
    });

    it('should create an array when a dotted path has a numeric part', function () {
      e1.dot('a.b.i.0.j', 'aaa');
      e1.data.a.b.i.should.deep.equal([{ j: 'aaa' }]);
    });
  });

  describe('getPath', function () {
    let e1 = new Eredita({
      a: {
        b: {
          c: true,
          d: 5,
          e: 'pippo',
          f: [
            {
              g: true,
            },
          ],
        },
      },
    });
    let e2 = new Eredita(
      {
        a: {
          b: {
            c: false,
            d: 6,
          },
        },
      },
      e1
    );

    it('should not fail when requested a non-existent path (no parent)', function () {
      should.not.exist(e1.getPath('a.b.z'));
    });

    it('should return a nested variable from a dotted path (with parent)', function () {
      e2.getPath('a.b.c').should.equal(false);
      e2.getPath('a.b.e').should.equal('pippo');
      e2.getPath('a.b.f.0.g').should.equal(true);
    });
  });

  describe('getTypedPath', function () {
    var e1 = new Eredita({
      greet: {
        it: 'ciao',
        en: 'hi',
      },
      title: 'mr',
    });

    var e2 = new Eredita(
      {
        greet: {
          fr: 'salut',
        },
      },
      e1
    );

    it('should return the correct typed-path if defined', function () {
      e1.getTypedPath('greet', 'it', 'en').should.equal('ciao');
    });

    it('should return an undefined value if the typed-path is not defined and no default is provided', function () {
      should.not.exist(e1.getTypedPath('greet', 'fr'));
    });

    it('should return the default value if the typed-path is not defined', function () {
      e1.getTypedPath('greet', 'fr', 'en').should.equal('hi');
    });

    it('should return the correct typed-path if defined in a derived object', function () {
      e2.getTypedPath('greet', 'fr', 'en').should.equal('salut');
    });

    it('should return the raw value if the requested path is not a typed-path', function () {
      e2.getTypedPath('title', 'fr', 'en').should.equal('mr');
    });
  });

  describe('setPath', function () {
    let e1 = new Eredita({
      a: {
        b: {
          c: true,
        },
      },
    });
    let e2 = new Eredita({}, e1);

    it('should set the specified value and mark the object as dirty (no parent)', function () {
      e1.dirty.should.equal(false);
      e1.setPath('a.b.d', 10);
      e1.getPath('a.b.d').should.equal(10);
      e2.getPath('a.b.d').should.equal(10);
      e1.dirty.should.equal(true);
    });

    it('should set the specified value and mark the object as dirty (with parent)', function () {
      e2.setPath('a.b.c', false);
      e2.getPath('a.b.c').should.equal(false);
      e1.getPath('a.b.c').should.equal(true);
      e2.dirty.should.equal(true);
    });
  });

  describe('unsetPath', function () {
    it('should unset a path', function () {
      let e = new Eredita({ a: true });
      e.unsetPath('a');
      should.not.exist(e.data.a);
    });
  });

  describe('mergePath', function () {
    let d1 = {
      a: true,
      b: 10,
      c: {
        d: 'pippo',
        e: ['aaa'],
        f: { g: true },
      },
    };
    let d2 = {
      b: 11,
      c: {
        e: ['bbb'],
        f: 'ccc',
      },
      i: 'ddd',
    };

    it('should return an equivalent object as in data when no path is specified (no parent)', function () {
      let d = JSON.parse(JSON.stringify(d1));
      let e = new Eredita(d);
      e.mergePath().should.deep.equal(d);
    });

    it('should return an equivalent object to a branch of data when a path is specified (no parent)', function () {
      let d = JSON.parse(JSON.stringify(d1));
      let e = new Eredita(d);
      e.mergePath('c.f').should.deep.equal(d.c.f);
    });

    it('should merge a full object with its parent, when no path is specified', function () {
      let d1_1 = JSON.parse(JSON.stringify(d1));
      let e1 = new Eredita(d1_1);
      let d2_1 = JSON.parse(JSON.stringify(d2));
      let e2 = new Eredita(d2_1, e1);

      e2.mergePath().should.deep.equal({
        a: true,
        b: 11,
        c: {
          d: 'pippo',
          e: ['bbb'],
          f: 'ccc',
        },
        i: 'ddd',
      });
    });
  });

  describe('isDirty', function () {
    let e = new Eredita({ a: true });

    it('should return false on a newly created object', function () {
      e.isDirty().should.equal(false);
    });

    it('should return true after a change', function () {
      e.setPath('b', 5);
      e.isDirty().should.equal(true);
    });
  });

  describe('deepExtend', function () {
    it('should throw if no target is specified', function () {
      should.throw(
        function () {
          Eredita.deepExtend();
        },
        Error,
        'missing target'
      );
    });

    it('should throw if target is not an object', function () {
      should.throw(
        function () {
          Eredita.deepExtend(true);
        },
        Error,
        'invalid target'
      );
    });

    it('should throw if an argument is not an object', function () {
      should.throw(
        function () {
          Eredita.deepExtend({}, {}, true, {});
        },
        Error,
        'invalid argument'
      );
    });

    it('should return target if no other argument is passed', function () {
      let t = { x: true };
      Eredita.deepExtend(t).should.equal(t);
    });

    it('should detect loops and skip them', function () {
      let t = { a: true, b: false };
      let a = { c: 1, d: t };
      Eredita.deepExtend(t, a).should.deep.equal({
        a: true,
        b: false,
        c: 1,
      });
    });

    it('should clone Buffer and Date instances', function () {
      let t = { a: true };
      let a = { b: Buffer.from('aaa'), c: 1, d: new Date() };
      let e = Eredita.deepExtend(t, a);
      e.b.should.not.equal(a.b);
      e.b.should.be.instanceOf(Buffer);
      e.d.should.not.equal(a.d);
      e.d.should.be.instanceOf(Date);
    });

    it('should merge arrays overriding existing element positions', function () {
      let t = { a: ['aaa', 'bbb', 'ccc'] };
      let a = { a: ['ddd'] };
      Eredita.deepExtend(t, a).should.deep.equal({ a: ['ddd', 'bbb', 'ccc'] });
    });

    it('should produce an array when merging an array to a non array', function () {
      let t = { a: {} };
      let a = { a: ['ddd'] };
      Eredita.deepExtend(t, a).should.deep.equal({ a: ['ddd'] });
    });

    it('should produce an object when merging an object to a non object', function () {
      let t = { a: [] };
      let a = { a: { b: 1 } };
      Eredita.deepExtend(t, a).should.deep.equal({ a: { b: 1 } });
    });
  });

  describe('mixin', function () {
    it('should extend lodash with deepExtend', function () {
      lodash.mixin(eredita.mixin());
      lodash.deepExtend({ a: true }, { b: 10 }).should.deep.equal({ a: true, b: 10 });
    });

    it('should extend underscore with deepExtend', function () {
      underscore.mixin(eredita.mixin());
      underscore.deepExtend({ a: true }, { b: 10 }).should.deep.equal({ a: true, b: 10 });
    });
  });
});
