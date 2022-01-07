/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Internal Adapter 
   
    (C) 2022 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

// ADAPTER REGISTRATION AFTER LOAD
this.addEventListener("load", function () {

    Adapters.internal = new internalAdapter();

});

function internalAdapter() {

    // COMMON ADAPTER PROPERTIES 
    this.adapterName = 'internal'
    this.dataset = null;
    
}

/* =========================================================
   STANDARD ADAPTER METHODS
   ========================================================= */
internalAdapter.prototype.sendRequest = function (requestMode, payload, refreshControl = null, controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()________________________________________________________
    Sends request to ioBroker API                                          */

    switch (requestMode.toLowerCase()) {

        case 'select':
            
            
        

            break;
    }
}

internalAdapter.prototype.refreshState = function (control, updateTimestamp) {

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

internalAdapter.prototype.retrieveBindings = function() {

    /* retrieveBindings()___________________________________________________
    Retrieve all data for this adapter                                     */

    if (this.bindings == null) {

        this.bindings = getProviderBindings(AdapterBindings, this.adapterName);
        this.datapoints = this.bindings.join(',');
    }

}

internalAdapter.prototype.updateDataset = function(updateTimestamp) {

    /* updateDataset()______________________________________________________
    Retrieve all data for this adapter                                     */

    this.retrievingData = true;
    this.getDatapoints(this.datapoints, function (requestAnswer, thisAdapter) {

        thisAdapter.dataset = requestAnswer;
        thisAdapter.lastUpdate = updateTimestamp;

        updateDataset(thisAdapter.getAdapterDataSet(thisAdapter.dataset));
        
        AdapterControls.forEach(control => {

            if (control.provider == thisAdapter.adapterName) 
                refreshControl(document.getElementById(control.id), thisAdapter); 

        });

        thisAdapter.retrievingData = false;

    }, this);

}

internalAdapter.prototype.checkActiveState = function (checkValue, type) {

    /* checkActiveState()___________________________________________________
    Check adapter sensitive active state of device                         */

    return (checkValue == undefined ? false : toBool(checkValue));

}

