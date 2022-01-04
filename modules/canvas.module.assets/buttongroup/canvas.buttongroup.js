/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas Module Functions
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

/* =========================================================
    BUTTON GROUP FUNCTIONS
   ========================================================= */

var ButtonGroups = new function () {

    this.changeValue = function(refreshTarget, value, decimals = 0) {

        /* changeValue()_________________________________________________________
        Modifies numeric value in buttongroup control by given amount           */
        
        var changedValue = parseFloat(refreshTarget.getAttribute('cc-value')) + parseFloat(value); 

        if (refreshTarget.hasAttribute('cc-min') && refreshTarget.getAttribute('cc-min') > changedValue ||
        refreshTarget.hasAttribute('cc-max') && refreshTarget.getAttribute('cc-max') < changedValue) {

            // OUTSIDE OF MIN/MAX-VALUE

        } else {
            
            this.setValueLabel(refreshTarget, changedValue);

        }
    } 
    
    this.changeTimeValue = function(refreshTarget, seconds, short = true) {

        /* changeTimeValue()_____________________________________________________
        Modifies time-value in buttongroup control by given amount of seconds   */
        
        var dateValue = new Date();
        var changedValue = dateValue.setHours(refreshTarget.innerText.substr(0, 2), refreshTarget.innerText.substr(3, 2), (short ? seconds : refreshTarget.innerText.substr(6, 2) + seconds));
        
        this.setValueLabel(refreshTarget, (new Date(changedValue)).toTimeString().substring(0, (short ? 5 : 8)));
    }  

    this.setValueLabel = function(refreshTarget, value) {

        /* setValueLabel()_______________________________________________________
        Sets value label                                                        */

        var currentType = (refreshTarget.hasAttribute('cc-type') ? refreshTarget.getAttribute('cc-type').toLowerCase() : 'text');
        var prefix = refreshTarget.hasAttribute('cc-prefix') ? refreshTarget.getAttribute('cc-prefix') : '';
        var suffix = refreshTarget.hasAttribute('cc-suffix') ? refreshTarget.getAttribute('cc-suffix') : '';
        var decimals = refreshTarget.getAttribute('cc-decimals');

        switch (currentType) {

            case 'numeric':
                var fixedValue = (value.toFixed(decimals));
                refreshTarget.innerHTML = (prefix != null ? prefix : '') + replaceComma(fixedValue) + (suffix != null ? suffix : '');
                break;

                default:
                refreshTarget.innerHTML = (prefix != null ? prefix : '') + value + (suffix != null ? suffix : '');
                
                break;
        }

        if (refreshTarget.hasAttribute('cc-value')) refreshTarget.setAttribute('cc-value', value);
    }

}