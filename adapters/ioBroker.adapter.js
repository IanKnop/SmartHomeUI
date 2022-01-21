/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - ioBroker API Adapter 
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

// ADAPTER REGISTRATION AFTER LOAD
this.addEventListener("load", function () {

    Adapters.iobroker = new iobroker('http://192.168.178.70', '8087');

});

function iobroker(uri, port, basefolder = '') {

    // COMMON ADAPTER PROPERTIES 
    this.adapterName = 'iobroker'
    this.bindings = null;
    this.datapoints = null;
    this.dataset = null;
 
    // ADDITIONAL HELPER VALUES
    this.lastUpdate = null;
    this.retrievingData = false;

    // ADAPTER CONNECTION
    this.uri = uri;
    this.port = port;
    this.basefolder = basefolder;
    this.adapterLocation = this.uri + ':' + this.port + this.basefolder;

}

/* =========================================================
   STANDARD ADAPTER METHODS
   ========================================================= */
iobroker.prototype.sendRequest = function (requestMode, payload, refreshControl = null, controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()________________________________________________________
    Sends request to ioBroker API                                          */

    switch (requestMode.toLowerCase()) {

        case 'get':
            
            this.getDatapoint(payload.deviceId, nextFunction, this);
            break;

        case 'set':

            this.setDatapoint(payload.deviceId, payload.value, function(requestAnswer, thisAdapter) {

                //if (refreshControl != null) ControlProviders[controlProvider].updateActiveState(refreshControl, this.checkActiveState(requestAnswer));
                triggerAdapterUpdate();
                if (nextFunction != null) nextFunction(requestAnswer, thisAdapter);

            }, this);
            break;

        case 'scene':

            this.setDatapoint(payload.sceneId, '1', nextFunction);
            break;

        case 'trigger':
        case 'toggle':

            this.getDatapoint(payload.deviceId, function (returnValue, thisAdapter) {

                if (returnValue.val != undefined) {

                    var toggledValue = toggleValue(returnValue.val);
                    thisAdapter.setDatapoint(payload.deviceId, toggledValue, function(requestAnswer, thisAdapter) {

                        triggerAdapterUpdate();
                        if (nextFunction != null) nextFunction(requestAnswer, thisAdapter);
        
                    }, thisAdapter);
                }

            }, this);
            break;

    }
}

iobroker.prototype.refreshState = function (control, updateTimestamp) {

    /* refreshState()______________________________________________________
    Provider bound refresh for ioBroker API                               */

    var currentControl = document.getElementById(control.id);

    // INITIALIZE BINDINGS AND DATAPOINTS LIST
    this.retrieveBindings();

    // GET BULK DATA ONLY ONCE PER REFRESH
    if (!this.retrievingData && (this.lastUpdate == null || this.lastUpdate != updateTimestamp)) {

        // UPDATE DATA AND REFRESH CONTROLS
        this.updateDataset(updateTimestamp);

    } else if (this.dataset != null && !this.retrievingData) {

        // REFRESH CONTROLS WITHOUT DATA UPDATE
        refreshControl(currentControl, this);
    }
}

iobroker.prototype.retrieveBindings = function() {

    /* retrieveBindings()___________________________________________________
    Retrieve all data for this adapter                                     */

    if (this.bindings == null) {

        this.bindings = getProviderBindings(AdapterBindings, this.adapterName);
        this.datapoints = this.bindings.join(',');
    }

}

iobroker.prototype.updateDataset = function(updateTimestamp) {

    /* updateDataset()______________________________________________________
    Retrieve all data for this adapter                                     */

    this.retrievingData = true;
    this.getDatapoints(this.datapoints, function (requestAnswer, thisAdapter) {

        thisAdapter.dataset = requestAnswer;
        thisAdapter.lastUpdate = updateTimestamp;

        updateDataset(thisAdapter.toAdapterDataSet(thisAdapter.dataset));
        
        AdapterControls.forEach(control => {

            if (control.provider == thisAdapter.adapterName) 
                refreshControl(document.getElementById(control.id), thisAdapter); 

        });

        thisAdapter.retrievingData = false;

    }, this);

}

iobroker.prototype.checkActiveState = function (checkValue, type) {

    /* checkActiveState()___________________________________________________
    Check adapter sensitive active state of device                         */

    return (checkValue == undefined ? false : toBool(checkValue));

    /*var activeState = false;
    if (control.hasAttribute('cc-true')) {

        if (control.getAttribute('cc-true').startsWith('[')) var trueValues = JSON.parse(control.getAttribute('cc-true'));
        else var trueValues = [control.getAttribute('cc-true')];

        trueValues.forEach(trueValue => {

            if (trueValue == bindValue) activeState = true;
        });

    } else activeState = (bindValue == undefined ? false : toBool(bindValue));*/

}

/* =========================================================
   ioBroker API Interface Data Exchange 
   ========================================================= */
iobroker.prototype.getDatapoints = function (deviceIds, nextFunction, thisAdapter = null) {

    /* getDatapoints()_______________________________________________________
    Gets multiple ioBroker datapoint values of given ids                    */

    SmartHomeUI.InterfaceRequest.send(this.adapterLocation + '/getBulk/' + deviceIds + '/?', null, function (requestAnswer) {

        nextFunction(requestAnswer, thisAdapter);

    }, null, URL_ENCODED);
}

iobroker.prototype.getDatapoint = function (deviceId, nextFunction, thisAdapter = null) {

    /* getDatapoint()________________________________________________________
    Gets ioBroker datapoint value of given id                               */

    SmartHomeUI.InterfaceRequest.send(this.adapterLocation + '/get/' + deviceId, null, function (requestAnswer) {

        nextFunction(requestAnswer, thisAdapter);

    }, null, URL_ENCODED);
}

iobroker.prototype.setDatapoint = function (deviceId, value = 'true', nextFunction = null, thisAdapter = null) {

    /* setDatapoint()________________________________________________________
    Sets ioBroker datapoint to given value (i.e. 'true' or 1)               */

    if (nextFunction != null) {

        SmartHomeUI.InterfaceRequest.send(this.adapterLocation + '/set/' + deviceId + '?value=' + value, null, function (requestAnswer, thisAdapter) {

            triggerAdapterUpdate();
            nextFunction(requestAnswer, thisAdapter);

        }, this, URL_ENCODED);

    } else {

        SmartHomeUI.InterfaceRequest.send(this.adapterLocation + '/set/' + deviceId + '?value=' + value, URL_ENCODED);

    }
}

/* =========================================================
   TOOLS 
   ========================================================= */
iobroker.prototype.toAdapterDataSet = function (convertDataSet) {

    /* toAdapterDataSet()_________________________________________________
    Returns dataset with id and value property                            */

    var returnObject = {};
    convertDataSet.forEach(item => returnObject[item.id] = item.val);

    return returnObject;
}