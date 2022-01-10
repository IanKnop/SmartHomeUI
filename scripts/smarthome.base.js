/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Common Functions
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

const SET_DELAY_SLEEP = 30;   //seconds until sleep mode begins
const SET_DELAY_DIM = 30;   //seconds more until dimming is activated if between SET_DIM_START and SET_DIM_END 

const SET_DIM_START = 23;   //:00 dimming is activated
const SET_DIM_END = 07;   //:00 dimming is de-activated

const DEFAULT_CONTROL = 'canvas'
const URL_ENCODED = 'application/x-www-form-urlencoded';

var ControlProviders = {};

var SmartHomeUI = new function () {

    this.initialize = function () {

        SmartHomeUI.Audio.initializeAudio();
        SmartHomeUI.SleepScreen.initialize();

        // INITIAL SOUND
        SmartHomeUI.Audio.playSound('VIEW');
    }

    /*  =========================================================
         NAVIGATION
        =========================================================  */

    this.showVariant = function (variantId) {

        /* showVariant()_______________________________________________________
        Shows variant of current view                                         */

        this.showView(currentView, variantId);
    }

    this.showView = function (viewId, variantId = null) {

        /* showView()__________________________________________________________
        Changes current view to given page id                                 */

        window.location = '?view=' + viewId + (variantId != null ? '&variant=' + variantId : '');
    }

    this.openWindow = function (windowId) {

        /* openWindow()________________________________________________________
        Opens a window                                                        */

        document.getElementById('window-container-' + windowId).style.visibility = 'visible';

    }

    this.closeWindow = function (windowId) {

        /* closeWindow()_______________________________________________________
        Opens a window                                                        */

        document.getElementById('window-container-' + windowId).style.visibility = 'collapse';

    }

    /*  =========================================================
         UI
        =========================================================  */
    this.showWaitAnimation = function (duration = null) {

        /* showWaitAnimation()________________________________________________
        Show wait animation during processes                                 */

        document.getElementById('cc-ping').style.visibility = 'visible';

        if (duration != null) setTimeout(function () {
            hidePing();
        }, duration);
    }

    this.hideWaitAnimation = function () {

        /* hideWaitAnimation()________________________________________________
        Hide wait animation                                                  */

        document.getElementById('cc-ping').style.visibility = 'collapse';
    }

    /*  =========================================================
         INTERFACE REQUESTS 
        =========================================================  */
    this.InterfaceRequest = new function () {

        this.send = function (url, data, returnFunction = null, paramValue = null, contentType = 'application/json; charset=UTF-8') {

            /* send()_____________________________________________________________
            Send interface request as JSON object                                */

            var httpRequest = new XMLHttpRequest();

            httpRequest.timeout = 250;
            httpRequest.ontimeout = function (a) {

                returnFunction([]);
            };

            httpRequest.onreadystatechange = function () {
                if (returnFunction != null && this.readyState == 4 && this.status == 200) {
                    if (paramValue != null) {

                        returnFunction(JSON.parse(this.responseText), paramValue);

                    } else {

                        returnFunction(JSON.parse(this.responseText));

                    }
                } else {
                    //httpRequest.abort();
                }
            };

            httpRequest.open('GET', url, true);
            httpRequest.setRequestHeader('Content-type', contentType);
            httpRequest.send(data);
        }

        this.urlExists = function (url) {

            /* urlExists()________________________________________________________
            Checks wearther url exists                                           */

            var http = new XMLHttpRequest();

            http.open('HEAD', url, false);
            http.send();

            return (http.status == 200);
        }
    }

    /*  =========================================================
         SLEEP SCREEN
        =========================================================  */
    this.SleepScreen = new function () {

        // PROPERTIES
        this.activated = true;
        this.delaySleep = SET_DELAY_SLEEP;
        this.delayDimming = SET_DELAY_DIM;
        this.dimAfterHour = SET_DIM_START;
        this.dimBeforeHour = SET_DIM_END;
        this.wallpaper = 'wallpaper-A.jpg';     // file must be located in "/img/wallpaper"

        // STATES PROPERTIES
        this.isWakingUp = false;
        this.isGoingToSleep = false;

        // INTERNAL VARIABLES
        var sleepTimeoutHandle = null;
        var dimTimeoutHandle = null;
        var iterationCount = 0;
        var lastSleep = null;

        this.initialize = function () {

            /* initialize()____________________________________________
            Sets events to recognize user activity                               */

            var wakeUpEvents = ["mousedown", "mousemove", "touchstart"];
            if (SmartHomeUI.SleepScreen.activated) {

                wakeUpEvents.forEach(eventId => window.addEventListener(eventId, function (event) { interruptSleep(event); }));
                doSleepScreenInterval();
            }
        }

        this.show = function () {

            /* show()__________________________________________________
            Shows screen saver                                                   */

            var sleepScreen = document.getElementById('cc-screensaver');
            if (sleepScreen != undefined && sleepScreen != null) {

                // SET WALLPAPER
                sleepScreen.style.backgroundImage = 'url(\'img/wallpaper/' + SmartHomeUI.SleepScreen.wallpaper + '\')';
                sleepScreen.style.display = 'flex';

                // FADE IN SLEEP SCREEN
                fadeIn('cc-screensaver');

                SmartHomeUI.SleepScreen.isGoingToSleep = true;
                setTimeout(function () {

                    sleepScreen.style.opacity = 1;

                    SmartHomeUI.SleepScreen.isGoingToSleep = false;
                    lastSleep = new Date();

                }, getFadeInTime());
            }
        }

        this.hide = function () {

            /* hide()__________________________________________________
            Hides screen saver                                                   */

            // STOP DIM SCREEN FROM POPPING UP
            clearTimeout(dimTimeoutHandle);

            // FADE OUT CURRENTLY RUNNING SLEEP SCREEN
            fadeOut('cc-screensaver');
            SmartHomeUI.SleepScreen.undim();

            SmartHomeUI.SleepScreen.isWakingUp = true;
            setTimeout(function () {

                document.getElementById('cc-screensaver').style.opacity = 0;
                document.getElementById('cc-screensaver').style.display = 'none';

                SmartHomeUI.SleepScreen.isWakingUp = false; iterationCount = 0;
                lastSleep = null;

            }, getFadeOutTime());

        }

        this.dim = function () {

            /* dim()______________________________________________________________
            Shows additional dim screen overlay for night time                   */

            document.getElementById('cc-screensaver-dim').style.display = 'block';
            fadeIn('cc-screensaver-dim');
        }

        this.undim = function () {

            /* undim()____________________________________________________________
            Hides dim screen                                                     */

            fadeOut('cc-screensaver-dim');
            setTimeout(function () { document.getElementById('cc-screensaver-dim').style.display = 'none'; }, getFadeOutTime());
        }

        function doSleepScreenInterval() {

            /* doSleepScreenInterval()_______________________________________________________
            Checks user activity after SCEEN_SAVER_WAIT seconds                  */

            sleepTimeoutHandle = setInterval(function () {

                iterationCount++;
                if (iterationCount == SmartHomeUI.SleepScreen.delaySleep) {

                    // SCREENSAVER IF NO USER ACTION
                    iterationCount = 0;
                    if (!SmartHomeUI.SleepScreen.isWakingUp && !SmartHomeUI.SleepScreen.isGoingToSleep && !isSleeping()) SmartHomeUI.SleepScreen.show();
                }

                // DIM SCREEN IF SCREEN SAVER ACTIVE AND WAITING TIME PASSED
                var now = new Date();

                if (lastSleep != null && isSleeping() && !isDimmed() && (now - lastSleep) >= (SmartHomeUI.SleepScreen.delayDimming * 1000) && (now.getHours() >= SmartHomeUI.SleepScreen.dimAfterHour || now.getHours() <= SmartHomeUI.SleepScreen.dimBeforeHour)) {

                    SmartHomeUI.SleepScreen.dim();
                }
                else if (isDimmed() && now.getHours() < SmartHomeUI.SleepScreen.dimAfterHour && now.getHours() > SmartHomeUI.SleepScreen.dimBeforeHour) {

                    SmartHomeUI.SleepScreen.undim();
                }

            }, 1000);
        }

        function interruptSleep(event = null) {

            /* interruptSleep()___________________________________________________
            User interrupts sleep by touching screen or moving mouse             */

            if ((event != null && (event.srcElement == undefined || !isCanvasButton(event.srcElement))) && isSleeping()) SmartHomeUI.SleepScreen.hide();
            else iterationCount = 0;
        }

        function isSleeping() {

            /* isSleeping()_______________________________________________________
            Checks if screen saver is shown currently                            */

            return (document.getElementById('cc-screensaver') != null && hasClass('cc-screensaver', 'screensaver-fadeIn'));

        }

        function isDimmed() {

            /* isDimmed()_________________________________________________________
            Checks if dim screen is visible                                      */

            return (document.getElementById('cc-screensaver-dim') != null && hasClass('cc-screensaver-dim', 'screensaver-fadeIn'));

        }

        function isCanvasButton(senderElement) {

            /* isCanvasButton()___________________________________________________
            Checks if user touched sleep screen control (avoid waking up)        */

            return (senderElement.classList.contains('switch-control') || senderElement.classList.contains('select-control') || senderElement.classList.contains('button-image'));
        }

        function getFadeInTime() {

            return parseInt(getVar('--fade-in-duration')) * 1000;
        }

        function getFadeOutTime() {

            return parseInt(getVar('--fade-out-duration')) * 1000;
        }

        function fadeOut(target) {

            removeClass(target, 'screensaver-fadeIn');
            addClass(target, 'screensaver-fadeOut');

        }

        function fadeIn(target) {

            removeClass(target, 'screensaver-fadeOut');
            addClass(target, 'screensaver-fadeIn');

        }
    }

    /*  =========================================================
         AUDIO
        =========================================================  */
    this.Audio = new function () {

        this.soundBaseFolder = '/sounds/';
        this.soundEffects = ["computerbeep_4.mp3", "computerbeep_17.mp3", "keyok1.mp3", "keyok2.mp3", "keyok3.mp3"];

        this.initializeAudio = function () {

            /* initializeAudio - Initialize special audio driver for avoiding lags on iOS */
            lowLag.init({ 'force': 'audioContext' });

            this.soundEffects.forEach(fileName => {
                lowLag.load(this.soundBaseFolder + fileName);
            });
        }

        this.playSound = function (soundId, volume = 1) {

            /* playSound - Play audio file by pseudonym (all files should be preloaded first) */
            switch (soundId.toUpperCase()) {

                case 'KEY1':
                    lowLag.play(this.soundBaseFolder + 'keyok1.mp3');
                    break;
                case 'KEY2':
                    lowLag.play(this.soundBaseFolder + 'keyok2.mp3');
                    break;
                case 'KEY3':
                    lowLag.play(this.soundBaseFolder + 'keyok3.mp3');
                    break;
                case 'VIEW':
                    lowLag.play(this.soundBaseFolder + 'computerbeep_4.mp3');
                    break;
                case 'SCENE':
                    lowLag.play(this.soundBaseFolder + 'computerbeep_17.mp3');
                    break;
            }
        }
    }

    /*  =========================================================
         MESSAGE BOX
        =========================================================  */
    this.MessageBox = new function () {

        this.show = function (message, showClose = true) {

            /* show()_____________________________________________________________
            Show Message Box with info text                                      */

            document.getElementById('cc-msgbox-text').innerHTML = message;
            document.getElementById('cc-msgbox').style.visibility = 'visible';
            document.getElementById('cc-msgbox-close').style.visibility = (showClose ? 'visible' : 'collapse');
        }

        this.close = function () {

            /* close()____________________________________________________________
            Close Message Box                                                    */

            document.getElementById('cc-msgbox').style.visibility = 'collapse';
        }
    }
}

/* =========================================================
   BASE - HTTP REQUESTS
   ========================================================= */

function moduleSimpleRefreshState(className, control, iteration, frequency) {

    if (iteration == frequency) {

        SmartHomeUI.InterfaceRequest.send('index.php?request=module&class=' + className, null, function (returnValue) {

            var refreshContent = new DOMParser().parseFromString(urlDecode(returnValue.message), "text/html");
            document.getElementById(control.id).innerHTML = refreshContent.getElementById(control.id).innerHTML;
        });

        return 0;

    } else return (iteration + 1);
}


