/**
 * CSS3动画幸运之轮
 * 
 * @description 转盘抽奖器，旋转到中奖的奖品处（对应角度）
 * @author J.Soon <serdeemail@gmail.com>
 */
(function (root, factory) {
    // 组件名称
    var comPrefix = 'com_'; // 前缀
    var comName = 'fortuneWheel'; // 名称
    var globalName = comPrefix + comName; // 全局名称

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root[globalName] = factory());
        });
    } else {
        // Browser globals
        root[globalName] = factory();
    }
}(typeof window !== "undefined" ? window : this, function () {

    // /**
    //  * 幸运之轮转盘
    //  * @param {object} opts 
    //  */
    // var fortuneWheel = function (opts) {
    //     // 共有属性
    //     var that = {};
    //     // 私有属性
    //     var wheel = document.getElementById('J_FortuneWheel'); // 转盘对象
    //     var prizes = ['超级红包', '18元', '8元', '6元', '3元', '1元']; // 奖品
    //     var prizesAngles = [0, 60, 120, 180, 240, 300]; // 奖品旋转角度

    //     // 初始化转盘
    //     var init = function () {
    //         // 初始旋转样式
    //         wheel.style.transform = 'rotate(0deg)';
    //         wheel.style.transitionProperty = 'transform';
    //         wheel.style.transitionDuration = '60s';
    //         wheel.style.transitionTimingFunction = 'ease-in';
    //         wheel.style.transitionDelay = '0s';

    //         return that;
    //     };

    //     // 开始旋转
    //     var begin = function () {
    //         init();
    //         var perigon = 360; // 周角
    //         var turns = 480; // 旋转圈数
    //         wheel.style.transform = 'rotate(' + perigon * turns + 'deg)';

    //         return that;
    //     };
    //     that.begin = begin;

    //     // 停止旋转（获取到中奖数据后）
    //     var stop = function () {
    //         var bingo = Math.round(Math.random() * 5); // 模拟中奖奖品
    //         console.log(bingo, ':', prizesAngles[bingo]);

    //         // setTimeout(function () {
    //         // }, 1000);

    //         // var deg = 360 * 3 + prizesAngles[bingo];
    //         var deg = 1800 + 360 + prizesAngles[bingo];

    //         wheel.style.transform = 'rotate(' + deg + 'deg)';
    //         wheel.style.transitionDuration = '3s';
    //         wheel.style.transitionTimingFunction = 'ease-out';
    //         wheel.style.transitionDelay = '0s';
    //     };
    //     that.stop = stop;

    //     return that;
    // };


    /**
     * 幸运之轮转盘
     * @param {object} opts 
     */
    var fortuneWheel = function (opts) {
        // 公有属性
        var that = {};
        // 私有属性
        var ctx = document.getElementById('J_FortuneWheel').getContext('2d'); // 转盘画布
        var prizes = ['超级红包', '18元', '8元', '6元', '3元', '1元']; // 奖品
        var prizesAngles = [0, 60, 120, 180, 240, 300]; // 奖品旋转角度
        var curAngle = 0; // 当前旋转角度
        var curAnimation; // 当前动画
        var beginFlag = false; // 动画开始标识
        var stopFlag = true; // 动画结束标识
        var buffer = 0; // 动画停止初始化缓冲圈数
        var bufferMax = 2; // 动画停止缓冲圈数

        // 切换动画状态
        var switchFlag = function () {
            if (beginFlag) {
                beginFlag = false;
            } else {
                beginFlag = true;
            }
            if (stopFlag) {
                stopFlag = false;
            } else {
                stopFlag = true;
            }
        };

        // 初始化转盘
        var wheel = new Image();
        wheel.src = '../img/clock.png';
        var init = function () {
            wheel.onload = function () {
                ctx.clearRect(0, 0, 512, 512);
                ctx.drawImage(wheel, 0, 0, 512, 512);
            };
        };
        that.init = init;
        init();

        // 开始旋转
        var perigon = 360; // 周角
        var turns = 10; // 旋转圈数
        var degrees = perigon * turns; // 旋转角度
        var unitRadian = Math.PI / 180; // 单位弧度
        var curRadian = 0; // 当前旋转弧度
        var targetRadian = 240 * unitRadian;

        var rolling = function () {
            // 如果当前弧度小于等于总旋转弧度，则进行旋转动画
            // if (curRadian <= degrees * unitRadian) {
            // if (curRadian <= 360 * unitRadian) {
            // if (!stopFlag) {
            // 1. Clear the canvas
            // 清除画布内容，重新渲染
            ctx.clearRect(0, 0, 512, 512);
            // 2. Save the canvas state
            ctx.save();
            // 3. Draw animated shapes
            ctx.translate(512 / 2, 512 / 2); // 位移画布使转盘保持在画布中央
            ctx.rotate(curRadian);
            ctx.drawImage(wheel, -512 / 2, -512 / 2, 512, 512); // 位移转盘图片其旋转点位于图片中央

            curRadian += unitRadian * 10; // 每帧旋转10度（旋转速度）

            // 当达到目标角度后，则停止动画
            if (stopFlag) {
                if (buffer === bufferMax) {
                    if (curRadian > targetRadian) {
                        curRadian = targetRadian;
                        buffer = 0;
                        window.cancelAnimationFrame(curAnimation);
                        return;
                    }
                }
            }

            // 旋转超过360度后，重置当前角度和弧度，保证旋转继续进行
            if (curRadian > 360 * unitRadian) {
                curRadian = 0;
                if (stopFlag) {
                    buffer += 1;
                }
                console.log(buffer);

            }
            // 4. Restore the canvas state
            ctx.restore();
            // 5. Continue next frame animation
            curAnimation = window.requestAnimationFrame(rolling);
            // }
        };

        var begin = function () {
            beginFlag = true;
            stopFlag = false;
            rolling();
        };
        that.begin = begin;

        var stop = function () {
            beginFlag = false;
            stopFlag = true;
        };
        that.stop = stop;

        return that;
    };

    return fortuneWheel;

}));