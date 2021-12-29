/*  =========================================================
    KNOP.FAMILY
    Smart Home Control Center - Canvas Progress Bar Scripts
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

function progressBarRefreshState(control, updateTimestamp = null) {

    /* progressBarRefreshState()________________________________________________
    Refreshes progress bar                                                     */

    var value = globalDataset[control.binding];
    
    
    //getBindingValue(control.binding.toLowerCase(), requestAnswer);

    if (value != undefined && value != null) {

        var currentControl = document.getElementById(control.id);
        
        var bar = currentControl.querySelectorAll('div.progress-bar')[0];
        var valueLabel = currentControl.querySelectorAll('div.progress-value')[0];

        bar.style.width = (value + '%');    
    }
}