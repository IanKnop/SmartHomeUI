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
    payload = (responseData != null ? payload.request : payload);

    switch (requestMode.toLowerCase()) {

        // VALUE: Modify value of control or variable
        case 'value':

            var requestPayload = this.setValues(payload, senderControl, responseData, nextFunction);
            if (nextFunction != null) nextFunction(requestPayload, this, refreshControl);
            
            break;

        // MSG: Simple message output mainly for debugging
        case 'msg':

            SmartHomeUI.MessageBox.show(payload.message, (payload.showClose != undefined ? payload.showClose : (payload.autoClose != undefined ? false : true)), (payload.autoClose != undefined ? payload.autoClose : -1));    
            break;

        // SCRIPT: Run JavaScript using eval (possible security issues depending on usage)
        case 'script':

            var returnValue = eval(payload.script);
            break;
    }
}

internalAdapter.prototype.setValues = function (payload, senderControl, responseData) {

    /* setValues()____________________________________________________________
    Modifies one or multiple values based on internal adapter request       */

    // TRANSFORM SINGLE VALUE TO ARRAY
    if (typeof payload.target === 'string') payload.target = [payload.target];

    if (payload.target.length > 1) var returnValue = [];
    else var returnValue = null;

    // ITERATE VALUE CHANGE REQUESTS
    for (var index = 0; index < payload.target.length; index++) {

        var bindingInfo = getBindingInfo(payload.target[index], senderControl);
        var value = this.getCurrentValue(bindingInfo);

        var mode = payload.mode != undefined ? payload.mode : 'set';
        
        if (payload.script != undefined) var setValue = eval(payload.script);
        else var setValue = this.parseSetValue(payload.value != undefined ? replaceFieldValue(Array.isArray(payload.value) ? payload.value[index] : payload.value, responseData, senderControl, this.Dataset) : null, bindingInfo);

        switch (mode) {

            // VALUE SET
            case 'toggle':

                // TOGGLE VALUE "true/false"
                if (value == null) setValue = true;
                else setValue = !toBool(value);

            case 'set':

                // SET VALUE
                if (this.checkUnless(payload, setValue, index)) var newValue = setValue;
                else var newValue = value;
                break;

            // MATH
            case 'add': case 'plus': case 'substract': case 'minus':

                // MATH: ADDITION / SUBSTRACTION
                switch ((payload.valueFormat != undefined ? payload.valueFormat : 'numeric')) {

                    case 'time':

                        if (value != null) {
                            var dateValue = new Date(); var short = (value.length == 5);
                            var newValue = (new Date(dateValue.setHours(value.substring(0, 2), value.substring(3, 5), (short ? (payload.mode == 'substract' || payload.mode == 'minus' ? (-1 * setValue) : setValue) : parseFloat(value.substring(6, 8)) + (payload.mode == 'substract' || payload.mode == 'minus' ? (-1 * setValue) : setValue))))).toTimeString().substring(0, (short ? 5 : 8));
                        }
                        break;

                    case 'numeric':
                    default:

                        var additor = setValue * (payload.mode == 'substract' || payload.mode == 'minus' ? -1 : 1);
                        var newValue = parseFloat(bindingInfo.control.getAttribute('cc-value')) + parseFloat(additor);
                        break;
                }
                break;

            case 'multi': case 'multiply':

                // MATH: MULTIPLICATION
                var newValue = parseFloat(bindingInfo.control.getAttribute('cc-value')) * parseFloat(setValue); break;

            case 'div': case 'divide':

                // MATH: DIVISION
                var newValue = parseFloat(bindingInfo.control.getAttribute('cc-value')) / parseFloat(setValue).toPrecision(5); break;

            default:

                if (ControlProviders[mode] != undefined) var newValue = ControlProviders[mode].setValue(payload, bindingInfo, value);
                else var newValue = parseFloat(bindingInfo.control.getAttribute('cc-value'));

        }

        // SET NEW VALUE AND UPDATE CONTROLS
        this.setValue(bindingInfo, newValue, senderControl);
        
        if (payload.target.length > 1) returnValue.push({ binding: bindingInfo.binding, mode: mode, oldValue: value, newValue: newValue });
        else returnValue = { binding: bindingInfo.binding, mode: mode, oldValue: value, newValue: newValue };
    }

    return returnValue;
}

internalAdapter.prototype.checkUnless = function (payload, setValue, index) {

    /* checkUnless()__________________________________________________________
    Checks if value is NOT excepted by "unless" tag                          */

    if (payload.unless != undefined) {
        
        if (Array.isArray(payload.unless)) {

            if (payload.unless[index] != undefined && Array.isArray(payload.unless[index])) return !payload.unless[index].includes(setValue);
            else if (payload.unless[index] != undefined) return payload.unless[index] != setValue;
            else return !payload.unless.includes(setValue);
        
        } else if (typeof payload.unless === 'string' && typeof setValue === 'string') {

            return payload.unless != setValue;

        } else return false;
    }
    else return true;

}


internalAdapter.prototype.setValue = function (bindingInfo, value, senderControl = null) {

    /* setValue()_____________________________________________________________
    Refreshes dataset and control state with given value                     */

    this.valueToDataset(bindingInfo, value);
    updateDataset(this.dataset);

    if (bindingInfo.control != null) this.refreshState(bindingInfo, Date.now());
    else if (['array', 'range', 'bool', 'reverse-bool'].includes(bindingInfo.mode)) {

        // TARGET IS ARRAY AND MIGHT AFFECT MULTIPLE CONTROLS
        AdapterBindings.filter(arrayBinding => { return arrayBinding.binding == bindingInfo.binding }).forEach(arrayItemInfo => {
            
            this.refreshState(arrayItemInfo, Date.now());

        });
    }
}

internalAdapter.prototype.valueToDataset = function (bindingInfo, value) {

    /* valueToDataset()_______________________________________________________
    Writes new value to dataset according to target definition               */

    if (bindingInfo.control == null || this.checkMinMax(bindingInfo.control, value)) {

        if (bindingInfo.mode == 'value') {
            
            // SINGLE VALUES
            this.dataset[bindingInfo.binding] = value;

        } else if (bindingInfo.mode == 'key') {

            // KEY VALUES
            this.dataset[bindingInfo.binding + '.key'] = value;
            this.dataset[bindingInfo.binding] = JSON.parse(bindingInfo.control.getAttribute('cc-values'))[JSON.parse(bindingInfo.control.getAttribute('cc-value-keys')).indexOf(value)];

        } else {

            // ARRAYS 
            if (this.dataset[bindingInfo.binding] == undefined) this.dataset[bindingInfo.binding] = [];

            if (bindingInfo.mode == 'range') {
                
                // RANGES
                for (index = bindingInfo.from; index <= bindingInfo.to; index++) this.dataset[bindingInfo.binding][index] = value;
            
            } else if (Array.isArray(value)) {
                
                // COMPLETE ARRAYS
                this.dataset[bindingInfo.binding] = value;

            } else {
                
                // SINGLE ARRAY VALUE
                this.dataset[bindingInfo.binding][bindingInfo.arrayIndex] = value;

            }
        }
    }
}

internalAdapter.prototype.refreshState = function (bindingInfo, updateTimestamp = null) {

    /* refreshState()______________________________________________________
    Provider bound refresh for internal adapter                           */

    if (bindingInfo.binding.startsWith('{[') && bindingInfo.binding.endsWith(']}')) {

        // RETURN INTERNAL EXPRESSION (i.e. current time)
        var value = this.parseExpression(getFieldName(bindingInfo.binding));
        this.dataset[bindingInfo.binding] = value;

    } else {

        this.initDataset(bindingInfo);
        var value = ((bindingInfo.mode == 'value' || bindingInfo.mode == 'key') ? this.dataset[bindingInfo.binding] : this.dataset[bindingInfo.binding][bindingInfo.arrayIndex]);

        // ADD ADDITIONAL KEY IF 'cc-value-key' IS SET
        if (bindingInfo.hasControl && bindingInfo.control.hasAttribute('cc-value-key') && this.dataset[bindingInfo.binding + '.key'] == undefined)
            this.dataset[bindingInfo.binding + '.key'] = bindingInfo.control.getAttribute('cc-value-key');

    }

    updateDataset(this.dataset);
    refreshControls(bindingInfo, this);
}

/* =========================================================
   TOOLS
   ========================================================= */
internalAdapter.prototype.initDataset = function (bindingInfo, control) {

    /* initDataset()_______________________________________________________
    Initializes dataset for given binding                                 */

    var control = bindingInfo.control;
    switch (bindingInfo.mode) {

        case 'value':
        case 'key':
            
            if (this.dataset[bindingInfo.binding] == undefined && control != null) this.dataset[bindingInfo.binding] = control.getAttribute('cc-value') != null ? control.getAttribute('cc-value') : '';
            break;

        case 'array':
        case 'bool':
        case 'reverse-bool':

            if (this.dataset[bindingInfo.binding] == undefined) this.dataset[bindingInfo.binding] = [];
            if (this.dataset[bindingInfo.binding][bindingInfo.arrayIndex] == undefined) {

                this.dataset[bindingInfo.binding][bindingInfo.arrayIndex] = (bindingInfo.mode == 'bool' ? false : (bindingInfo.mode == 'reverse-bool' ? true : control.getAttribute('cc-value')));

            }
            break;
    }

    // UPDATE GLOBAL DATASET
    updateDataset(this.dataset);

}

internalAdapter.prototype.getCurrentValue = function (bindingInfo) {

    /* getCurrentValue()____________________________________________________
    Gets current value based on dataset or control                         */

    switch (bindingInfo.mode) {

        case 'value':
            return this.dataset[bindingInfo.binding] != undefined ? this.dataset[bindingInfo.binding] : (bindingInfo.control != undefined ? bindingInfo.control.getAttribute('cc-value') : '');
            
        case 'key':
            return this.dataset[bindingInfo.binding + '.key'];
            
        case 'range':
            return this.dataset[bindingInfo.binding][bindingInfo.from];
            
        case 'array':
        case 'bool':
        case 'reverse-bool':
            return this.dataset[bindingInfo.binding] != undefined && this.dataset[bindingInfo.binding][bindingInfo.arrayIndex] != undefined ? this.dataset[bindingInfo.binding][bindingInfo.arrayIndex] : '';

        default:
            return '';
    }
}

internalAdapter.prototype.parseSetValue = function (setValue, bindingInfo) {

    /* parseSetValue()______________________________________________________
    Parses set value which can be single or array value                    */

    if (setValue == null) return null;
    else if (['array', 'bool', 'reverse-bool'].includes(bindingInfo.mode) && setValue.includes(bindingInfo.arrayIndex)) {
    
        var returnValue = [];
        switch (bindingInfo.mode) {

            case 'bool':
            case 'reverse-bool':
                setValue.split(bindingInfo.arrayIndex).forEach(index => { returnValue[index] = (bindingInfo.mode == 'bool'); });
                break;
                
            default:
                if (!isNaN(bindingInfo.arrayIndex)) returnValue = setValue.split(bindingInfo.arrayIndex);
                break;
        }

        return returnValue;

    } else return setValue;
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

internalAdapter.prototype.checkActiveState = function (checkValue, type) {

    /* checkActiveState()___________________________________________________
    Check adapter sensitive active state of device                         */

    return toBool(checkValue);

}

internalAdapter.prototype.parseExpression = function (subject) {

    /* parseExpression()____________________________________________________
    Parses text with standard expressions (i.e. date, time)                */

    switch (subject.toUpperCase()) {

        case '{[CURRENT_DATE_LONG]}':
        case 'CURRENT_DATE_LONG':
            var thisMoment = new Date();
            return thisMoment.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        case '{[CURRENT_TIME]}':
        case 'CURRENT_TIME':
            var thisMoment = new Date();
            return thisMoment.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }

    return subject;
}
