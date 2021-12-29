/*  =========================================================
    KNOP.FAMILY
    Smart Home Control Center - Media Container Scripts
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

// CONTROL REGISTRATION AFTER LOAD
this.addEventListener("load", function () {

    ControlProviders.mediacontainer = new mediacontainer();

});

// ADAPTER BASE FUNCTION
function mediacontainer() {}

var activeCameras = [];

function mediaRefreshState(control, updateTimestamp = null) {

    /* mediaRefreshState()______________________________________________________
    Refreshes media container                                                  */

    //var value = getBindingValue(control.binding.toLowerCase());
    var value = globalDataset[control.binding];

    if (value != undefined && value != null) {

        var currentControl = document.getElementById(control.id);
        
        switch (currentControl.tagName.toLowerCase()) {

            case 'img':
                currentControl.src = value;

            case 'video':
                break;
        }
    }
}

/* =========================================================
    API - LISTENER
   ========================================================= */

function playStream(streamUrl, targetObject) {
    
    /* playStream()____________________________________________________________
    Starts HLS stream and plays in HTML5 video element                        */

    var hlsPlayer = new Hls();
    var videoControl = document.getElementById(targetObject);

    if (videoControl.canPlayType('application/vnd.apple.mpegurl')) {
        
        videoControl.src = streamUrl;
    } else {

        hlsPlayer.loadSource(streamUrl);
        hlsPlayer.attachMedia(videoControl);
    }

    videoControl.style.visibility = 'visible';
    videoControl.play();
}

function stopStream(targetObject) {
    
    /* stopStream()____________________________________________________________
    Stops stream playback                                                    */

    var videoControl = document.getElementById(targetObject);
    videoControl.pause();
    videoControl.style.visibility = 'collapse';
    
}




