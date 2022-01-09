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
    this.dataset = {};
    
}

/* =========================================================
   STANDARD ADAPTER METHODS
   ========================================================= */
internalAdapter.prototype.sendRequest = function (requestMode, payload, refreshControl = null, controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()________________________________________________________
    Sends request to ioBroker API                                          */

    switch (requestMode.toLowerCase()) {

        case 'select':
            
            if (!refreshControl.hasAttribute('cc-value') || refreshControl.getAttribute('cc-value') == 'false') refreshControl.setAttribute('cc-value', true);
            else refreshControl.setAttribute('cc-value', false);
            
            this.refreshState(refreshControl);

            if (payload.target != undefined && payload.target.id != undefined && payload.value != undefined) {

                if (payload.target.type == undefined) payload.target.type = 'object';

                switch(payload.target.type) {

                    case 'object':
                        this.dataset[payload.taget.id] = payload.value;
                        break;

                    case 'array':

                        if (this.dataset[payload.target.id] == undefined) this.dataset[payload.target.id] = [];
                        if (!this.dataset[payload.target.id].includes(payload.target.value)) this.dataset[payload.target.id].push(payload.value);
                        break;
                }
            }
            break;
        
        case 'msg':

            if (payload.vardump != undefined) {

                // Dumps given variable to a simple message box (for debugging)
                alert((payload.message != undefined ? payload.message : 'Var dump for "' + payload.vardump + '"\n') + JSON.stringify(this.dataset[payload.vardump]));

            }

            break;
            
    }
}

internalAdapter.prototype.refreshState = function (control, updateTimestamp) {

    /* refreshState()______________________________________________________
    Provider bound refresh for ioBroker API                               */

    var currentControl = document.getElementById(control.id);
    
    var controlProvider = (currentControl.hasAttribute('cc-control-provider') ? currentControl.getAttribute('cc-control-provider') : DEFAULT_CONTROL);
    var typeAttr = (currentControl.hasAttribute('cc-type') ? currentControl.getAttribute('cc-type') : '');
    
    if (currentControl.hasAttribute('cc-binding') && currentControl.getAttribute('cc-binding').trim() != '' && currentControl.getAttribute('cc-binding') != '#') {
        
        // RETURN INTERNAL EXPRESSION (i.e. current time)
        var parsedExpression = Adapters.internal.parseExpressions(currentControl.getAttribute('cc-binding'));

        currentControl.innerHTML = parsedExpression;
        currentControl.setAttribute('cc-value', parsedExpression);

    } 
        
    // VALUE BASED ACTIVATION STATE (i.e. indicators for selected buttons) 
    if (['button', 'switch', 'select'].includes(typeAttr) && currentControl.hasAttribute('cc-value')) ControlProviders[controlProvider].updateActiveState(control, toBool(currentControl.getAttribute('cc-value')));
    
    //refreshControl(currentControl, this);
    
}

internalAdapter.prototype.parseExpressions = function(subject) {

    /* parseExpressions()___________________________________________________
    Parses text with standard expressions (i.e. date, time)                */   

    switch (subject.toUpperCase()) {

        case 'CURRENT_DATE_LONG':
            var thisMoment = new Date();
            return thisMoment.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        case 'CURRENT_TIME':
            var thisMoment = new Date();
            return thisMoment.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }

    return subject;
}

/*internalAdapter.prototype.retrieveBindings = function() {

     retrieveBindings()___________________________________________________
    Retrieve all data for this adapter                                     

    if (this.bindings == null) {

        this.bindings = getProviderBindings(AdapterBindings, this.adapterName);
        this.datapoints = this.bindings.join(',');
    }

}*/

internalAdapter.prototype.updateDataset = function(updateTimestamp) {

    /* updateDataset()______________________________________________________
    Retrieve all data for this adapter                                     */



    
}

internalAdapter.prototype.checkActiveState = function (checkValue, type) {

    /* checkActiveState()___________________________________________________
    Check adapter sensitive active state of device                         */

    return (checkValue == undefined ? false : toBool(checkValue));

}

