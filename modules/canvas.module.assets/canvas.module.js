/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas Module Functions
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

// ADAPTER REGISTRATION AFTER LOAD
this.addEventListener("load", function () {

    ControlProviders.canvas = new canvas();

});

// ADAPTER BASE FUNCTION
function canvas() {}

/* =========================================================
    UPDATE ACTIVE STATE
   ========================================================= */
canvas.prototype.updateActiveState = function(control, state, deviceId) {

    /* updateActiveState()________________________________________________
    Changes style of given element to active or inactive                 */

    var currentControl = document.getElementById(control.id);
    if (currentControl.getAttribute('cc-type')) {

        switch (currentControl.getAttribute('cc-type').toLowerCase()) {

            case 'switch':
                if (state) {

                    currentControl.classList.add('switch-control-active' + (currentControl.hasAttribute('cc-color') ? '-' + currentControl.getAttribute('cc-color').toLowerCase() : ''));
                    currentControl.querySelectorAll('div.indicator')[0].style.visibility = 'visible';
                    currentControl.setAttribute('cc-value', 'true');

                } else {

                    currentControl.classList.remove('switch-control-active' + (currentControl.hasAttribute('cc-color') ? '-' + currentControl.getAttribute('cc-color').toLowerCase() : ''));
                    currentControl.querySelectorAll('div.indicator')[0].style.visibility = 'hidden';
                    currentControl.setAttribute('cc-value', 'false');
                }
        }
    }
}

/* =========================================================
    BUTTON GROUP FUNCTIONS
   ========================================================= */

function setValueLabel(refreshTarget, value) {

    /* setValueLabel()_______________________________________________________
    Sets value label                                                        */

    var currentTarget = refreshTarget.querySelectorAll('span.value-label')[0];

    var currentType = 'text';
    if (currentTarget.hasAttribute('cc-type')) currentType = currentTarget.getAttribute('cc-type').toLowerCase();

    var suffix = currentTarget.hasAttribute('cc-suffix') ? currentTarget.getAttribute('cc-suffix') : '';

    switch (currentType) {

        case 'numeric':
            var decimals = currentTarget.getAttribute('cc-decimals');
            currentTarget.innerHTML = replaceComma(decimals != null ? parseFloat(value).toFixed(decimals) : value) + (suffix != null ? suffix : '');
            break;
        default:
            currentTarget.innerHTML = value + (suffix != null ? suffix : '');
            break;
    }
}

function changeTimeValue(refreshTarget, seconds) {

    /* changeTimeValue()_____________________________________________________
    Modifies time-value in buttongroup control by given amount of seconds   */

    var timeValue = Date.parse(refreshTarget.innerHTML) + seconds;
    setValueLabel(refreshTarget, timeValue);

}   

/* =========================================================
    BACKGROUND ASPECT RATIO IMAGE
   ========================================================= */

function keepAspectResize(outerElement, innerElement, contentRatio = 1) {

    /* keepAspectResize()_______________________________________________________
    Method for resizing canvas keeping aspect ratio                            */     

    var containerRatio = outerElement.clientWidth / outerElement.clientHeight;

    if (contentRatio < containerRatio) {
    
        innerElement.style.height = outerElement.clientHeight;

        var targetWidth = outerElement.clientHeight * contentRatio;
        var targetMargin = Math.max(0, outerElement.clientWidth - targetWidth) / 2;
        
        innerElement.style.width = targetWidth;
        
        innerElement.style.top = 0;
        innerElement.style.left = targetMargin;

    } else if (contentRatio >= containerRatio) {

        innerElement.style.width = outerElement.clientWidth;

        var targetHeight = outerElement.clientWidth / contentRatio;
        var targetMargin = Math.max(0, outerElement.clientHeight - targetHeight) / 2;
        
        innerElement.style.height = targetHeight;
        
        innerElement.style.left = 0;
        innerElement.style.top = targetMargin;
    }
}

function getCanvasContainer(canvasId) {

    /* getCanvasContainer()_____________________________________________________
    Returns container object by canvas id                                      */

    return document.getElementById('canvas-' + canvasId);
    
}

function getCanvasContent(canvasId) {

    /* getCanvasContent()_______________________________________________________
    Returns canvas content object by canvas id                                 */

    return document.getElementById('canvas-content-' + canvasId);
}