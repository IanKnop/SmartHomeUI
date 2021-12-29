/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Weather Module Scripts
   
    (C) 2020-21 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

var weatherRefreshFrequency = 300;   /* How often the content is reloaded: FREQUENCY (i.e. 100) x UPDATE-FREQUENCY (i.e. 2 seconds) = 200 seconds */
var weatherIteration = 0;

function weatherRefreshState(control) {

    /* weatherRefreshState()___________________________________________________
    Refreshes weather widget                                                  */

    weatherIteration = moduleSimpleRefreshState('Weather', control, weatherIteration, weatherRefreshFrequency);

}


