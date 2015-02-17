'use strict';

function $log(message) {
    console.log(message);
}

/**
 * Tests the truthiness of the specified object
 * @param obj
 * @returns {boolean}
 */
function isTruthy(obj) {
    return !!obj
}
/**
 * MondayJS
 *
 * This is where the magic happens.
 */
var $monday = null;

(function () {


    /**
     * Creates the controller singleton.
     *
     * @returns {{name: null, scope: {}, template: null, contexts: null, required: Array, injected: Array, options: {}}}
     */
    function _createController(controllerName) {
        return {
            name: controllerName,
            //scope: {},
            template: null,

            /* the last created context */
            context: null,
            /* an array of all the contexts */
            contexts: [],
            /* the names of all the dependencies */
            requiredByContext: {},
            /* an array of all the actual dependencies, in order listed by requiredByContext */
            injected: [],
            options: {}
        };
    }


    /**
     * Finds and injects the services defined by the context into the context.
     *
     * @param controller
     * @param context
     * @private
     */
    function _injectServices(controller, context) {
        var names = controller.requiredByContext[context];

        if (!isTruthy(names) || names.length == 0)
            return;

        for (var i = 0; i < names.length; i++) {
            var serviceName = names[i];

            if (isTruthy($monday.servicesByName[serviceName])) {
                context.injected.push($monday.servicesByName[serviceName]);
            }
        }
    }

    /**
     * Calls the onLoad method of the object, passing it the specified arguments.
     * The method silently fails if the onLoad method doesn't exist.
     *
     * @param object
     * @param args
     * @private
     */
    function _load(object, args) {
        if (isTruthy(object.onLoad))
            object.onLoad.apply(object, args);
    }


    /**
     * Factory function for MondayJS
     * @returns {Object|Function|MondayJS}
     * @constructor
     */
    function MondayJS() {
        var $this = MondayJS.prototype;

        if (isTruthy($this.$$isMondayInitialized)) {
            return $monday;
        }

        $this.$$controllersCount = 0;
        $this.$$isMondayBooted = false;
        $this.$$isMondayInitialized = true;
        $this.controllersByName = {};
        $this.servicesByName = {};

        /**
         * registerControllerByName is used to maintain a list of the controllers referenced by name.
         * If the controller doesn't initially exist, a singleton controller is created.
         *
         * @param controllerName
         * @param context
         */
        $this.registerControllerByName = function (controllerName, context) {
            if (!isTruthy($this.controllersByName[controllerName])) {
                $this.controllersByName[controllerName] = _createController(controllerName);
            }

            $this.controllersByName[controllerName].contexts.push(context);

            /* Binds the last context directly to the controller */
            $this.controllersByName[controllerName].context = context;

            return $this.controllersByName[controllerName];
        };
        /**
         * Used to get a singleton service by name
         */
        $this.getServiveByName = function (serviceName) {
            return $this.servicesByName[serviceName];
        };


        /**
         * Empty function that does nothing. It is the placeholder for the default functions.
         */
        $this.noop = function () {
        };

        /**
         * Used to bootstrap MondayJS
         */
        $this.boot = function () {
            if ($this.$$isMondayBooted) {
                return;
            }

            for (var controllerName in $this.controllersByName) {
                if ($this.controllersByName.hasOwnProperty(controllerName)) {

                    var controller = $this.controllersByName[controllerName];

                    for (var i = 0; i < controller.contexts.length; i++) {
                        var context = controller.contexts[i];
                        _injectServices(controller, context);
                        _load(context, context.injected);
                    }
                }
            }

            $this.$$isMondayBooted = true;
        };

        window.addEventListener("load", $this.boot);

        return $this;
    }

    $monday = MondayJS();
})();

/**
 * Used to create a service for use with Monday.
 *
 * If the service doesn't initially exist, a singleton service is created.
 *
 * @param serviceName
 * @param contextCallback
 */
$monday.service = (function () {
    /**
     * Creates the service singleton.
     *
     * @param serviceName
     * @returns {{name: null, context: null}}
     * @private
     */
    function _createService(serviceName) {
        return {
            name: serviceName,
            $$contextCallbacks: []
        };
    }

    $monday._purgeServiceCallbacks = function (serviceName) {
        var service = $monday.servicesByName[serviceName];

        if (isTruthy(service)) {
            service.$$contextCallbacks = [];
        }
    };

    /**
     * Calls the callbacks for the key-data.
     *
     * @param service
     * @param changedData
     * @private
     */
    function _executeChangeCallback(service, changedData) {
        for (var i = 0; i < service.$$contextCallbacks.length; i++) {
            var callbackContext = service.$$contextCallbacks[i];

            for (var dataKey in changedData) {
                if (changedData.hasOwnProperty(dataKey)) {

                    if (isTruthy(callbackContext.registeredCallbacks[dataKey])) {
                        callbackContext.registeredCallbacks[dataKey].apply(callbackContext.context, [changedData[dataKey]]);
                    }
                }
            }
        }
    }

    function _getCallbackContext(service, context) {
        for (var i = 0; i < service.$$contextCallbacks.length; i++) {
            var callbackContext = service.$$contextCallbacks[i];
            if (callbackContext.context === context)
                return callbackContext
        }
        return null;
    }

    function _addCallbacks(service, context, clientCallbackHash) {
        var callbackContext = _getCallbackContext(service, context);

        if (!isTruthy(callbackContext)) {
            callbackContext = {
                context: context,
                registeredCallbacks: {}
            };
            service.$$contextCallbacks.push(callbackContext);
        }

        for (var key in clientCallbackHash) {
            if (clientCallbackHash.hasOwnProperty(key)) {
                callbackContext.registeredCallbacks[key] = clientCallbackHash[key];
            }
        }
    }

    return function (serviceName, serviceBodyFnc) {
        var service = $monday.servicesByName[serviceName];

        if (!isTruthy(service)) {
            service = _createService(serviceName);
            service.onChanged = function (data) {
                _executeChangeCallback(service, data);
            };
            service.addCallbacks = function (context, hash) {
                _addCallbacks(service, context, hash);
            };
        }

        if(isTruthy(serviceBodyFnc)) {
            serviceBodyFnc.apply(service, null);
        }
        $monday.servicesByName[serviceName] = service;

        return service;
    };
})();

/**
 * Used to create a controller for use with Monday.
 *
 * $asController expects two arguments.
 *
 * The name of the controller and the context to which the controller will be bound.
 */
$monday.controller = (function () {
    var controller;

    /**
     * Stores the list of required dependencies. These will be later injected into the
     * controllers $init method.
     *
     * @param context
     * @param dependencyList
     */
    function _required(context, dependencyList) {
        controller.requiredByContext[context] = [];

        for (var i = 0; i < dependencyList.length; i++) {
            controller.requiredByContext[context].push(dependencyList[i]);
        }
    }

    /**
     * @param context
     * @param optionsHash A hash of options that will be added directly to the controllers
     * context, making the options accessible via this.
     */
    function _options(context, optionsHash) {
        for (var optionKey in optionsHash) {
            if (optionsHash.hasOwnProperty(optionKey)) {
                context[optionKey] = optionsHash[optionKey];
            }
        }
    }

    return function (controllerName, context) {
        if(!isTruthy(context)){
            /* create a default context if one doesn't exist. */
            context = {};
        }
        controller = $monday.registerControllerByName(controllerName, context);

        context.$$id = ++$monday.$$controllersCount;
        context.$meta = controller;
        context.injected = [];
        context.$required = function () {
            _required(context, arguments)
        };
        context.$options = function (optionsHash) {
            _options(context, optionsHash);
        };
        context.onLoad = $monday.noop;

        return controller;
    };
})();