/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas Module Functions
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

// ADAPTER REGISTRATION AFTER LOAD
this.addEventListener("load", function () {

    ControlProviders.canvas = new Canvas();

});

// ADAPTER BASE FUNCTION
function Canvas() {

    Canvas.prototype.updateActiveState = function (control, state, deviceId) {

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

/*  =========================================================
     BACKGROUND ASPECT RATIO IMAGE
    =========================================================  */
    Canvas.prototype.keepAspectResize = function(outerElement, innerElement, contentRatio = 1) {

        /* keepAspectResize()_______________________________________________________
        Method for resizing canvas keeping aspect ratio                            */
    
        var containerRatio = outerElement.clientWidth / outerElement.clientHeight;
    
        if (contentRatio < containerRatio) {
    
            var targetWidth = outerElement.clientHeight * contentRatio;
            var targetMargin = Math.max(0, outerElement.clientWidth - targetWidth) / 2;
    
            setDimensions(innerElement, 0, targetMargin, outerElement.clientHeight, targetWidth);
    
        } else if (contentRatio >= containerRatio) {
    
            var targetHeight = outerElement.clientWidth / contentRatio;
            var targetMargin = Math.max(0, outerElement.clientHeight - targetHeight) / 2;

            setDimensions(innerElement, targetMargin, 0, targetHeight, outerElement.clientWidth);
        }
    }
    
    Canvas.prototype.getCanvasContainer = function(canvasId) {
    
        /* getCanvasContainer()_____________________________________________________
        Returns container object by canvas id                                      */
    
        return document.getElementById('canvas-' + canvasId);
    
    }
    
    Canvas.prototype.getCanvasContent = function(canvasId) {
    
        /* getCanvasContent()_______________________________________________________
        Returns canvas content object by canvas id                                 */
    
        return document.getElementById('canvas-content-' + canvasId);
    }
}


