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

    switch (requestMode.toLowerCase()) {

        // VALUE: Modify value of control or variable
        case 'value':

            this.setValues(payload, senderControl, responseData);
            break;

        // MSG: Simple message output mainly for debugging
        case 'msg':

            alert(payload.message);
            break;
    }
}

internalAdapter.prototype.setValues = function (payload, senderControl, responseData) {

    /* setValues()____________________________________________________________
    Modifies one or multiple values based on internal adapter request       */

    // TRANSFORM SINGLE VALUE TO ARRAY
    if (typeof payload.target === 'string') payload.target = [payload.target];

    // ITERATE VALUE CHANGE REQUESTS
    for (var index = 0; index < payload.target.length; index++) {

        var mode = payload.mode != undefined ? payload.mode : 'set';
        var target = getBindingInfo(payload.target[index], senderControl);

        var value = this.getCurrentValue(target);
        var setValue = this.parseSetValue(payload.value != undefined ? replaceFieldValue(Array.isArray(payload.value) ? payload.value[index] : payload.value, responseData, senderControl, this.Dataset) : null, target);

        switch (mode) {

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

                if (ControlProviders[mode] != undefined) var newValue = ControlProviders[mode].setValue(payload, target, value);
                else var newValue = parseFloat(target.control.getAttribute('cc-value'));

        }

        // SET NEW VALUE AND UPDATE CONTROLS
        this.setValue(target, newValue, senderControl);
    }
}

internalAdapter.prototype.setValue = function (target, value, senderControl = null) {

    /* setValue()_____________________________________________________________
    Refreshes dataset and control state with given value                     */

    this.valueToDataset(target, value);
    updateDataset(this.dataset);

    if (target.control != undefined) this.refreshState(target.control, Date.now());
    else if (['array', 'range', 'bool', 'reverse-bool'].includes(target.mode)) {

        // TARGET IS ARRAY AND MIGHT AFFECT MULTIPLE CONTROLS
        AdapterControls.filter(control => { return control.binding.startsWith(target.id + '[') }).forEach(arrayControl => {

            this.refreshState(arrayControl, Date.now())
        });
    }
}

internalAdapter.prototype.valueToDataset = function (target, value) {

    /* valueToDataset()_______________________________________________________
    Writes new value to dataset according to target definition               */

    if (target.control == null || this.checkMinMax(target.control, value)) {

        if (target.mode == 'value') {
            
            // SINGLE VALUES
            this.dataset[target.id] = value;

        } else if (target.mode == 'key') {

            // KEY VALUES
            this.dataset[target.id + '.key'] = value;
            this.dataset[target.id] = JSON.parse(target.control.getAttribute('cc-values'))[JSON.parse(target.control.getAttribute('cc-value-keys')).indexOf(value)];

        } else {

            // ARRAYS 
            if (this.dataset[target.id] == undefined) this.dataset[target.id] = [];

            if (target.mode == 'range') {
                
                // RANGES
                for (index = target.from; index <= target.to; index++) this.dataset[target.id][index] = value;
            
            } else if (Array.isArray(value)) {
                
                // COMPLETE ARRAYS
                this.dataset[target.id] = value;

            } else {
                
                // SINGLE ARRAY VALUE
                this.dataset[target.id][target.arrayIndex] = value;

            }
        }
    }
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

            var binding = getBindingInfo(adapterControl.binding);
            this.initDataset(binding, control);

            var value = ((binding.mode == 'value' || binding.mode == 'key') ? this.dataset[binding.id] : this.dataset[binding.id][binding.arrayIndex]);

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
internalAdapter.prototype.initDataset = function (binding, control) {

    /* initDataset()_______________________________________________________
    Initializes dataset for given binding                                 */

    switch (binding.mode) {

        case 'value':
        case 'key':
            
            if (this.dataset[binding.id] == undefined) this.dataset[binding.id] = control.getAttribute('cc-value') != null ? control.getAttribute('cc-value') : '';
            break;

        case 'array':
        case 'bool':
        case 'reverse-bool':

            if (this.dataset[binding.id] == undefined) this.dataset[binding.id] = [];
            if (this.dataset[binding.id][binding.arrayIndex] == undefined) {

                this.dataset[binding.id][binding.arrayIndex] = (binding.mode == 'bool' ? false : (binding.mode == 'reverse-bool' ? true : control.getAttribute('cc-value')));

            }
            break;
    }

    // UPDATE GLOBAL DATASET
    updateDataset(this.dataset);

}

internalAdapter.prototype.getCurrentValue = function (target) {

    /* getCurrentValue()____________________________________________________
    Gets current value based on dataset or control                         */

    switch (target.mode) {

        case 'value':
            return this.dataset[target.id] != undefined ? this.dataset[target.id] : (target.control != undefined ? target.control.getAttribute('cc-value') : '');
            
        case 'key':
            return this.dataset[target.id + '.key'];
            
        case 'range':
            return this.dataset[target.id][target.from];
            
        case 'array':
        case 'bool':
        case 'reverse-bool':
            return this.dataset[target.id] != undefined && this.dataset[target.id][target.arrayIndex] != undefined ? this.dataset[target.id][target.arrayIndex] : '';

        default:
            return '';
    }
}

internalAdapter.prototype.parseSetValue = function (setValue, target) {

    /* parseSetValue()______________________________________________________
    Parses set value which can be single or array value                    */

    if (setValue == null) return null;
    else if (['array', 'bool', 'reverse-bool'].includes(target.mode) && setValue.includes(target.arrayIndex)) {
    
        var returnValue = [];
        switch (target.mode) {

            case 'bool':
            case 'reverse-bool':
                setValue.split(target.arrayIndex).forEach(index => { returnValue[index] = (target.mode == 'bool'); });
                break;
                
            default:
                if (!isNaN(target.arrayIndex)) returnValue = setValue.split(target.arrayIndex);
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
