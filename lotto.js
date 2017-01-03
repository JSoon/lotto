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
                id: i,
                participant: i
            });
        }
        var chosenP = []; // chosen participants
        var leftP = allP.slice(); // shallow copy left participants, equaling to allP in the beginning
        var bingoTemp; // the temp chosen one in the raffling
        var curP; // current random participant
        var prevP; // previous random participant
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
        var clickStartFlag = false; // if start button being clicked
        var clickStopFlag = false; // if stop button being clicked
        // Events
        /**
         * processing
         * callback
         * @param {object} bingo - the bingo participant
         */
        var processing = cfg.processing || function (bingo) { }; // processing of raffle
        /**
         * success
         * callback
         * @param {object} bingo - the bingo participant
         * @param {array} leftP - the left participants
         */
        var success = cfg.success || function (bingo, leftP) { }; // bingo of raffle


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

        /**
         * noRepeatNumGenerator
         * Generate a no-repeat random one to the previous from the given participants
         * @param {array} p
         */
        var noRepeatNumGenerator = function (p) {
            if (p.length > 1) {
                curP = randomNumGenerator(p);
                while (curP === prevP) {
                    curP = randomNumGenerator(p);
                }
                prevP = curP;
                return curP;
            } else {
                return p[0];
            }
        };

        // Cubic-bezier function
        var cubicBezier = {
            easeIn: BezierEasing(0.42, 0, 1, 1),
            easeOut: BezierEasing(0, 0, 0.58, 1),
            linear: BezierEasing(0, 0, 1, 1)
        };

        // Pick out the bingo one
        var bingo = function () {
            chosenP.push(bingoTemp);
            for (var i = 0, length = leftP.length; i < length; i += 1) {
                if (leftP[i].id === bingoTemp.id) {
                    leftP.splice(i, 1);
                    success(bingoTemp, leftP);
                    return leftP;
                }
            }
        };

        // Reset timer, interval, acct
        var resetTimer = function () {
            clearInterval(timer); // reset timer
            axisXTemp = axisX; // reset acct
            // Clear intervalTemp and timer to completely reset the raffling
            // For distinguish raffling stops and ending animation finishes
            if (arguments[0] === true) {
                timer = undefined;
                intervalTemp = interval; // reset interval
                clickStartFlag = false;
                clickStopFlag = false;
                bingo();
            }
        };

        /**
         * calcInterval
         * Calculate interval of raffling
         * @param {string} type - raffling type
         */
        var calcInterval = function (type) {
            switch (type) {
                case 'easeIn':
                    // First time to click start raffling won't calculate the intervalTemp,
                    // so that create one time delay(which = interval) before intervalTemp changes for UE purpose
                    if (clickStartFlag) {
                        // Calc intervalTemp with cubic-bezier function
                        intervalTemp = Math.round(interval - cubicBezier.easeIn(axisXTemp) * interval);
                        // Make sure the value of axisX and interval stay in the correct range
                        if (axisXTemp <= axisXMax && intervalTemp > intervalMin) {
                            axisXTemp += axisStep;
                        } else {
                            intervalTemp = intervalMin;
                        }
                    } else {
                        clickStartFlag = true;
                    }
                    return intervalTemp;
                    break;
                case 'easeOut':
                    // First time to click stop raffling won't calculate the intervalTemp
                    if (clickStopFlag) {
                        intervalTemp = Math.round(cubicBezier.easeOut(axisXTemp) * interval);
                        if (axisXTemp <= axisXMax && intervalTemp < interval) {
                            axisXTemp += axisStep;
                        } else if (intervalTemp === interval) {
                            intervalTemp = interval;
                            axisXTemp += axisStep;
                        } else {
                            intervalTemp = Infinity;
                        }
                    } else {
                        clickStopFlag = true;
                        axisXTemp += axisStep; // to avoid axisXTemp = 0, which will make intervalTemp = 0
                    }
                    return intervalTemp;
                    break;
                default:
                    return intervalTemp;
                    break;
            }
        };

        /**
         * raffling
         * Raffling timer
         * @param {string} type - raffling type
         */
        var raffling = function (type) {
            intervalTemp = calcInterval(type);
            // console.log(intervalTemp);

            timer = setTimeout(function () {
                if (intervalTemp !== Infinity) {
                    bingoTemp = noRepeatNumGenerator(leftP);
                    processing(bingoTemp);
                    raffling(type);
                } else {
                    resetTimer(true);
                }
            }, intervalTemp);
        };

        /**
         * raffleEase
         * Raffling processing to control raffling animation
         * @param {function} callback - raffling function
         * @param {string} type - raffling type
         */
        var raffleEase = function (callback, type) {
            callback(type);
        };

        // Start raffle
        var raffleStart = function () {
            if (leftP.length) {
                // First time to click start raffling will calculate the number
                if (!clickStartFlag) {
                    bingoTemp = noRepeatNumGenerator(leftP);
                    processing(bingoTemp);
                }
                if (timer === undefined) {
                    raffleEase(raffling, 'easeIn');
                }
            }
        };

        // Stop raffle
        var raffleStop = function () {
            if (timer !== undefined && !clickStopFlag && intervalTemp === intervalMin) {
                resetTimer();
                raffleEase(raffling, 'easeOut');
            }
        };

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