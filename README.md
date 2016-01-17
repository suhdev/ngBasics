#ngBasics

A set of utility services to use within AngularJS apps. The following services are currently supporeted:

1. Class
This services provides a basic prototypal-inhertance interface that can be extended by other classes to achieve OO in JavaScript. 

```javascript
angular.module('Test',['ngBasics'])
	.factory('TestService',['Class',function(Class){
		var TestService = Class.extend({
			//constructor
			initialize:function(){

			},
			method1:function(){

			},
			method2:function(){

			}
		});
		return TestService 
	}]);

angular.module('Test')
	.factory('TestService2',['TestService',function(TestService){
		var TestService2 = TestService.extend({
			initialize:function(){
				//call parent constructor
				TestService.prototype.initialize.call(this,arguments);
			},
			method1:function(){
				TestService.prototype.method1.call(this); 

				//own implementation 
			},
			method3:function(){

			}
		}); 

		return new TestService3();
	}]);


```

2. Events 
This service provides implementation similar to that of the EventEmitter in NodeJS. The Events service extends the Class service and thus it keeps the same OO interface. 

```javascript
angular.module('Test')
	.factory('BasicEmitter',['Events',function(Events){
		var BasicEmitter = Events.extend({
			methodx:function(){

			},
			methody:function(){

			}
		}); 

		//BasicEmitter now has the following methods
		// function on(eventName,callback,ctx) --> alias 
		// function addEventListener(eventName,callback,ctx)
		// function off(eventName,callback) --> alias
		// function removeEventListener(eventName,callback) 
		// to trigger an event 
		// function fire(eventName,eventData)
		return new BasicEmitter(); 
	}]);

```

3. Util 
This service provides a set of utility functions used by both the Class and Events services. 

4. IdGenerator 
This service is used to generate unique identifiers 

5. Model 
This service implements a Model interface for the (MVC) framework. The model class implements all restful methods. The class can also be extended to provide own implementation for the restful calls. Internally, the service use $http to perform Ajax calls and so it can be tested using the ngMock module. 

6. LocalModel
This is a client-side implementation of a model. The LocalModel service extends Events service. This is usually attached to the $scope of a controller, such that it can then be saved by calling ```save()``` method of the LocalModel. 

