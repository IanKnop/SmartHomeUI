/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Common Functions
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */
const VERSION = '2.0.1';

const SCREEN_SAVER = true;              // enable screensaver
const SCREEN_SAVER_WAIT = 30;           // time in seconds until screen saver starts

const SCREEN_SAVER_DIM_WAIT   = 30;     // time in seconds until screen saver is dimmed (null if no dimming)
const SCREEN_SAVER_DIM_AFTER  = 23;     // time from which dimming is activated
const SCREEN_SAVER_DIM_BEFORE = 6;      // time to which dimming stays aktivated

const URL_ENCODED = 'application/x-www-form-urlencoded';

const DEFAULT_CONTROL_PROVIDER = 'canvas'
var ControlProviders = {};

var lockWallpaper = 'wallpaper-A.jpg';

var screenSaverDimStart; 
var screenSaverDimEnd; 

var sleepTimeout = null;
var dimTimeout = null;

var isWakingUp = false;
var isGoingToSleep = false;

var sleepIterationCount = 0;
var lastSleepTime = null;

function initializeUserInterface() {

    initializeAudio();
    initializeSleepScreen();

    /* Play sound when view is loaded */
    playSound('VIEW');
}

/* =========================================================
   UI - NAVIGATION
   ========================================================= */

function showView(viewId, variantId = null) {

    /* showView - Changes current view to given page id */

    window.location = '?view=' + viewId + (variantId != null ? '&variant=' + variantId : '');
}

function openWindow(windowId) {

    document.getElementById('window-container-' + windowId).style.visibility = 'visible';

}

function closeWindow(windowId) {

    document.getElementById('window-container-' + windowId).style.visibility = 'collapse';

}

function showVariant(variantId) {

    /* showVariant - Shows variant of current view */

    showView(currentView, variantId);
}

/* =========================================================
   UI - AUDIO
   ========================================================= */

/* List of preloaded sound files in given base folder */
var soundBaseFolder = '/sounds/';
var soundEffects = ["computerbeep_4.mp3", "computerbeep_17.mp3", "keyok1.mp3", "keyok2.mp3", "keyok3.mp3"];

function initializeAudio() {

    /* initializeAudio - Initialize special audio driver for avoiding lags on iOS */    
    lowLag.init({ 'force': 'audioContext' });

    soundEffects.forEach(fileName => {
        lowLag.load(soundBaseFolder + fileName);
    });
}

function playSound(soundId, volume = 1) {

    /* playSound - Play audio file by pseudonym (all files should be preloaded first) */ 
    switch (soundId.toUpperCase()) {

        case 'KEY1':
            lowLag.play(soundBaseFolder + 'keyok1.mp3');
            break;
        case 'KEY2':
            lowLag.play(soundBaseFolder + 'keyok2.mp3');
            break;
        case 'KEY3':
            lowLag.play(soundBaseFolder + 'keyok3.mp3');
            break;
        case 'VIEW':
            lowLag.play(soundBaseFolder + 'computerbeep_4.mp3');
            break;
        case 'SCENE':
            lowLag.play(soundBaseFolder + 'computerbeep_17.mp3');
            break;
    }
}

/* =========================================================
   UI - SCREENSAVER
   ========================================================= */
function initializeSleepScreen() {
    
    /* initializeSleepScreen()____________________________________________
    Sets events to recognize user activity                               */

    var wakeUpEvents = ["mousedown", "mousemove", "touchstart"];
    if (SCREEN_SAVER) {

        wakeUpEvents.forEach(eventId => window.addEventListener(eventId, function (event) { interruptSleep(event); }));
        doSleepScreenInterval();
    }
}
   
function doSleepScreenInterval() {

    /* doSleepScreenInterval()_______________________________________________________
    Checks user activity after SCEEN_SAVER_WAIT seconds                  */

    sleepTimeout = setInterval(function() { 
        
        sleepIterationCount++;
        if (sleepIterationCount == SCREEN_SAVER_WAIT) {

            // SCREENSAVER IF NO USER ACTION
            sleepIterationCount = 0;
            if (!isWakingUp && !isGoingToSleep && !isSleeping()) showScreenSaver();
        }

        // DIM SCREEN IF SCREEN SAVER ACTIVE AND WAITING TIME PASSED
        var now = new Date();
        if (lastSleepTime != null && isSleeping() && !isDimmed() && (now - lastSleepTime) >= (SCREEN_SAVER_DIM_WAIT * 1000) && (now.getHours() >= SCREEN_SAVER_DIM_AFTER || now.getHours() <= SCREEN_SAVER_DIM_BEFORE)) showDimScreen();
        else if (isDimmed() && now.getHours() < SCREEN_SAVER_DIM_AFTER && now.getHours() > SCREEN_SAVER_DIM_BEFORE) hideDimScreen();
       
    }, 1000);
}

function interruptSleep(event = null) {

    /* interruptSleep()___________________________________________________
    User interrupts sleep by touching screen or moving mouse             */
    
    if ((event != null && (event.srcElement == undefined || !isCanvasButton(event.srcElement))) && isSleeping()) hideScreenSaver();
    else sleepIterationCount = 0;
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


function showScreenSaver() {

    /* showScreenSaver()__________________________________________________
    Shows screen saver                                                   */

    var screenSaver = document.getElementById('cc-screensaver');
    
    if (screenSaver != undefined && screenSaver != null) {

        // SET WALLPAPER
        screenSaver.style.backgroundImage = 'url(\'img/wallpaper/' + lockWallpaper + '\')';
        
        screenSaver.style.display = 'flex';
        fadeIn('cc-screensaver');

        isGoingToSleep = true;
        setTimeout(function () { 
            
            screenSaver.style.opacity = 1; 

            isGoingToSleep = false; 
            lastSleepTime = new Date();

        }, getFadeInTime());
    }
}

function hideScreenSaver() {

    /* hideScreenSaver()__________________________________________________
    Hides screen saver                                                   */

    clearTimeout(dimTimeout);
    fadeOut('cc-screensaver');
    hideDimScreen();

    isWakingUp = true;
    setTimeout(function () {
    
        document.getElementById('cc-screensaver').style.opacity = 0;
        document.getElementById('cc-screensaver').style.display = 'none';
        isWakingUp = false;
        
        sleepIterationCount = 0; 
        lastSleepTime = null;

    }, getFadeOutTime());
    
}

function showDimScreen() {

    /* showDimScreen()____________________________________________________
    Shows additional dim screen overlay for night time                   */

    document.getElementById('cc-screensaver-dim').style.display = 'block';
    fadeIn('cc-screensaver-dim');
}

function hideDimScreen() {

    /* hideDimScreen()____________________________________________________
    Hides dim screen                                                     */

    fadeOut('cc-screensaver-dim');
    setTimeout(function () { document.getElementById('cc-screensaver-dim').style.display = 'none'; }, getFadeOutTime());
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

/* =========================================================
   UI - MESSAGE BOX
   ========================================================= */

function msgBox(message, showClose = true) {

    document.getElementById('cc-msgbox-text').innerHTML = message;
    document.getElementById('cc-msgbox').style.visibility = 'visible';
    document.getElementById('cc-msgbox-close').style.visibility = (showClose ? 'visible' : 'collapse');
}

function closeBox() {

    document.getElementById('cc-msgbox').style.visibility = 'collapse';

}

/* =========================================================
   UI - PARSING
   ========================================================= */

function parseExpressions(subject) {

    /* parseExpressions()___________________________________________________
    Parses text with standard expressions (i.e. date, time)                */   

    switch (subject.toUpperCase()) {

        case 'CURRENT_DATE_LONG':
            var thisMoment = new Date();
            return thisMoment.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            //.getDay() + ', ' + thisMoment.getDay() + '. ' + thisMoment.getMonth() + ' ' + thisMoment.getFullYear();
        case 'CURRENT_TIME':
            var thisMoment = new Date();
            return thisMoment.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            //return thisMoment.getHours() + ':' + thisMoment.getMinutes();            
    }

    return subject;
}

/* =========================================================
   UI - WAIT EFFECT (PING)
   ========================================================= */

function showPing(duration = null) {

    document.getElementById('cc-ping').style.visibility = 'visible';
    
    if (duration != null) setTimeout(function() {
        hidePing();
    }, duration);
}

function hidePing() {

    document.getElementById('cc-ping').style.visibility = 'collapse';
}

/* =========================================================
   BASE - HTTP REQUESTS
   ========================================================= */

function sendInterfaceRequest(url, data, returnFunction = null, paramValue = null, contentType = 'application/json; charset=UTF-8') {

    /* sendInterfaceRequest()_____________________________________________
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

function urlExists(url) {

    /* urlExists()________________________________________________________
    Checks wearther url exists                                           */

    var http = new XMLHttpRequest();

    http.open('HEAD', url, false);
    http.send();
    
    return (http.status == 200);
}

function moduleSimpleRefreshState(className, control, iteration, frequency) {

    if (iteration == frequency) {

        sendInterfaceRequest('index.php?request=module&class=' + className, null, function(returnValue) {
    
            var refreshContent = new DOMParser().parseFromString(urlDecode(returnValue.message), "text/html");
            document.getElementById(control.id).innerHTML = refreshContent.getElementById(control.id).innerHTML;
        });
        
        return 0;

    } else return (iteration + 1);
}

/* =========================================================
   BASE - TOOLS
   ========================================================= */

function toBool(variantValue) {

    /* toBool()___________________________________________________________
    Transform variant value types to valid boolean value                 */

    if (typeof variantValue === 'boolean') return variantValue;
    else if (variantValue.toString().toLowerCase() == 'true' || variantValue.toString() == '1') return true;
    else return false;

}

function hasClass(target, targetClass) {
    return document.getElementById(target).classList.contains(targetClass);
}

function addClass(target, targetClass) {
    document.getElementById(target).classList.add(targetClass);
}

function removeClass(target, targetClass) {
    document.getElementById(target).classList.remove(targetClass);
}

function getVar(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName);
}

function replaceComma(inputString) {

    /* replaceComma()________________________________________________________
    Changes number value string to German format                            */ 

    return (inputString != null ? inputString.toString().replace(/,/g , "__COMMA__").replace(/\./g, ',').replace(/__COMMA__/g, '.') : 0);
}

function urlDecode(inputString) {

    /* urlDecode()________________________________________________________
    Decodes PHP encoded url string                                       */
    
    return decodeURIComponent(inputString.replace(/\+/g, ' '));
}

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
   }
   
