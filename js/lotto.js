/**
 * 抽奖器
 * 
 * @description 从一组抽奖数据中，每次抽取一个中奖数据
 * @author J.Soon <serdeemail@gmail.com>
 */
(function (root, factory) {
    // 组件名称
    var comPrefix = 'com_'; // 前缀
    var comName = 'lotto'; // 名称
    var globalName = comPrefix + comName; // 全局名称

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['bezier-easing'], function (BezierEasing) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root[globalName] = factory(BezierEasing));
        });
    } else {
        // Browser globals
        var BezierEasing = root['BezierEasing'];
        root[globalName] = factory(BezierEasing);
    }
}(typeof window !== "undefined" ? window : this, function (BezierEasing) {
    // Lotto functional constructor
    /**
     * 抽奖器
     * 
     * @param   {object}      cfg               抽奖参数
     * @param   {object[]}    cfg.participants  抽奖者对象数组
     * @param   {number}      cfg.interval      抽奖定时器间隔时间
     * @param   {number}      cfg.step          贝塞尔曲线的x轴的值，x的定义域为x∈[0,1]，用于计算渐进渐出的interval的值
     * @param   {number}      cfg.transition    抽奖定时器过渡动画类型，1：渐进渐出ease-in-out，2：匀速linear，默认1
     * @param   {function}    cfg.processing    抽奖中回调函数
     * @param   {function}    cfg.success       抽奖结束回调函数
     */
    var lotto = function () {
        /******************************************************************
         * ATTRIBUTES
         *****************************************************************/
        var that = {}; // new object
        var cfg = arguments[0] || {}; // config
        var participants = cfg.participants || []; // participants
        var allP = []; // all participants
        var leftP = []; // left participants equals to allP in the beginning
        // Init allP & leftP
        for (var i = 0; i < participants.length; i += 1) {
            // Participant struct
            allP.push({
                id: i,
                participant: participants[i]
            });
            leftP.push({
                id: i,
                participant: participants[i]
            });
        }
        var chosenP = []; // chosen participants
        var bingoTemp; // the temp chosen one in the raffling
        var curP; // current random participant
        var prevP; // previous random participant
        var timer; // timer of the raffle
        var interval = cfg.interval || 1000; // init interval of the timer
        if (interval <= 70) {
            throw new Error('The interval must greater than or equals to 70ms');
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
        var transition = cfg.transition || 1;
        var clickStartFlag = false; // if start button being clicked
        var clickStopFlag = false; // if stop button being clicked
        // Events
        /**
         * processing
         * callback
         * @param {object} bingo - the bingo participant
         */
        var processing = cfg.processing || function (bingo) {}; // processing of raffle
        /**
         * success
         * callback
         * @param {object} bingo - the bingo participant
         * @param {array} leftP - the left participants
         */
        var success = cfg.success || function (bingo, leftP) {}; // bingo of raffle


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
                default:
                    return intervalTemp;
            }
        };

        /**
         * raffling
         * Raffling timer
         * @param {string} type - raffling type
         * @param {function} cb - raffling stop callback
         */
        var raffling = function (type, cb) {
            intervalTemp = calcInterval(type);
            // console.log(intervalTemp);

            timer = setTimeout(function () {
                if (intervalTemp !== Infinity) {
                    bingoTemp = noRepeatNumGenerator(leftP);
                    processing(bingoTemp);
                    raffling(type);
                } else {
                    resetTimer(true);
                    typeof cb === 'function' && cb();
                }
            }, intervalTemp);
        };

        /**
         * raffleEase
         * Raffling processing to control raffling animation
         * @param {function} callback - raffling function
         * @param {string} type - raffling type
         * @param {function} cb - raffling stop callback
         */
        var raffleEase = function (callback, type, cb) {
            callback(type, cb);
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
                    switch (transition) {
                        case 2:
                            raffleEase(raffling, 'linear');
                            break;
                        default:
                            raffleEase(raffling, 'easeIn');
                            break;
                    }
                }
            }
        };

        /**
         * Stop raffle
         * @param {function} cb - raffling stop callback
         */
        var raffleStop = function (cb) {
            // debugger;
            // if (timer !== undefined && !clickStopFlag && intervalTemp === intervalMin) {
            if (timer !== undefined && !clickStopFlag) {
                switch (transition) {
                    case 2:
                        resetTimer(true);
                        // raffleEase(raffling, 'linear', cb);
                        break;
                    default:
                        resetTimer();
                        raffleEase(raffling, 'easeOut', cb);
                        break;
                }
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