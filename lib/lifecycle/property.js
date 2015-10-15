(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', '../util/assign', '../util/dash-case', '../util/data', '../api/emit'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('../util/assign'), require('../util/dash-case'), require('../util/data'), require('../api/emit'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.assign, global.dashCase, global.data, global.emit);
    global.property = mod.exports;
  }
})(this, function (exports, module, _utilAssign, _utilDashCase, _utilData, _apiEmit) {
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _assign = _interopRequireDefault(_utilAssign);

  var _dashCase = _interopRequireDefault(_utilDashCase);

  var _data = _interopRequireDefault(_utilData);

  var _emit = _interopRequireDefault(_apiEmit);

  // TODO Split apart createNativePropertyDefinition function.

  function getLinkedAttribute(name, attr) {
    return attr === true ? (0, _dashCase['default'])(name) : attr;
  }

  function createNativePropertyDefinition(name, opts) {
    var prop = {
      configurable: true,
      enumerable: true
    };

    prop.created = function (elem, initialValue) {
      var info = (0, _data['default'])(elem, 'api/property/' + name);
      info.linkedAttribute = getLinkedAttribute(name, opts.attribute);
      info.removeAttribute = elem.removeAttribute;
      info.setAttribute = elem.setAttribute;
      info.updatingProperty = false;

      if (typeof opts['default'] === 'function') {
        info.defaultValue = opts['default']();
      } else if (opts['default'] !== undefined) {
        info.defaultValue = opts['default'];
      }

      // TODO Refactor
      if (info.linkedAttribute) {
        if (!info.attributeMap) {
          info.attributeMap = {};

          elem.removeAttribute = function (attrName) {
            info.updatingAttribute = true;
            info.removeAttribute.call(this, attrName);

            if (attrName in info.attributeMap) {
              var propertyName = info.attributeMap[attrName];
              elem[propertyName] = undefined;
            }

            info.updatingAttribute = false;
          };

          elem.setAttribute = function (attrName, attrValue) {
            info.updatingAttribute = true;
            info.setAttribute.call(this, attrName, attrValue);

            if (attrName in info.attributeMap) {
              var propertyName = info.attributeMap[attrName];
              attrValue = String(attrValue);
              elem[propertyName] = opts.deserialize(attrValue);
            }

            info.updatingAttribute = false;
          };
        }

        info.attributeMap[info.linkedAttribute] = name;
      }

      if (initialValue === undefined) {
        if (info.linkedAttribute && elem.hasAttribute(info.linkedAttribute)) {
          var attributeValue = elem.getAttribute(info.linkedAttribute);
          initialValue = opts.deserialize(attributeValue);
        } else {
          initialValue = info.defaultValue;
        }
      }

      info.internalValue = initialValue;
    };

    prop.get = function () {
      var info = (0, _data['default'])(this, 'api/property/' + name);

      if (opts.get) {
        return opts.get(this);
      }

      if (info.internalValue !== undefined) {
        return info.internalValue;
      }

      return info.defaultValue;
    };

    prop.set = function (newValue) {
      var info = (0, _data['default'])(this, 'api/property/' + name);

      if (info.updatingProperty) {
        return;
      }

      info.updatingProperty = true;
      var oldValue = this[name];

      if (opts.type) {
        newValue = opts.type(newValue);
      }

      if (!opts.get) {
        info.internalValue = newValue;
      }

      if (info.linkedAttribute && !info.updatingAttribute) {
        var serializedValue = opts.serialize(newValue);
        if (serializedValue === undefined) {
          info.removeAttribute.call(this, info.linkedAttribute);
        } else {
          info.setAttribute.call(this, info.linkedAttribute, serializedValue);
        }
      }

      var changeData = {
        name: name,
        newValue: newValue,
        oldValue: oldValue
      };

      if (opts.set) {
        opts.set(this, changeData);
      }

      if (opts.emit) {
        var eventName = opts.emit;

        if (eventName === true) {
          eventName = 'skate.property';
        }

        (0, _emit['default'])(this, eventName, {
          bubbles: false,
          cancelable: false,
          detail: changeData
        });
      }

      info.updatingProperty = false;
    };

    return prop;
  }

  module.exports = function (opts) {
    opts = opts || {};

    if (typeof opts === 'function') {
      opts = { type: opts };
    }

    return function (name) {
      return createNativePropertyDefinition(name, (0, _assign['default'])({
        deserialize: function deserialize(value) {
          return value;
        },
        serialize: function serialize(value) {
          return value;
        }
      }, opts));
    };
  };
});