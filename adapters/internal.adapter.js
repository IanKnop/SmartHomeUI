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
    Gets internal adapter request                                          */

    var requestData = (payload.request != undefined ? payload.request : payload);

    var responseData = (payload.response != undefined ? payload.response : null);
    if (responseData != null) payload = payload.request;

    var targetId = (payload.target != undefined && payload.target.id != undefined ? payload.target.id : '');
    var targetControl = (document.getElementById(targetId) != undefined ? document.getElementById(targetId) : senderControl);

    switch (requestMode.toLowerCase()) {

        // VALUE: Modify value of control or variable
        case 'value':

            this.modifyValues(payload, senderControl, responseData);
            break;

        // SWITCH: Used to select or deselect state and save information to given variable
        case 'switch':

            break;

        // LIST: Used for scrolling through a LIST of values with up/down-buttons and select one 
        case 'list':

            break;

        // MSG: Simple message output mainly for debugging
        case 'msg':

            alert(payload.message);
            break;
    }

    //updateDataset(this.dataset);
    //refreshControl(targetControl, this);
}

internalAdapter.prototype.modifyValues = function (payload, senderControl, responseData) {

    /* modifyValues()________________________________________________________
    Modifies one or multiple values based on internal adapter request       */

    // TRANSFORM SINGLE VALUE TO ARRAY
    if (typeof payload.target === 'string') payload.target = [payload.target];

    // ITERATE VALUE CHANGE REQUESTS
    for (var index = 0; index < payload.target.length; index++) {

        var target = this.getBindingInfo(payload.target[index], senderControl);
        var value = this.getCurrentValue(target);
        var setValue = this.parseSetValue(payload.value != undefined ? replaceFieldValue(Array.isArray(payload.value) ? payload.value[index] : payload.value, responseData, senderControl, this.Dataset) : null, target);

        switch (payload.mode != undefined ? payload.mode : 'set') {

            // VALUE SET
            case 'toggle':

                // TOGGLE VALUE "true/false"
                if (value == null) setValue = true;
                else setValue = !toBool(value);

            case 'set':

                // SET VALUE
                var newValue = setValue;
                break;

            // MATH
            case 'add': case 'plus': case 'substract': case 'minus':
                
                // MATH: ADDITION / SUBSTRACTION
                switch (format) {

                    case 'time':

                        if (value != null) {
                            var dateValue = new Date(); var short = (value.length == 5);
                            var newValue = (new Date(dateValue.setHours(value.substring(0, 2), value.substring(3, 5), (short ? setValue : value.substring(6, 8) + setValue)))).toTimeString().substring(0, (short ? 5 : 8));
                        }
                        break;

                    default:

                        var additor = setValue * (mode == 'substract' || mode == 'minus' ? -1 : 1);
                        var newValue = parseFloat(target.control.getAttribute('cc-value')) + parseFloat(additor);
                        break;
                }
                break;

            case 'multi': case 'multiply':

                // MATH: MULTIPLICATION
                var newValue = parseFloat(target.control.getAttribute('cc-value')) * parseFloat(setValue); break;

            case 'div': case 'divide':

                // MATH: DIVISION
                var newValue = parseFloat(target.control.getAttribute('cc-value')) / parseFloat(setValue).toPrecision(5); break;

            default:

                // TRY TO GET FORMER VALUE FROM CONTROL
                var newValue = parseFloat(target.control.getAttribute('cc-value'));

        }

        // SET NEW VALUE AND UPDATE CONTROLS
        this.setValue(target, newValue, senderControl);
    }
}

internalAdapter.prototype.setValue = function (target, value, senderControl = null) {

    /* setValue()_____________________________________________________________
    Refreshes dataset and control state with given value                     */

    if (target.control == null || this.checkMinMax(target.control, value)) {

        if (target.arrayIndex == -1) this.dataset[target.id] = value;
        else {

            if (this.dataset[target.id] == undefined) this.dataset[target.id] = [];
            
            if (target.arrayMode == 'range') for (index = target.arrayStart; index <= target.arrayEnd; index++) this.dataset[target.id][index] = value;
            else this.dataset[target.id][target.arrayIndex] = value;
        }

    } 

    updateDataset(this.dataset);

    if (target.control != undefined) this.refreshState(target.control, Date.now());
    else if (target.arrayIndex != -1) AdapterControls.filter(control => { return control.binding.startsWith(target.id + '[') }).forEach(arrayControl => { this.refreshState(arrayControl, Date.now()) });
}


internalAdapter.prototype.refreshState = function (control, updateTimestamp = null) {

    /* refreshState()______________________________________________________
    Provider bound refresh for internal adapter                           */

    var adapterControl = this.getAdapterControl(control.id)[0];
    var control = document.getElementById(control.id);

    if (adapterControl.binding != undefined && adapterControl.binding.trim() != '#') {

        if (adapterControl.binding.startsWith('{[') && adapterControl.binding.endsWith(']}')) {

            // RETURN INTERNAL EXPRESSION (i.e. current time)
            var value = this.parseExpression(getFieldName(control.getAttribute('cc-binding')));
            control.innerHTML = value;
            
        } else {

            var binding = this.getBindingInfo(adapterControl.binding); 
            this.initDataset(binding, control);
            
            var value = (binding.arrayIndex == -1 ? this.dataset[binding.id] : this.dataset[binding.id][binding.arrayIndex]);

            // ADD ADDITIONAL KEY IF 'cc-value-key' IS SET
            if (control.hasAttribute('cc-value-key') && this.dataset[adapterControl.id + '.key'] == undefined) 
                this.dataset[adapterControl.id + '.key'] = control.getAttribute('cc-value-key');
        }

        control.setAttribute('cc-value', value);
        refreshControl(control, this);
    }
}

/* =========================================================
   TOOLS
   ========================================================= */
internalAdapter.prototype.initDataset = function(binding, control) {

    /* initDataset()_______________________________________________________
    Initializes dataset for given binding                                 */

    if (this.dataset[binding.id] == undefined && binding.arrayIndex == -1) {
                
        this.dataset[binding.id] = control.getAttribute('cc-value') != null ? control.getAttribute('cc-value') : '';

    }
    else if (this.dataset[binding.id] == undefined && binding.arrayIndex > -1) {

        this.dataset[binding.id] = [];
        if (control.getAttribute('cc-value') != null) this.dataset[binding.id][binding.arrayIndex] = control.getAttribute('cc-value');
    }
}

internalAdapter.prototype.getBindingInfo = function (tagetDef, senderControl = null) {

    /* getBindingInfo()_____________________________________________________
    Gets target information values as object                               */

    var returnObject = {};

    if (tagetDef.includes('[')) {

        // BINDING IS TARGETING AN ARRAY
        returnObject.id = tagetDef.substring(0, tagetDef.indexOf('['));
        returnObject.arrayIndex = tagetDef.substring(tagetDef.indexOf('[') + 1, tagetDef.indexOf(']'));
        
        if (!isNaN(returnObject.arrayIndex)) {
            
            // STANDARD ARRAY
            returnObject.arrayMode = 'array';

        } else if (returnObject.arrayIndex.startsWith('?') || returnObject.arrayIndex.startsWith('!')) {
            
            // BOOL OR REVERSE-BOOL ARRAY METHOD
            returnObject.arrayMode = returnObject.arrayIndex.startsWith('?') ? 'bool' : 'reverse-bool';
            returnObject.arrayIndex = returnObject.arrayIndex.substring(1);
       
        } else if (returnObject.arrayIndex.includes('-')) {
            
            // ARRAY RANGE METHOD
            returnObject.arrayMode = 'range';
            returnObject.arrayStart = returnObject.arrayIndex.substring(0, returnObject.arrayIndex.indexOf('-'));
            returnObject.arrayEnd = returnObject.arrayIndex.substring(returnObject.arrayIndex.indexOf('-') + 1);
        }

        returnObject.control = null;

    } else {

        // SINGLE FIELD BINDING
        returnObject.id = tagetDef;
        returnObject.arrayIndex = -1;
        returnObject.arrayMode = 'none';
        returnObject.control = document.getElementById(returnObject.id) != undefined ? document.getElementById(returnObject.id) : senderControl;
    }

    return returnObject;
}

internalAdapter.prototype.getCurrentValue = function (target) {

    /* getCurrentValue()____________________________________________________
    Gets current value based on dataset or control                         */

    if (target.arrayIndex == -1) return this.dataset[target.id] != undefined ? this.dataset[target.id] : (target.control != undefined ? target.control.getAttribute('cc-value') : '');
    else if (target.arrayMode == 'range' && this.dataset[target.id] != undefined) return this.dataset[target.id][target.arrayStart];
    else if (!isNaN(target.arrayIndex)) return this.dataset[target.id] != undefined && this.dataset[target.id][target.arrayIndex] != undefined ? this.dataset[target.id][target.arrayIndex] : '';
    else return '';
}

internalAdapter.prototype.parseSetValue = function (setValue, target) {

    /* parseSetValue()______________________________________________________
    Parses set value which can be single or array value                    */

    var returnValue = setValue;
    if (isNaN(target.arrayIndex) && target.arrayMode != 'range' && setValue.includes(target.arrayIndex)) {

        var returnValue = [];

        if (target.arrayMode == 'bool') setValue.split(target.arrayIndex).forEach(index => { returnValue[index] = true; });
        else if (target.arrayMode == 'reverse-bool') setValue.split(target.arrayIndex).forEach(index => { returnValue[index] = false; });
        else returnValue = setValue.split(target.arrayIndex);

        return returnValue;

    }
    return returnValue;
}

internalAdapter.prototype.checkMinMax = function (control, value) {

    /* checkMinMax()________________________________________________________
    Checks if value is inside min/max definition                           */

    return !(control.hasAttribute('cc-min') && control.getAttribute('cc-min') > value || control.hasAttribute('cc-max') && control.getAttribute('cc-max') < value)
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

internalAdapter.prototype.getAdapterControl = function (id) {

    /* getAdapterControl()__________________________________________________
    Gets cached adapter control based on id                                */

    return AdapterControls.filter(control => { return control.id == id });

}

internalAdapter.prototype.checkActiveState = function (checkValue, type) {

    /* checkActiveState()___________________________________________________
    Check adapter sensitive active state of device                         */

    return toBool(checkValue);

}

internalAdapter.prototype.parseExpression = function (subject) {

    /* parseExpression()____________________________________________________
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
