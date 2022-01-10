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
    
    this.toggleButton = function(senderControl, returnDataset = null) {

        /* toggleButton()________________________________________________________
        Toggles button value true/false                                         */

        var returnValue = (!senderControl.hasAttribute('cc-value') || senderControl.getAttribute('cc-value') == 'false');
        senderControl.setAttribute('cc-value', returnValue)

        if (returnDataset != null) returnDataset[senderControl.getAttribute('cc-binding')] = returnValue;
        return returnValue;
    }

}