const chai = require('chai')
  , spies = require('chai-spies')
  , chaiAsPromised = require('chai-as-promised')
  , should = chai.should()
  , _ = require('lodash')
  , eredita = require('../dist/index')
  , Eredita = eredita.Eredita

chai.use(spies);
chai.use(chaiAsPromised);

describe('eredita', function() {

  describe('constructor', function() {

    it('should create an instance of Eredita with an empty object and no parent', function() {
      let data = {};
      let e = new Eredita(data);
      e.should.be.instanceOf(Eredita);
      e.data.should.equal(data);
      should.not.exist(e.parent);
    });

    it('should create an instance of Eredita with an empty object and a parent', function() {
      let data = {};
      let e1 = new Eredita(data);
      let e2 = new Eredita(data, e1);
      e2.parent.should.equal(e1);
    });

    it('should fail to create an instance of Eredita with an undefined object', function() {
      should.throw(function() {
        new Eredita();
      }, Error, 'missing data');
    });

  });

  describe('dot', function() {
    let e1 = new Eredita({
      a: {
        b: {
          c: true,
          d: 5,
          e: 'pippo',
          f: [
            {
              g: true
            }
          ]
        }
      }
    });
    let e2 = new Eredita({
      a: {
        b: {
          c: false,
          d: 6
        }
      }
    }, e1);

    it('should return the root object if no path is specified', function() {
      e1.dot().should.equal(e1.data);
    });

    it('should return a nested variable in form a dotted path (no parent)', function() {
      e1.dot('a.b.c').should.equal(true);
      e1.dot('a.b.e').should.equal('pippo');
      e1.dot('a.b.e').should.equal(e1.data.a.b.e);
    });

    it('should return a nested variable in form a dotted path (with parent)', function() {
      e2.dot('a.b.c').should.equal(false);
      should.not.exist(e2.dot('a.b.e'));
    });

    it('should set a value to a new property given a dotted path (no parent)', function() {
      e1.dot('a.b.h', 10);
      e1.dot('a.b.h').should.equal(10);
      e1.dot('a.b.h').should.equal(e1.data.a.b.h);
    });

    it('should set a value to an existing property given a dotted path (no parent)', function() {
      e1.dot('a.b.h', 11);
      e1.dot('a.b.h').should.equal(11);
      e1.dot('a.b.h').should.equal(e1.data.a.b.h);
    });

    it('should not fail when setting a path that is not transversable', function() {
      e1.dot('a.b.c.z', 100);
      e1.data.a.b.c.should.be.a('object');
      e1.data.a.b.c.z.should.equal(100);
    });

    it('should create an array when a dotted path has a numeric part', function() {
      e1.dot('a.b.i.0.j', 'aaa');
      e1.data.a.b.i.should.deep.equal([ { j: 'aaa' } ]);
    });

  });

  describe('getPath', function() {

    let e1 = new Eredita({
      a: {
        b: {
          c: true,
          d: 5,
          e: 'pippo',
          f: [
            {
              g: true
            }
          ]
        }
      }
    });
    let e2 = new Eredita({
      a: {
        b: {
          c: false,
          d: 6
        }
      }
    }, e1);

    it('should not fail when requested a non-existant path (no parent)', function () {
      should.not.exist(e1.getPath('a.b.z'));
    });

    it('should return a nested variable in form a dotted path (with parent)', function () {
      e2.getPath('a.b.c').should.equal(false);
      e2.getPath('a.b.e').should.equal('pippo');
      e2.getPath('a.b.f.0.g').should.equal(true);
    });

  });

  describe('getTypedPath', function() {

    var e1 = new Eredita({
      greet: {
        it: 'ciao',
        en: 'hi'
      },
      title: 'mr'
    });

    var e2 = new Eredita({
      greet: {
        fr: 'salut'
      }
    }, e1);

    it('should return the correct typed-path if defined', function() {
      e1.getTypedPath('greet', 'it', 'en').should.equal('ciao');
    });

    it('should return the undefined value if the typed-path is not defined and no default is provided', function() {
      should.not.exist(e1.getTypedPath('greet', 'fr'));
    });

    it('should return the default value if the typed-path is not defined', function() {
      e1.getTypedPath('greet', 'fr', 'en').should.equal('hi');
    });

    it('should return the correct typed-path if defined in a derived object', function() {
      e2.getTypedPath('greet', 'fr', 'en').should.equal('salut');
    });

    it('should return the raw value if the requested path is not a typed-path', function() {
      e2.getTypedPath('title', 'fr', 'en').should.equal('mr');
    });

  });

  describe('setPath', function() {

    let e1 = new Eredita({
      a: {
        b: {
          c: true
        }
      }
    });
    let e2 = new Eredita({
    }, e1);

    it('should set the specified value and mark the object as dirty (no parent)', function() {
      e1.dirty.should.equal(false);
      e1.setPath('a.b.d', 10);
      e1.getPath('a.b.d').should.equal(10);
      e2.getPath('a.b.d').should.equal(10);
      e1.dirty.should.equal(true);
    });

    it('should set the specified value and mark the object as dirty (with parent)', function() {
      e2.setPath('a.b.c', false);
      e2.getPath('a.b.c').should.equal(false);
      e1.getPath('a.b.c').should.equal(true);
      e2.dirty.should.equal(true);
    });

  });

  describe('unsetPath', function() {
  });

  describe('mergePath', function() {
    let d1 = {
      a: true,
      b: 10,
      c: {
        d: 'pippo',
        e: [ 'aaa' ],
        f: { g: true }
      }
    };
    let d2 = {
      b: 11,
      c: {
        e: [ 'bbb' ],
        f: 'ccc'
      },
      i: 'ddd'
    };

    it('should return an equivalent object as in data when no path is specified (no parent)', function() {
      let d = JSON.parse(JSON.stringify(d1));
      let e = new Eredita(d);
      e.mergePath().should.deep.equal(d);
    });

    it('should return an equivalent object to a branch of data when a path is specified (no parent)', function() {
      let d = JSON.parse(JSON.stringify(d1));
      let e = new Eredita(d);
      e.mergePath('c.f').should.deep.equal(d.c.f);
    });

    it('should merge a full object with its parent, when no path is specified', function() {
      let d1_1 = JSON.parse(JSON.stringify(d1));
      let e1 = new Eredita(d1_1);
      let d2_1 = JSON.parse(JSON.stringify(d2));
      let e2 = new Eredita(d2_1, e1);

      e2.mergePath().should.deep.equal({
        a: true,
        b: 11,
        c: {
          d: 'pippo',
          e: [ 'bbb' ],
          f: 'ccc'
        },
        i: 'ddd'
      });
    });

  });

  describe('isDirty', function() {

    let e = new Eredita({ a: true });

    it('should return false on a newly creared object', function() {
      e.isDirty().should.equal(false);
    });

    it('should return true after a change', function() {
      e.setPath('b', 5);
      e.isDirty().should.equal(true);
    });

  });

  describe('deepExtend', function() {

  });

  describe('mixin', function() {

    it('should extend loadah/underscore with deepExtend', function() {
      _.mixin(eredita.mixin());
      _.deepExtend({ a: true }, { b: 10 }).should.deep.equal({ a: true, b: 10 });
    });

  });

});