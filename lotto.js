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
    // Lotto functional constructor
    var lotto = function () {
        /******************************************************************
         * ATTRIBUTES
         *****************************************************************/
        var that = {}; // new object
        var cfg = arguments[0] || {}; // config
        var number = cfg.number || 0; // number of participants
        var allP = [] // all participants
        // Init allP
        for (var i = 0; i < number; i += 1) {
            // Participant struct
            allP.push({
                index: i,
                participant: i
            });
        }
        var chosenP = []; // chosen participants
        var leftP = allP.slice(); // shallow copy left participants, equaling to allP in the beginning
        var timer; // timer of the raffle
        var interval = cfg.interval || 1000; // init interval of the timer
        if (interval <= 70) {
            throw new Error('The interval must be greater than or equal to 70ms');
        }
        var intervalTemp = interval;
        var intervalMin = 70;
        var axisX = 0; // init axisX of easing(belong to [0, 1])
        var axisXMax = 1;
        var axisXTemp = axisX;
        var axisStep = cfg.step || 0.5; // step of axisX change(belong to [0, 1])
        if (cfg.step < 0 || cfg.step > 1) {
            throw new Error('The step must be belong to [0, 1]');
        } else if (cfg.step === 0) {
            axisStep = 0;
        }
        var stopFlag;

        /******************************************************************
         * METHODS
         *****************************************************************/
        /**
         * randomNumGenerator
         * Generate a random one from the given participants
         * @param {array} p
         */
        var randomNumGenerator = function (p) {
            return p[Math.round(Math.random() * (p.length - 1))];
        };

        // Cubic-bezier function
        var cubicBezier = {
            easeIn: BezierEasing(0.42, 0, 1, 1),
            easeOut: BezierEasing(0, 0, 0.58, 1),
            linear: BezierEasing(0, 0, 1, 1)
        };

        // Reset timer, interval, acct
        var resetTimer = function () {
            clearInterval(timer); // reset timer
            axisXTemp = axisX; // reset acct
            // Clear intervalTemp and timer to completely reset the raffling
            // For distinguish stop raffle and ending animation finish
            if (arguments[0] === true) {
                intervalTemp = interval; // reset interval
                timer = undefined;
            }
        };

        // Calculate interval of raffling
        var calcInterval = function (easeType) {
            switch (easeType) {
                case 'easeIn':
                    // Calc intervalTemp with cubic-bezier function
                    intervalTemp = Math.round(interval - cubicBezier.easeIn(axisXTemp) * interval);
                    // Make sure the value of axisX and interval stay in the correct range
                    if (axisXTemp <= axisXMax && intervalTemp >= intervalMin) {
                        axisXTemp += axisStep;
                    } else {
                        intervalTemp = intervalMin;
                    }
                    return intervalTemp;
                    break;
                case 'easeOut':
                    // intervalTemp = Math.round(interval - cubicBezier.easeOut(axisXTemp) * interval);
                    // intervalTemp = intervalTemp - cubicBezier.easeOut(axisXTemp) * interval;

                    // First time to stop raffling won't calculate the intervalTemp
                    if (stopFlag) {
                        intervalTemp = Math.round(cubicBezier.easeOut(axisXTemp) * interval);
                    }
                    stopFlag = true;
                    if (axisXTemp < axisXMax && intervalTemp < interval || intervalTemp === interval) {
                        axisXTemp += axisStep / 2;
                    } else {
                        intervalTemp = Infinity;
                    }
                    return intervalTemp;
                    break;
                default:
                    return intervalTemp;
                    break;
            }
        };

        // Raffling processing
        var raffleEase = function (raffling, easeType) {
            raffling(calcInterval, easeType);
        };

        var raffling = function (calcInterval, easeType) {
            document.getElementById('result').innerHTML = randomNumGenerator(leftP).participant;
            // console.log(document.getElementById('result').innerHTML);
            // timer = setTimeout(function () {
            // // Calc intervalTemp with cubic-bezier function
            // intervalTemp = Math.round(interval - cubicBezier.easeIn(axisXTemp) * interval);
            // // Make sure the value of axisX and interval stay in the correct range
            // if (axisXTemp <= axisXMax && intervalTemp >= intervalMin) {
            //     axisXTemp += axisStep;
            // } else {
            //     intervalTemp = intervalMin;
            // }
            // console.log(intervalTemp);
            //     raffling();
            // }, intervalTemp);


            // console.log(intervalTemp);
            timer = setTimeout(function () {
                intervalTemp = calcInterval(easeType);
                if (intervalTemp !== Infinity) {
                    raffling(calcInterval, easeType);
                } else {
                    resetTimer(true);
                }
            }, intervalTemp);
        };

        // Start raffle
        var raffleStart = function () {
            if (timer === undefined) {
                console.log(timer);
                raffleEase(raffling, 'easeIn');
            }
        };

        // Stop raffle
        var raffleStop = function () {
            // if (timer !== undefined) {
            //     console.log(timer);
            // }
            resetTimer();
            raffleEase(raffling, 'easeOut');
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