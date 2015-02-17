
(function () {
    var service = $monday.service("GreetingsService");
    service.sayHi = function () {
        $log("Hey friend. Have a great week!");
    };
})();
