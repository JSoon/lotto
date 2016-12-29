(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.lotto = factory());
        });
    } else {
        // Browser globals
        root.lotto = factory();
    }
} (typeof window !== "undefined" ? window : this, function () {
    // lotto functional constructor
    var lotto = function () {
        // attributes
        var that = {}; // new object
        var cfg = arguments[0] || {}; // config
        var number = cfg.number || 0; // number of participants
        var allP = [] // all participants
        // init allP
        for (var i = 0; i < number; i += 1) {
            // participant struct
            allP.push({
                index: i,
                participant: i
            });
        }
        var chosenP = []; // chosen participants
        var leftP = allP.slice(); // shallow copy left participants, equaling to allP in the beginning
        var timer; // timer of the raffle
        var acceleration = cfg.acc || 'quad'; // acceleration of the raffle
        var interval = 500; // init interval of the timer
        var intervalTemp = interval;
        var intervalMin = 70;
        var acct = 0.38; // init acct of the interval
        var acctTemp = acct;
        // define the acceleration function 
        switch (acceleration) {
            default:
                // var easeInQuad = easingFunctions.easeInQuad;
                var easeInQuad = function (t, b, c, d) {
                    return c * (t /= d) * t + b;
                };
                var easeOutQuad = easingFunctions.easeOutQuad;
                break;
        }

        // methods
        /**
         * randomNumGenerator
         * Generate a random one from the given participants
         * @param {Array} p
         */
        var randomNumGenerator = function (p) {
            return p[Math.round(Math.random() * (p.length - 1))];
        };

        // reset timer, interval, acct
        var resetTimer = function () {
            clearInterval(timer); // reset timer
            intervalTemp = interval; // reset interval
            acctTemp = acct; // reset acct
        };

        // raffling processing
        var raffling = function () {
            document.getElementById('result').innerHTML = randomNumGenerator(leftP).participant;
            console.log(intervalTemp);
            timer = setTimeout(function () {
                intervalTemp = interval - Math.round(easeInQuad(acctTemp, 0, 50, .22));
                if (intervalTemp > intervalMin) {
                    acctTemp += 0.1;
                } else {
                    intervalTemp = intervalMin;
                }
                raffling();
            }, intervalTemp);
        };

        // start raffle
        var raffleStart = function () {
            raffling();
        };

        // stop raffle
        var raffleStop = function () {
            resetTimer();
            // var bingo = randomNumGenerator(leftP);
            // leftP.splice(bingo.index, 1);
            // chosenP.push(bingo);
            // return chosenP.slice();
        };





        // for (var i = 0, sum = '', curNumber, prevNumber; i < number; i += 1) {
        //     while (curNumber === prevNumber) {
        //         curNumber = randomNumGenerator(number);
        //     }
        //     sum += curNumber + ', ';
        //     prevNumber = curNumber;
        // }
        // sum = sum.slice(0, -2);
        // document.body.insertBefore(document.createTextNode(sum), document.body.firstChild);

        // exports
        that.raffleStart = raffleStart;
        that.raffleStop = raffleStop;

        return that;
    }

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return lotto;
}));