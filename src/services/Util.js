angular.module('Basics')
    .factory('Util',['$rootScope',function($RT){
        var __UID = 0;
        var Util = {
            inherits:function(Parent,Child){
              var Temp = function(){};
              Temp.prototype = Parent.prototype;
              Child.prototype = new Temp();
              Child.prototype.constructor = Temp;
          },
          identity:function(item){
              return item;
          },
          get:function(src,ev){
              var k = ev.split('.'),v,obj = src;
              if (obj[ev]){
                  return obj[ev];
              }
              while((v = k.shift()) && obj){
                  obj = obj[v];
              }
              return obj;
          },
          format:function(src,key,rep){
              var t = Util.get(src,ev);
              if (t && typeof t === "string"){
                  return t.replace(/\$\{(\S+)\}/g,function(e,v){
                      return rep[v];
                  });
              }
              return t;
          },
          bind: function (fn, obj) {
        		var slice = Array.prototype.slice;

        		if (fn.bind) {
        			return fn.bind.apply(fn, slice.call(arguments, 1));
        		}

        		var args = slice.call(arguments, 2);

        		return function () {
        			return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        		};
        	},
            uid:function(){
                return ++__UID;
            },
            extend: function (dest) {
        		var i, j, len, src;

        		for (j = 1, len = arguments.length; j < len; j++) {
        			src = arguments[j];
        			for (i in src) {
        				dest[i] = src[i];
        			}
        		}
        		return dest;
        	},
            falseFn: function () { return false; },
            trim: function (str) {
        		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
        	},
            splitWords: function (str) {
        		return Util.trim(str).split(/\s+/);
        	},
            lastId:0,
            stamp: function (obj) {
        		/*eslint-disable */
        		obj._util_id = obj._util_id || ++Util.lastId;
        		return obj._util_id;
        		/*eslint-enable */
        	},
            inject:function(keys,target,source){
                var i = 0,
                    src = source || this,
                    dest = target || {};
                for(i=0;i<keys.length;i++){
                    dest[keys[i]] = src[keys[i]];
                }
                return dest;
            },
            injectAndExclude:function(keys,exclude,target,source){
                var i = 0,
                    src = source || this,
                    key = exclude.shift(),
                    dest = target || {};
                for(i=0;i<keys.length;i++){
                    if (keys[i] === key){
                        key = exclude.shift();
                        continue;
                    }
                    dest[keys[i]] = src[keys[i]];
                }
                return dest;
            },
        	// create an object from a given prototype
        	create: Object.create || (function () {
        		function F() {}
        		return function (proto) {
        			F.prototype = proto;
        			return new F();
        		};
        	})(),
        };

    return Util;
}]);
