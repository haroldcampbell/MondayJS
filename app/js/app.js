
(function () {
    $asController("HelloWorld", this);
    $inject("GreetingsService", "WeatherService");
    $options({template: "someUrl.html"});

    onLoad = function (greet, weather) {
        greet.sayHi();
        weather.weatherForecast();

        $log(template)
    };
})();



