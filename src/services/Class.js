angular.module('Basics')
    .factory('Class',['Util',function(Util){
        var Class = function(){};
        Class.extend = function(props){


    	var NewClass = function () {

    		// call the constructor
    		if (this.initialize) {
    			this.initialize.apply(this, arguments);
    		}

    		// call all constructor hooks
    		this.callInitHooks();
    	};

    	var parentProto = NewClass.__super__ = this.prototype;

    	var proto = Util.create(parentProto);
    	proto.constructor = NewClass;

    	NewClass.prototype = proto;

    	// inherit parent's statics
    	for (var i in this) {
    		if (this.hasOwnProperty(i) && i !== 'prototype') {
    			NewClass[i] = this[i];
    		}
    	}

    	// mix static properties into the class
    	if (props.statics) {
    		Util.extend(NewClass, props.statics);
    		delete props.statics;
    	}

    	// mix includes into the prototype
    	if (props.includes) {
    		Util.extend.apply(null, [proto].concat(props.includes));
    		delete props.includes;
    	}

    	// merge options
    	if (proto.options) {
    		props.options = Util.extend(Util.create(proto.options), props.options);
    	}

    	// mix given properties into the prototype
    	Util.extend(proto, props);

    	proto._initHooks = [];

    	// add method for calling all hooks
    	proto.callInitHooks = function () {

    		if (this._initHooksCalled) { return; }

    		if (parentProto.callInitHooks) {
    			parentProto.callInitHooks.call(this);
    		}

    		this._initHooksCalled = true;

    		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
    			proto._initHooks[i].call(this);
    		}
    	};

	   return NewClass;
   };
   Class.include = function(props){
       Util.extend(this.prototype,props);
   };
   Class.mergeOptions = function(props){
       Util.extend(this.prototype.options,props);
   };
   Class.addInitHooks = function(fn){
       var args = Array.prototype.slice.call(arguments, 1);
    	var init = typeof fn === 'function' ? fn : function () {
    		this[fn].apply(this, args);
    	};

    	this.prototype._initHooks = this.prototype._initHooks || [];
    	this.prototype._initHooks.push(init);
   };
   return Class;
}]);
