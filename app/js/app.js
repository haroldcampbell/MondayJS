
(function () {
    $monday.controller("HelloWorld", this);
    $required("GreetingsService", "WeatherService");
    $options({template: "someUrl.html"});

    onLoad = function (greet, weather) {
        greet.sayHi();
        weather.weatherForecast();

        $log(template)
    };
})();



