/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Alexa Control
   
    (C) 2020-21 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

/* =========================================================
   HOME AUTOMATION - ALEXA
   ========================================================= */
var alexaInterface = 'alexa2.0.Echo-Devices';
var alexaDevices = { EG: 'G090LA09751703CL', OG1: 'G0911M1001350KQD', OG2: 'G090XG07933223L5' };

function getAlexa(destination) {

    /* getAlexa - Returns complete Alexa device name */ 
    return alexaInterface + '.' + alexaDevices[destination.toUpperCase()];
}

function musicChangeVolume(destination, value) {

    /* musicChangeVolume()_________________________________________________
    Changes volumne of music on Alexa device                              */
    
    //playSound('KEY3');
    sendRequest('iobroker', 'get', { deviceId: getAlexa(destination) + '.Player.volume' }, null, function (returnValue) {

        var currentValue = parseInt(returnValue.val) || 0;
        sendRequest('iobroker', 'set', { deviceId: getAlexa(destination) + '.Player.volume', value: Math.max(0, Math.min((currentValue + value), 100)) });
    });

}

function musicMute(destination) {

    /* musicMute()_________________________________________________________
    Mutes music on Alexa device                                           */

    sendRequest('iobroker', 'trigger', { deviceId: getAlexa(destination) + '.Player.muted' });
}

function musicPlayPause(destination) {

    /* musicPlayPause()____________________________________________________
    Toggles play/pause music on Alexa device                              */

    sendRequest('iobroker', 'get', { deviceId: getAlexa(destination) + '.Player.currentState' }, null, function (returnValue) {

        if (returnValue.val) sendRequest('iobroker', 'set', { deviceId: getAlexa(destination) + '.Player.controlPause', value: 1 }); 
        else sendRequest('iobroker', 'set', { deviceId: getAlexa(destination) + '.Player.controlPlay', value: 1 }); 
        
    });
}

function musicPreviousTrack(destination) {

    /* musicPreviousTrack()________________________________________________
    Switch to previous track on Alexa device                              */

    sendRequest('iobroker', 'set', { deviceId: getAlexa(destination) + '.Player.controlPrevious', value: 1 });
}

function musicNextTrack(destination) {

    /* musicNextTrack()____________________________________________________
    Switch to next track on Alexa device                                  */

    sendRequest('iobroker', 'set', { deviceId: getAlexa(destination) + '.Player.controlNext', value: 1 });
}

function musicStop(destination) {

    /* musicStop()____________________________________________________
    Stops music on Alexa device                                      */

    sendRequest('iobroker', 'set', { deviceId: getAlexa(destination) + '.Commands.deviceStop', value: 1 });
}