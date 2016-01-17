/**
 * @module 
 *
 *
 */
angular.module('ngBasics')
    .factory('IdGenerator',function(){
        return function(){
            return 'xyz9-xxz1-zzzz-xxyy'.replace(/[xyz]/g,function(e){
                return parseInt(10*Math.random());
            });
        };

    });