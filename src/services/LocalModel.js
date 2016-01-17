angular.module('ngBasics')
    .factory('LocalModel',['Util','Class','Events','IdGenerator',
        function(Util,Class,Events,IdGenerator){
            var LocalModel = Events.extend({
                initialize:function(data,model){
                    this.generatedId = IdGenerator();
                    this.remoteModel = model;
                    this.$valid = true;
                    if (this.onInit){
                        this.onInit(data);
                    }
                    // this.onInit(data);
                },
                clone:function(){
                    var t = this.remoteModel.createLocal(this.toJSON()),
                        keys = this.associtations || [],i=0;
                    t.generatedId = this.generatedId;
                    t.$valid = this.$valid;
                    Util.inject(keys,t,this);
                    return t;
                },
                inject:Util.injectAndExclude,
                save:function(options){
                    var opts = options || {},self = this;
                    opts.successHandlers = opts.successHandlers || [];
                    if (opts.successHandlers instanceof Array){
                        opts.successHandlers.push(function(result){
                            self.id = result.id;
                        });
                    }
                    return this.remoteModel.sync(this,opts);
                },
                delete:function(options){
                    var opts = options || {},self = this;
                    opts.successHandlers = opts.successHandlers || [];
                    if (opts.successHandlers instanceof Array){
                        opts.successHandlers.push(function(result){
                            self.$valid = false;
                        });
                    }
                    return this.remoteModel.unsync(this,opts);
                },
                isValid:function(){
                    return this.$valid;
                },
                /**
                 * whether the item is new
                 */
                isNew:function(){
                    return this.id === this.generatedId;
                },
                isVirtual:function(id){
                    return /[xyz0-9]{4}\-[xyz0-9]{4}\-[xyz0-9]{4}\-[xyz0-9]{4}/.test(id || this.id);
                },
                jsonify:function(exclude){
                    var e = exclude || [];
                    return this.inject(this.keys,e);
                },
                /**
                 * whether the item can be stored or not
                 */
                canBeStored:function(){
                    return false;
                },
                toJSON:function(sync,exclude){
                    var e = exclude || [];
                    return this.inject(this.keys,e);
                    // var o = this.jsonify(exclude);
                    // if (sync && (this.isNew() || this.isVirtual())){
                    //     delete o.id;
                    // }
                    // return o;
                }
            });
            return LocalModel;
    }]);
