
function $log(message) {
    console.log(message);
}

/**
 * MondayJS
 *
 * This is where the magic happens.
 */
$monday = (function () {
    var $this = this;
    $this.controllersByName = {};
    $this.servicesByName = {};

    /**
     * registerControllerByName is used to maintain a list of the controllers
     * referenced by name.
     *
     * @param controllerName
     * @param controller
     */
    $this.registerControllerByName = function (controllerName, controller) {
        $this.controllersByName[controllerName] = controller;
    };

    /**
     * registerServiceByName is used to maintain a list of the services
     * reference by name.
     *
     * @param serviceName
     * @param service
     */
    $this.registerServiceByName = function (serviceName, service) {
        $this.servicesByName[serviceName] = service;
    };

    $this.noop = function(){};

    $this.boot = function() {
        for (var controllerName in $this.controllersByName) {
            if ($this.controllersByName.hasOwnProperty(controllerName)) {
                var controller = $this.controllersByName[controllerName];

                controller.context.onLoad.apply(controller.context, controller.injected);
            }
        }
    };

    window.addEventListener("load", $this.boot);

    return $this;
})();

/**
 * Used to create a service for use with Monday.
 *
 * $asService expects two arguments.
 *
 * The name of the controller and the context to which the controller will be bound.
 */
$asService = (function () {
    var service = {
        name: null,
        context: null
    };

    return function (serviceName, context) {
        service.name = serviceName;
        service.context = context;

        context.$meta = service;

        $monday.registerServiceByName(serviceName, service);

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
$asController = (function () {
    var controller = {
        name: null,
        scope: {},
        template: null,
        context: null,
        injected:[],
        options: {}
    };

    /**
     * Used to allow dependency injection.
     * The method expects one or more strings, each the name of a service.
     *
     * Example:
     *  this.$inject("GreetingsService", "WeatherService");
     *
     *  'GreetingsService' and 'WeatherService' will be injected into the controller's
     *  onLoad function, in the order they were added.
     *
     *  They can be accessed, like this:
     *
     *  this.onLoad = function (greet, weather) {
     *  }
     */
    function $inject() {

        for(var i=0; i<arguments.length; i++) {
            var dependencyName = arguments[i];
            if (!!$monday.servicesByName[dependencyName]) {

                controller.injected.push($monday.servicesByName[dependencyName].context);
            }
        }
    }

    /**
     *
     * @param optionsHash A hash of options that will be added directly to the controllers
     * context, making the options accessible via this.
     */
    function $options(optionsHash) {
        for (var optionKey in optionsHash) {
            if (optionsHash.hasOwnProperty(optionKey)) {
                controller.context[optionKey] = optionsHash[optionKey];
            }
        }
    }

    return function (controllerName, context) {
        controller.name = controllerName;
        controller.context = context;

        context.$meta = controller;
        context.$inject = $inject;
        context.$options = $options;
        context.onLoad = $monday.noop;

        $monday.registerControllerByName(controllerName, controller);

        return controller;
    };
})();