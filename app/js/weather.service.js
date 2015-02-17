(function () {
    $monday.service("WeatherService", function(){
        this.weatherForecast = function () {
            $log("Today is going to be sunny!");
        };
    });
})();