angular.module('ngBasics')
  .factory('Model',['$http','$q','Util','Class','Events','LocalModel',
    function($H,$Q,Util,Class,Events,LocalModel){
    var defaults = {
      createPath:'',
      listPath:'list',
      defaultField:'id'
    };

    var Model = Events.extend({
        statics:{
            defaultOptions:{
                prepareLocalModelForSync:function(local){
                    if (local.isVirtual() || local.isNew()){
                        return local.toJSON(true,['id']);
                    }
                    return local.toJSON();
                },
                eventCallback:function(model,eventType,result){

                },
                doPreEvents:true,
                doPostEvents:true,
                doSuccessEvents:true,
                doErrorEvents:true,
                successHandlers:[],
                errorHandlers:[]
            }
        },
        initialize:function(options){
            var opts = options || {};
            this.__uid = 0;
            this._url = opts.url || '';
            this._params = opts.params || {};
            this._localModel = opts.localModel;
            this._requestProcessors = {};
            this._responseProcessors = {};
        },
        mixins:[],
        createLocal:function(data){
            if (!this._localModel){
                throw new Error('No local model has been provided.');
            }
            return new this._localModel(data||{},this);
        },
        sync:function(local,options){
            var self= this;
            if (local.canBeStored()){
                p = (local.isNew() || local.isVirtual())?this.create(local,options):this.update(local.id,local,options);
                return p;
            }
            return $Q(function(resolve,reject){
                self.fire(local.isNew()?'OnCreate':'OnUpdate',
                    {
                        data:local.toJSON(),
                        generatedId:local.id,
                        isVirtual:true
                    });
                resolve(local.toJSON());
            });
        },
        unsync:function(local,options){
            return !local.isNew()?this.delete(local.id,options):$Q(function(r,rj){r(local.toJSON());console.log('hey');});
        },
        query:function(query,options){
            return this._request('query','Query',query,options);
        },
        request:function(){
            return $H;
        },
        upload:function(data,cb,options){
            var fd = new FormData(),key;
            for(key in data){
                fd.append(key,data[key]);
            }
            cb(fd);
            return this._request('upload','Upload',fd,options);
        },
        by:function(field,value,options){
            return this._request('by','By',[field,value],options);
        },
        create:function(data,options){
            return this._request('post','Create',data,options);
        },
        list:function(options){
            return this._request('list','List',{},options);
        },
        get:function(id,options){
            return this._request('get','Get',id,options);
        },
        update:function(id,data,options){
            data.id = data.id || id;
            return this._request('update','Update',data,options);
        },
        delete:function(id,options){
            return this._request('delete','Delete',id,options);
        },
        _preEvent:function(eventType,data,options){
            var self = this,mixins=this.mixins,i=0,$rs={};
            if (options.doPreEvents){
                $rs.__model__ = self.preEvent && self.preEvent(eventType,options,data);
                this._onMixins('preEvent',$rs,eventType,options,data);
            }
            return $Q(function(resolve,reject){
                resolve($rs);
            });
        },
        _onMixins:function(){
            var self = this,
                fname = arguments[0],
                $rs = arguments[1],
                args = Array.prototype.slice.call(arguments,2),
                mixins = this.mixins;

            angular.forEach(mixins,function(mixin,key){
                if (mixin[fname]){
                    $rs[''+key] = mixin[fname].apply(self,args);
                }
            });
            return $rs;
        },
        _postEvent:function(eventType,$rs,options,data){
            var mixins = this.mixins,self = this;
            if (options.doPostEvents){
                (this.postEvent && this.postEvent(eventType,options,$rs.__model__,data));
                angular.forEach(mixins,function(mixin,key){
                    (mixin.preEvent && mixin.preEvent.call(self,eventType,options,$rs[''+key],data));
                });
            }
        },
        _request:function(method,eventType,input,opts){
            var self = this,
                options = angular.extend({},Model.defaultOptions,opts),
                data = input;
            if (input instanceof LocalModel){
                data = options && options.prepareLocalModelForSync && options.prepareLocalModelForSync(input);
            }
            return this._preEvent(eventType,input,options)
                .then(function(preResult){
                    var reqPromise;
                    if (eventType === 'Create'){
                        reqPromise = $H({
                            url:self.getUrl('get',{id:'create'}),
                            method:'POST',
                            data:JSON.stringify(self._processRequest('post',data)),
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        });
                    }else if (eventType === 'Update'){
                        reqPromise = $H({
                            url:self.getUrl('get',{id:data.id}),
                            method:'PUT',
                            data:JSON.stringify(self._processRequest('put',data)),
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        });
                    }else if (eventType === 'By'){
                        reqPromise = $H.get(self.getUrl('by',{id:[].concat(['by'],input).join('/')}))
                    }else if (eventType === 'Delete'){
                        reqPromise = $H.delete(self.getUrl('get',{id:input}));
                    }else if (eventType === 'Get'){
                        reqPromise = $H.get(self.getUrl('get',{id:input}))
                    }else if (eventType === 'Query'){
                        reqPromise = $H({
                            url:self.getUrl('query',{id:'query'}),
                            method:'POST',
                            data:JSON.stringify(input),
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        });
                    }else if (eventType === 'List'){
                        reqPromise = $H.get(self.getUrl('get',{id:'list'}));
                    }else if (eventType === 'Upload'){
                        reqPromise = $H({
                            url:self.getUrl('get',{id:'upload'}),
                            method:'POST',
                            data:input,
                            headers:{'Content-Type':undefined}
                        });
                    }
                    return reqPromise
                        .then(angular.bind(self,self.onSuccess,method,eventType,options),
                              angular.bind(self,self.onServerError,options))
                        .catch(angular.bind(self,self.onError,eventType,options))
                        .then(angular.bind(self,self._finalHandler,eventType,preResult,options))
                });
        },
        _finalHandler:function(eventType,$rs,options,data){
            var success=data[0]==='Success',
                mixins = this.mixins,
                self = this,
                evt = {
                    isVirtual:false,
                    success:success,
                    data:data[1]
                },
                evtName = ['On',eventType,data[0]].join('');
            if (success){
                //TODO: add success handlers here
                if (options.doSuccessEvents){
                    this.fire(evtName,evt);
                }
            }else {
                //TODO: add error handlers here
                if (options.doErrorEvents){
                    this.fire(evtName,evt);
                }
            }
            if (options.doPostEvents){
                (this.postEvent && this.postEvent(eventType,options,$rs.__model__,success,data));
                angular.forEach(mixins,function(mixin,key){
                    (mixin.postEvent && mixin.postEvent.call(self,eventType,options,$rs[''+key],success,data));
                });
            }
            if (options.eventCallback){
                options.eventCallback(this,eventType,success,data[1]);
            }
            if (success){
                return data[1];
            }else{
                throw data[1];
            }
        },

        getUrl:function(method,params){
            var args = params || {};
            return this._url.replace(/\{(.*?)\}/g,function(e,v,k){
                return params[v];
            });
        },
        _processRequest:function(method,data){
            var res = data,
                processors = this._requestProcessors[method] || [],
                i;
            if(processors.length > 0){
                res = this._process(data,processors);
            }
            return res;
        },
        _process:function(data,processors){
            var res = data;
            for(i=0;i<processors.length;i++){
                if (angular.isFunction(processors[i])){
                    res = processors[i](res);
                }
            }
            return res;
        },
        onFinalResult:function(method,eventType,options,result){
            var processors = this._responseProcessors[method] || [],
                $rs = {};
            if (processors.length > 0){
                result = this._process(result,processors);
            }
            // options.eventCallback(this,eventType,result);


            if (options.successHandlers && options.successHandlers.length > 0){
                var i=0,handlers = options.successHandlers;
                for(i=0;i<handlers.length;i++){
                    handlers[i](result);
                }
            }
            $rs.__model__ = result;
            this._onMixins('onFinalResult',$rs,method,eventType,options,result);
            return result;
        },
        onSuccess:function(method,eventType,options,data){
            var resp = data.data,
                $rs = {},
                res = data.data.data;
            $rs.__model__ = resp;
            if (resp.status){
                this._onMixins('onSuccess',$rs,method,eventType,options,data,resp);
                return ['Success',this.onFinalResult(method,eventType,options,res)];
            }else {
                this._onMixins('onDataError',$rs,method,eventType,options,data,resp);
                throw res;
            }
        },
        onError:function(eventType,options,res){
            var $rs = {
                __model__:res
            };
            this._onMixins('onError',$rs,eventType,options,res);
            return ['Error',res];
        },
        onServerError:function(eventType,options,res){
            var $rs = {},
                e = {
                errorCode:res.status,
                message:'Server Error: '+res.statusText,
                name:'Server Error'
            };
            $rs.__model__ = e;
            this._onMixins('onServerError',$rs,eventType,options,res,e);
            return ['Error',e];
        }
    });

    return Model;
  }]);
