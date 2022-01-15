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
   internalAdapter.prototype.sendRequest = function (requestMode, payload, senderControl = null, controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()________________________________________________________
    Sends request to ioBroker API                                          */

    var requestData = (payload.request != undefined ? payload.request : payload);
    var responseData = (payload.response != undefined ? payload.response : null);

    if (responseData != null) payload = payload.request; 
    var targetId = (payload.target != undefined && payload.target.id != undefined ? payload.target.id : '');
    var isControl = (payload.target != undefined && (payload.target.type == undefined || payload.target.type.toLowerCase() == 'control'));
    var targetControl = (isControl ? document.getElementById(targetId) : senderControl);
    
    switch (requestMode.toLowerCase()) {

        // VALUE: Modify value of control or variable
        case 'value':

            if (typeof payload.target === 'string') payload.target = [ payload.target ];
            
            for (var index = 0; index < payload.target.length; index++) {

                var targetId      = payload.target[index];
                var targetControl = document.getElementById(targetId) != undefined ? document.getElementById(targetId) : senderControl;
                var currentValue  = this.dataset[targetId] != undefined ? this.dataset[targetId] : targetControl.getAttribute('cc-value');

                var mode = (payload.mode != undefined ? payload.mode : 'set');
                var setValue = replaceFieldValue(Array.isArray(payload.value) ? payload.value[index] : payload.value, responseData, senderControl, this.Dataset);
                
                //var format = (payload.valueFormat != undefined ? payload.valueFormat : 'numeric');

                switch (mode) {

                    case 'set':

                        var newValue = setValue;
                        break;
                
                    case 'add':
                    case 'plus':
                    case 'substract': 
                    case 'minus':

                        switch (format) {

                            case 'time':
                            
                                if (currentValue != null) {
                               
                                    var dateValue = new Date(); var short = (currentValue.length == 5);
                                    var newValue = (new Date(
                                            dateValue.setHours(
                                                currentValue.substring(0, 2), 
                                                currentValue.substring(3, 5), 
                                                (short ? 
                                                    setValue : currentValue.substring(6, 8) + setValue
                                                )
                                            )
                                        )
                                    ).toTimeString().substring(0, (short ? 5 : 8));
                                }                         
                                break;

                            default:

                                var additor = setValue * (mode == 'substract' || mode == 'minus' ? -1 : 1);
                                var newValue = parseFloat(targetControl.getAttribute('cc-value')) + parseFloat(additor); 
                                break;
                        }
                        break;

                    case 'multi':
                    case 'multiply':

                        var newValue = parseFloat(targetControl.getAttribute('cc-value')) * parseFloat(setValue); 
                        break;

                    case 'div':
                    case 'divide':
        
                        var newValue = parseFloat(targetControl.getAttribute('cc-value')) / parseFloat(setValue).toPrecision(5); 
                        break;

                    default:
                        var newValue = parseFloat(targetControl.getAttribute('cc-value'));

                }
                
                if (this.checkMinMax(targetControl, newValue)) {
                    
                    targetControl.setAttribute('cc-value', newValue);
                    this.dataset[targetId] = newValue;
                
                } 
                
                updateDataset(this.dataset);
                refreshControl(targetControl, this);

            }
            break;
        
        // SWITCH: Used to select or deselect state and save information to given variable
        case 'switch':
        
            var toggleState = ButtonGroups.toggleButton(senderControl, this.dataset);
            
            if (payload.target != undefined && targetId != '' && payload.value != undefined) {

                if (payload.target.type == undefined) payload.target.type = 'object';
                switch(payload.target.type) {

                    case 'object':
                        this.dataset[targetId] = payload.value;
                        break;

                    case 'array':

                        // CREATE IF NON EXISTENT
                        if (this.dataset[targetId] == undefined) this.dataset[targetId] = [];

                        // ADD OR REMOVE FROM ARRAY
                        if (toggleState && !this.dataset[targetId].includes(payload.value)) this.dataset[targetId].push(payload.value);
                        else if (!toggleState && this.dataset[targetId].includes(payload.value)) this.dataset[targetId].splice(this.dataset[targetId].indexOf(payload.value), 1);

                        break;
                }
            }
            break;
        
        // LIST: Used for scrolling through a LIST of values with up/down-buttons and select one 
        case 'list':

                if (payload.list != undefined) {
    
                    //var targetControl = (isControl ? document.getElementById(targetId) : senderControl);
                    var value = targetControl.getAttribute('cc-value');

                    if (value == null) {
                        
                        var newValue = (payload.listProperties != undefined ? payload.listProperties[0] : payload.list[0]);

                        targetControl.setAttribute('cc-value', payload.list[0]);
                        if (payload.listKeys != undefined) targetControl.setAttribute('cc-value-key', payload.listKeys[0]);

                        this.dataset[targetId] = payload.list[0];
                        if (payload.listKeys != undefined) this.dataset[targetId + '.key'] = payload.list[0];
                    
                    } else {
                     
                        var direction = (payload.direction != undefined ? (payload.direction.toLowerCase() == 'up' ? 1 : -1) : 1);
                        var nextIndex = ((payload.list.indexOf(value) + direction > (payload.list.length - 1) || payload.list.indexOf(value) + direction < 0) ? (direction == 1 ? 0 : (payload.list.length - 1)) : payload.list.indexOf(value) + direction);

                        targetControl.setAttribute('cc-value', payload.list[nextIndex]);
                        if (payload.listKeys != undefined) targetControl.setAttribute('cc-value-key', payload.listKeys[nextIndex]);
                        
                        this.dataset[targetId] = payload.list[nextIndex];
                        if (payload.listKeys != undefined) this.dataset[targetId + '.key'] = payload.listKeys[nextIndex];
                    }

                    //refreshControl(targetControl);

                }
                break;

        // MSG: Simple message output mainly for debugging
        case 'msg':

            alert(payload.message);
            break;
    }

    updateDataset(this.dataset);
    refreshControl(targetControl, this);
}

internalAdapter.prototype.checkMinMax = function (control, value) {

    /* checkMinMax()________________________________________________________
    Checks if value is inside min/max definition                           */

    return !(control.hasAttribute('cc-min') && control.getAttribute('cc-min') > value || control.hasAttribute('cc-max') && control.getAttribute('cc-max') < value)
}

internalAdapter.prototype.sendRequest2 = function (requestMode, payload, senderControl = null, controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()________________________________________________________
    Sends request to ioBroker API                                          */

    // RESOLVE {{[TARGET_ID]}} IF AVAILABLE
    var responseData = (payload.response != undefined ? payload.response : null);
    if (responseData != null) payload = payload.request; 

    var targetId = (payload.target != undefined && payload.target.id != undefined ? payload.target.id : '');
    
    var isControl = (payload.target != undefined && (payload.target.type == undefined || payload.target.type.toLowerCase() == 'control'));
    var targetControl = (isControl ? document.getElementById(targetId) : senderControl);
    
    switch (requestMode.toLowerCase()) {

        // VALUE: Modify value of control or variable
        case 'value':

            if (payload.target != undefined && targetId != '' && payload.value != undefined) {

                //var targetControl = document.getElementById(targetId);

                var mode = (payload.mode != undefined ? payload.mode : 'add');
                var format = (payload.valueFormat != undefined ? payload.valueFormat : 'numeric');
            
                switch (mode) {

                    case 'set':

                        alert (JSON.stringify(responseData));
                        break;
                
                    case 'add':
                    case 'plus':
                    case 'substract': 
                    case 'minus':

                        switch (format) {

                            case 'time':
                            
                                var dateValue = new Date();
                                var currentValue = targetControl.getAttribute('cc-value');
                                var short = (currentValue.length == 5);

                                if (currentValue != null) {
                               
                                    var calcValue = dateValue.setHours(currentValue.substring(0, 2), currentValue.substring(3, 5), (short ? payload.value : currentValue.substring(6, 8) + payload.value));
                                    var newValue = (new Date(calcValue)).toTimeString().substring(0, (short ? 5 : 8));
                                }                         
                                break;

                            default:

                                var additor = payload.value * (mode == 'substract' || mode == 'minus' ? -1 : 1);
                                var newValue = parseFloat(targetControl.getAttribute('cc-value')) + parseFloat(additor); 
                                break;
                        }
                        break;

                    case 'multi':
                    case 'multiply':

                        var newValue = parseFloat(targetControl.getAttribute('cc-value')) * parseFloat(payload.value); 
                        break;

                    case 'div':
                    case 'divide':
        
                        var newValue = parseFloat(targetControl.getAttribute('cc-value')) / parseFloat(payload.value).toPrecision(5); 
                        break;

                    default:
                        var newValue = parseFloat(targetControl.getAttribute('cc-value'));

                }

                if (!(targetControl.hasAttribute('cc-min') && targetControl.getAttribute('cc-min') > newValue ||
                      targetControl.hasAttribute('cc-max') && targetControl.getAttribute('cc-max') < newValue)) {

                    targetControl.setAttribute('cc-value', newValue);
                    this.dataset[targetId] = newValue;
                } 
            }
            break;
        
        // SWITCH: Used to select or deselect state and save information to given variable
        case 'switch':
        
            var toggleState = ButtonGroups.toggleButton(senderControl, this.dataset);
            
            if (payload.target != undefined && targetId != '' && payload.value != undefined) {

                if (payload.target.type == undefined) payload.target.type = 'object';
                switch(payload.target.type) {

                    case 'object':
                        this.dataset[targetId] = payload.value;
                        break;

                    case 'array':

                        // CREATE IF NON EXISTENT
                        if (this.dataset[targetId] == undefined) this.dataset[targetId] = [];

                        // ADD OR REMOVE FROM ARRAY
                        if (toggleState && !this.dataset[targetId].includes(payload.value)) this.dataset[targetId].push(payload.value);
                        else if (!toggleState && this.dataset[targetId].includes(payload.value)) this.dataset[targetId].splice(this.dataset[targetId].indexOf(payload.value), 1);

                        break;
                }
            }
            break;
        
        // LIST: Used for scrolling through a LIST of values with up/down-buttons and select one 
        case 'list':

                if (payload.list != undefined) {
    
                    //var targetControl = (isControl ? document.getElementById(targetId) : senderControl);
                    var value = targetControl.getAttribute('cc-value');

                    if (value == null) {
                        
                        var newValue = (payload.listProperties != undefined ? payload.listProperties[0] : payload.list[0]);

                        targetControl.setAttribute('cc-value', payload.list[0]);
                        if (payload.listKeys != undefined) targetControl.setAttribute('cc-value-key', payload.listKeys[0]);

                        this.dataset[targetId] = payload.list[0];
                        if (payload.listKeys != undefined) this.dataset[targetId + '.key'] = payload.list[0];
                    
                    } else {
                     
                        var direction = (payload.direction != undefined ? (payload.direction.toLowerCase() == 'up' ? 1 : -1) : 1);
                        var nextIndex = ((payload.list.indexOf(value) + direction > (payload.list.length - 1) || payload.list.indexOf(value) + direction < 0) ? (direction == 1 ? 0 : (payload.list.length - 1)) : payload.list.indexOf(value) + direction);

                        targetControl.setAttribute('cc-value', payload.list[nextIndex]);
                        if (payload.listKeys != undefined) targetControl.setAttribute('cc-value-key', payload.listKeys[nextIndex]);
                        
                        this.dataset[targetId] = payload.list[nextIndex];
                        if (payload.listKeys != undefined) this.dataset[targetId + '.key'] = payload.listKeys[nextIndex];
                    }

                    //refreshControl(targetControl);

                }
                break;

        // MSG: Simple message output mainly for debugging
        case 'msg':

            alert(payload.message);
            break;
    }

    updateDataset(this.dataset);
    refreshControl(targetControl, this);
}

internalAdapter.prototype.handleResponse = function (responseMode, response, payload, refreshControl) {

    /* handleResponse()_____________________________________________________
    Handles adapter based call-responses                                   */
     
    switch (responseMode.toLowerCase()) {
        
        case 'msg':

            if (payload.message != null) alert(payload.message);
            break;
        }
}


internalAdapter.prototype.refreshState = function (control, updateTimestamp) {

    /* refreshState()______________________________________________________
    Provider bound refresh for internal adapter                           */

    var currentControl = document.getElementById(control.id);
    var controlProvider = (currentControl.hasAttribute('cc-control-provider') ? currentControl.getAttribute('cc-control-provider') : DEFAULT_CONTROL);
    var typeAttr = (currentControl.hasAttribute('cc-type') ? currentControl.getAttribute('cc-type') : '');
    
    if (currentControl.hasAttribute('cc-binding') && currentControl.getAttribute('cc-binding').trim().startsWith('{[') && currentControl.getAttribute('cc-binding').trim(']}').endsWith()) {
        
        // RETURN INTERNAL EXPRESSION (i.e. current time)
        var parsedExpression = this.parseExpressions(getFieldName(currentControl.getAttribute('cc-binding')));

        currentControl.innerHTML = parsedExpression;
        currentControl.setAttribute('cc-value', parsedExpression);

    } 
    
    if (currentControl.hasAttribute('cc-binding') && currentControl.getAttribute('cc-binding').trim() != '#' ) {
        
        if (this.dataset[control.id] == undefined) this.dataset[control.id] = currentControl.getAttribute('cc-value');
        if (currentControl.hasAttribute('cc-value-key') && this.dataset[control.id + '.key'] == undefined) this.dataset[control.id + '.key'] = currentControl.getAttribute('cc-value-key');

        updateDataset(this.dataset);
    }
    
    // VALUE BASED ACTIVATION STATE (i.e. indicators for selected buttons) 
    if (['button', 'switch', 'select'].includes(typeAttr) && currentControl.hasAttribute('cc-value')) ControlProviders[controlProvider].updateActiveState(control, toBool(currentControl.getAttribute('cc-value')));
    
}

internalAdapter.prototype.checkActiveState = function (checkValue, type) {

    /* checkActiveState()___________________________________________________
    Check adapter sensitive active state of device                         */

    return toBool(checkValue);

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
