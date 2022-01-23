/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Adapter Bindings

    (C) 2021 by Ian Knop, Weiterstadt, Germany
    https://github.com/IanKnop/SmartHomeUI/
    ========================================================= */

/* =========================================================
    API - LISTENER
   ========================================================= */

// SETTING CONSTANTS
const REFRESH_FREQUENCY = 100;  // 100 = 10 times per second
const DATA_REFRESH_FREQUENCY = 50;   // 50  = every 5 seconds trigger API call

const DEFAULT_ADAPTER = 'internal';
const NUMBER_FORMAT = 'EU';

// GLOBAL PROPERTIES
var Adapters = {};
var AdapterBindings = [];
var ConditionalControls = [];
var Dataset = {};

var refreshAdapterThread = null;
var updateIteration = -1;

/* =========================================================
    INITIALIZATION
   ========================================================= */
this.addEventListener("load", function () {

    /* Event: onload___________________________________________________________
    Create array of all controls that have to be updated                     */

    document.body.querySelectorAll('[cc-update="true"],[cc-conditions]').forEach(element => {

        // READ ALL CONTROL BINDINGS
        if (element.getAttribute('cc-binding') != null && element.getAttribute('cc-binding').trim() != '') AdapterBindings.push(getBindingInfo(element.getAttribute('cc-binding')));

        // CONTROLS WITH CONDITION BINDINGS
        if (element.getAttribute('cc-conditions') != null && element.getAttribute('cc-conditions').trim != '') {
            ConditionalControls.push({ id: element.id, conditions: element.getAttribute('cc-conditions'), style: element.style });
            getConditionBindings(element.getAttribute('cc-conditions')).forEach(binding => AdapterBindings.push(binding));
        }
    });

    // REFRESH STATE ONCE AND THEN AS {REFRESH_FREQUENCY} INTERVAL (in refreshStates() function)
    refreshStates();

});

/* =========================================================
    ADAPTER METHODS
   ========================================================= */
function sendRequest(adapter, requestMode, payload, refreshControl = null, sound = '', controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()_______________________________________________________
    Sends request to specified adapter                                    */

    if (adapter == null || adapter == '') adapter = DEFAULT_ADAPTER;

    // PLAY SOUND
    if (sound != '') SmartHomeUI.Audio.playSound(sound.toUpperCase());

    // REPLACE FIELD VALUES
    replaceFieldValues(payload, null, refreshControl);
    
    // CALL ADAPTER BASED REQUEST HANDLING
    Adapters[adapter].sendRequest(requestMode, payload, refreshControl, controlProvider, nextFunction);

}

function sendDefaultRequest(requestMode, payload, refreshControl = null, sound = '', controlProvider = 'canvas', nextFunction = null) {

    /* sendDefaultRequest()________________________________________________
    Sends request to default adapter                                      */

    sendRequest(DEFAULT_ADAPTER, requestMode, payload, refreshControl, sound, controlProvider, nextFunction);

}

function handleResponse(adapter, responseMode, response, payload = null, refreshControl = null) {

    /* handleResponse()____________________________________________________
    Handles adapter based call-responses                                  */

    if (adapter == null || adapter == '') adapter = DEFAULT_ADAPTER;

    replaceFieldValues(payload, response, refreshControl);
    Adapters[adapter].handleResponse(responseMode, response, payload, refreshControl);

}

/* =========================================================
    ADAPTER DATA
   ========================================================= */
function refreshStates(force = false) {

    /* refreshStates()________________________________________________________
    Frequently refreshes states of elements based on interface values        */

    if (AdapterBindings != [] || ConditionalControls != []) {

        // STANDARD ADAPTER DATA POINTS
        if (force || (updateIteration == -1 || updateIteration == DATA_REFRESH_FREQUENCY)) {

            // REFRESH DATA OF ADAPTER BINDINGS AND ANY RELATED CONTROLS (i.e. ioBroker, Node-RED)
            var refreshTimestamp = Date.now();
            AdapterBindings.forEach(function (bindingInfo) {

                if (!hasProvider(bindingInfo)) bindingInfo.provider = DEFAULT_ADAPTER;
                Adapters[bindingInfo.provider].refreshState(bindingInfo, refreshTimestamp);

            });

            // CONDITIONAL CONTROL BEHAVIOUR
            ConditionalControls.forEach(function (control) {

                // CHECK AND APPLY CONDITIONS
                var control = document.getElementById(control.id);
                if (control.hasAttribute('cc-conditions')) applyCondition(control, JSON.parse(urlDecode(control.getAttribute('cc-conditions'))));

            });

            updateIteration = 0;

        } else {

            updateIteration++;
        }
    }

    refreshAdapterThread = setTimeout(refreshStates, REFRESH_FREQUENCY);
}

function hasProvider(bindingInfo) {

    /* updateDataset()________________________________________________________
    Returns if binding information includes provider                         */

    return !(bindingInfo.provider == undefined || bindingInfo.provider == null || bindingInfo.provider == 'null' || bindingInfo.provider == '')

}

function updateDataset(refreshData, parentObject = '') {

    /* updateDataset()________________________________________________________
    Updates datapoint and values in global dataset object                   */

    parentObject += (parentObject != '' && !parentObject.endsWith('.') ? '.' : '');

    if (!Array.isArray(refreshData) && typeof refreshData === 'object') {

        Object.keys(refreshData).forEach(key => {

            var bindingId = (parentObject + key); //.toLowerCase();

            if (!(typeof refreshData[key] === 'object')) Dataset[bindingId] = refreshData[key];
            else Dataset[bindingId] = refreshData[key]; //'[object]';
        });

    }
}

function getControlInfo(control) {

    /* getBindingInfo()_____________________________________________________
    Gets target information values as object                               */

    return { 
        id:             control.id, 
        binding:        control.getAttribute('cc-binding'), 
        provider:       getDataProvider(control), 
        dataprovider:   control.getAttribute('cc-dataprovider'), 
        value:          control.getAttribute('cc-value'), 
        control:        control 
    }

}

function getBindingInfo(binding) {

    /* getBindingInfo()_____________________________________________________
    Gets target information values as object                               */

    var returnObject = getBindingObject(binding);
    
    if (binding.startsWith('{[') || binding.startsWith('{{[')) {
        
        // STANDARD EXPRESSIONS
        returnObject.mode = binding.startsWith('{{[') ? 'field' : 'expression';

    } else if (binding.includes('[')) {

        // BINDING IS TARGETING AN ARRAY
        returnObject.isArray = true;
        setBindingArrayInfo(returnObject, binding);

    } else {

        // SINGLE VALUE OR KEY 
        returnObject.mode = (returnObject.control != null && returnObject.control.hasAttribute('cc-value-key')) ? 'key' : 'value';
    }

    return returnObject;
}

function getBindingObject(binding) {

    /* getBindingObject()_____________________________________________________
    Returns new binding info object                                          */

    var control = document.getElementById(binding);
    
    var returnValue = { 
        binding:    binding, 
        provider:   (binding.includes('::') ? binding.split('::')[0] : DEFAULT_ADAPTER),
        control:    null, 
        controlId:  null, 
        hasControl: false, 
        controls:   document.body.querySelectorAll('[cc-binding="' + binding + '"]'),
        arrayIndex: null, 
        isArray:    false,
        mode:       'value'
    }

    if (returnValue.controls.length > 0) {
        returnValue.control = returnValue.controls[0];
        returnValue.controlId = returnValue.controls[0].id;
        returnValue.provider = getDataProvider(returnValue.control);
        returnValue.hasControl = true;
    }

    return returnValue;
}

function setBindingArrayInfo(returnObject, binding) {

    /* setBindingArrayInfo()__________________________________________________
    Sets array specific binding information                                  */

    returnObject.binding = binding.substring(0, binding.indexOf('['));
    returnObject.arrayIndex = binding.substring(binding.indexOf('[') + 1, binding.indexOf(']'));
        
    if (!isNaN(returnObject.arrayIndex)) {

        // STANDARD ARRAY
        returnObject.mode = 'array';

    } else if (returnObject.arrayIndex.startsWith('?') || returnObject.arrayIndex.startsWith('!')) {

        // BOOL OR REVERSE-BOOL ARRAY METHOD
        returnObject.mode = returnObject.arrayIndex.startsWith('?') ? 'bool' : 'reverse-bool';

        returnObject.arrayIndex = returnObject.arrayIndex.substring(1);

    } else if (returnObject.arrayIndex.includes('-')) {

        // ARRAY RANGE METHOD
        returnObject.mode = 'range';

        returnObject.from = returnObject.arrayIndex.substring(0, returnObject.arrayIndex.indexOf('-'));
        returnObject.to = returnObject.arrayIndex.substring(returnObject.arrayIndex.indexOf('-') + 1);
    }

    returnObject.arrayId = returnObject.binding + '[' + returnObject.arrayIndex + ']';
    
}

function getBindingValue(bindingInfo, thisDataset = Dataset) {

    /* getBindingValue()______________________________________________________
    Returns binding value based on given binding id and dataset              */

    var bindValue = null;
    var bindingId = (bindingInfo.isArray ? bindingInfo.arrayId : bindingInfo.binding);

    if (bindingId == null || bindingId == '' || bindingId == '#') {

        // RETURN VALUE FROM "cc-value"-ATTRIBUTE INSTEAD OF DATASET
        var bindValue = (bindingInfo.hasControl ? bindingInfo.control.getAttribute('cc-value') : null);

    }
    else if (bindingId.startsWith('{[')) {

        // RETURN STANDARD EXPRESSIONS ARE ALWAYAS COMPUTED LIVE
        var bindValue = Adapters.internal.parseExpression(bindingId);

    }
    else if (bindingId.includes('[') && !bindingId.startsWith('{[')) {

        // RETURN SINGLE ARRAY VALUE
        var arrayName = bindingId.substring(0, bindingId.indexOf('['));
        var arrayIndex = bindingId.substring(bindingId.indexOf('[') + 1, bindingId.indexOf(']'));

        if (thisDataset[arrayName] != undefined && thisDataset[arrayName][arrayIndex] != undefined) var bindValue = thisDataset[arrayName][arrayIndex];

    } else {

        // RETURN COMPLETE OBJECT
        var bindValue = thisDataset[bindingId];

    }

    return bindValue;
}

function replaceFieldValues(sourceObject, responseDataset = null, sourceControl = null, thisDataset = Dataset) {

    /* replaceFieldValues()___________________________________________________
    Replaces values for given field names in (payload)-object                */

    Object.keys(sourceObject).forEach(key => {

        if (typeof sourceObject[key] != 'string') replaceFieldValues(sourceObject[key], responseDataset, sourceControl, thisDataset);
        else sourceObject[key] = replaceFieldValue(sourceObject[key], responseDataset, sourceControl, thisDataset)

    });
}

function replaceFieldValue(value, responseDataset = null, sourceControl = null, thisDataset = Dataset) {

    /* replaceFieldValue()___________________________________________________
    Replaces field variables in given string value                          */

    if (typeof value === 'string') {

        // COMPLETE RESPONSE
        if (value.includes('{response}')) value = value.replace('{response}', (typeof responseDataset === 'string' ? responseDataset : JSON.stringify(responseDataset)));

        // RESPONSE FIELDS
        var lastPosition = 0;
        while (value.indexOf('{response.', lastPosition) != - 1) {

            var propertyId = value.substring(value.indexOf('{response.') + 10, value.indexOf('}', value.indexOf('{response.')));

            if (responseDataset != null && responseDataset[propertyId] != undefined) value = value.replace('{response.' + propertyId + '}', responseDataset[propertyId]);
            lastPosition = value.indexOf('{response.') + 1;
        }

        // STANDARD FIELDS
        while (value.includes('{[') && value.includes(']}')) {

            var fieldName = value.substring(value.indexOf('{[') + 2, value.indexOf(']}'));
            var binding = getBindingInfo(fieldName);

            if (binding.binding.includes('::')) value = replaceAdapterFieldValue(value, responseDataset, sourceControl, thisDataset);
            else {

                if (Dataset[binding.binding] != undefined && typeof Dataset[binding.binding] === 'string') {

                    value = value.replace('{[' + binding.binding + ']}', Dataset[binding.binding]);

                } else if (Dataset[binding.binding] != undefined) {

                    if ((binding.mode == 'bool' || binding.mode == 'reverse-bool') && binding.arrayIndex == 'n') {

                        // TRANSFORM ARRAY OF BOOL IN LIST OF TRUE OR FALSE INDEXES
                        var computeValue = '';
                        for (var index = 0; index <= Dataset[binding.binding].length; index++)
                            if (Dataset[binding.binding][index] == (binding.mode == 'bool')) computeValue += index + ',';
                         
                        value = value.replace('{[' + binding.binding + '[' + (binding.mode == 'bool' ? '?' : '!') + 'n]' + ']}', computeValue.substring(0, Math.max(0, computeValue.length - 1)));
                    
                    } else {

                        value = value.replace('{[' + binding.binding + ']}', JSON.stringify(Dataset[binding.binding]));
                    
                    }

                } else {

                    value = value.replace('{[' + binding.binding + ']}', null);

                }
            }
        }
    }

    return value;
}

function replaceAdapterFieldValue(value, responseDataset = null, sourceControl = null, thisDataset = Dataset) {

    /* replaceAdapterFieldValue()__________________________________________
    Replaces field values using special adapter method                    */

    var replaceValue = ''; 
    
    var name = value.substring(value.indexOf('{[') + 2, value.indexOf(']}'));
    var field = name.split('::')[1];
    var adapter = name.split('::')[0];

    if (ControlProviders[adapter] != undefined) replaceValue = ControlProviders[adapter].replaceFieldValue(field, responseDataset, sourceControl, thisDataset);
    else if (Adapters[adapter] != undefined) replaceValue = Adapters[adapter].replaceFieldValue(field, responseDataset, sourceControl, thisDataset);

    return value.replace('{[' + name + ']}', replaceValue);
}

function triggerAdapterUpdate() {

    /* triggerAdapterUpdate()______________________________________________
    Manually triggers control update (i.e. after button was pressed)      */

    clearTimeout(refreshAdapterThread);
    setTimeout(function () { refreshStates(true); }, 1000);

}

function toAdapterDataSet(convertDataSet) {

    /* toAdapterDataSet()__________________________________________________
    Returns dataset with id and value property                            */

    var returnObject = {};
    convertDataSet.forEach(item => returnObject[item.id] = item.val);

    return returnObject;
}

/* =========================================================
    CONTROLS
   ========================================================= */
function refreshControl(controlInfo, adapter) {

    /* refreshControl()________________________________________________________
    Refreshes control using assigned adapter                                  */

    var bindValue = getBindingValue(controlInfo);
    if (bindValue != undefined) {

        if (controlInfo.control.hasAttribute('cc-type')) {

            var typeAttr = controlInfo.control.getAttribute('cc-type').toLowerCase();
            var decimals = controlInfo.control.getAttribute('cc-decimals');

            var prefix = (controlInfo.control.hasAttribute('cc-prefix') ? controlInfo.control.getAttribute('cc-prefix') : '');
            var suffix = (controlInfo.control.hasAttribute('cc-suffix') ? controlInfo.control.getAttribute('cc-suffix') : '');
            var offset = controlInfo.control.getAttribute('cc-offset');

            switch (typeAttr) {

                case 'numeric':

                    bindValue = parseFloat((parseFloat(bindValue) + (offset != null ? parseFloat(offset) : 0))).toFixed((decimals != null ? parseFloat(decimals) : 0));
                    if (NUMBER_FORMAT == 'EU') bindValue = replaceComma(bindValue);

                case 'html':
                case 'text':
                case 'src':

                    if (typeAttr == 'src') controlInfo.control.src = prefix + bindValue + suffix;
                    else controlInfo.control.innerHTML = prefix + bindValue + suffix;
                    break;

                case 'date':
                case 'time':
                case 'shorttime':

                    bindValue = (typeAttr == 'date' ? bindValue : bindValue.substring(0, (typeAttr == 'shorttime' ? 5 : 8)));
                    controlInfo.control.innerHTML = prefix + bindValue + suffix;
                    break;

                case 'button':
                case 'switch':
                case 'select':
                case 'scene':

                    var controlProvider = (controlInfo.control.hasAttribute('cc-control-provider') ? controlInfo.control.getAttribute('cc-control-provider') : DEFAULT_CONTROL);
                    if (ControlProviders[controlProvider] != undefined) ControlProviders[controlProvider].updateActiveState(controlInfo, adapter.checkActiveState(bindValue, typeAttr));
                    break;

                case 'list':

                    var controlProvider = (controlInfo.control.hasAttribute('cc-control-provider') ? controlInfo.control.getAttribute('cc-control-provider') : DEFAULT_LIST_CONTROL);
                    if (ControlProviders[controlProvider] != undefined) ControlProviders[controlProvider].parseList(controlInfo, bindValue);
                    break;

            }
        }
    }
}

function refreshAdapterControls(adapter) {

    /* refreshAdapterControls()______________________________________________
    Refreshes all controls bound to given adapter                           */

    AdapterBindings.forEach(bindingInfo => { if (bindingInfo.provider == adapter.adapterName && bindingInfo.hasControl) refreshControl(bindingInfo, adapter); });

}

function applyCondition(control, conditionObject, data = Dataset) {

    /* applyCondition()___________________________________________________
    Applys conditions to control (i.e. visibility)                       */

    if (data != null && data != {}) conditionObject.forEach(function (condition) {

        var binding = condition.binding;
        var bindingValue = (data[binding] != null ? data[binding] : null);
        var conditionsMet = true;

        // CHECK IF VALUE "undefined", "null" OR empty
        if (condition.empty != undefined) {
            
            if (!condition.empty && (bindingValue == undefined || bindingValue == null || (typeof bindingValue === 'string' ? bindingValue == '' : bindingValue.length == 0))) conditionsMet = false;
            else if (condition.empty && !(bindingValue == undefined || bindingValue == null || (typeof bindingValue === 'string' ? bindingValue == '' : bindingValue.length == 0))) conditionsMet = false;
        }

        // CHECK VALUE
        if (condition.value != undefined && bindingValue != condition.value) conditionsMet = false;

        if (conditionsMet) {
            if (condition.style != undefined) {
                for (var key in condition.style) {
                    if (control.style.hasOwnProperty(key)) control.style[key] = condition.style[key];
                }
            }
        }
    });
}

/* =========================================================
    TOOLS
   ========================================================= */
function getRequestProperties(payload) {

    var returnString = '?';
    Object.keys(payload).forEach(key => returnString += key + '=' + payload[key] + '&');

    return returnString.substring(0, returnString.length - 1);

}

function getProviderBindings(objectsArray, provider = 'iobroker') {

    /* getProviderBindings()_______________________________________________
    Gets all provider based control bindings                              */

    var returnArray = [];
    objectsArray.forEach(item => { if (item.provider == provider && !returnArray.includes(item.binding)) returnArray.push(item.binding) });
    return returnArray;
}

function getDataProvider(element) {

    /* getDataProvider()______________________________________________________
    Gets data provider of element                                            */

    var returnValue = DEFAULT_ADAPTER;

    if (element.hasAttribute('cc-dataprovider')) returnValue = element.getAttribute('cc-dataprovider');
    else if (element.hasAttribute('cc-provider')) returnValue = element.getAttribute('cc-provider');

    return returnValue;
}

function getConditionBindings(conditions) {

    /* getConditionBindings()______________________________________________
    Gets all datapoints for condition evaluation                          */

    if (typeof conditions === 'string') conditions = JSON.parse(urlDecode(conditions));

    var returnArray = [];
    conditions.forEach(function (condition) {

        //var binding = { binding: condition.binding, provider: (condition.bindingProvider != undefined ? condition.bindingProvider : DEFAULT_ADAPTER), hasControl: false, controlId: null, control: null };
        var binding = getBindingInfo(condition.binding);    
        binding.provider = (condition.bindingProvider != undefined ? condition.bindingProvider : DEFAULT_ADAPTER);

        if (returnArray.filter(item => { return item.binding === condition.binding }).length == 0)
            returnArray.push(binding);

    });

    return returnArray;
}

function toggleValue(value, defaultValue = null) {

    /* toggleValue()_________________________________________________________
    Toggles value to opposite                                               */

    switch (value.toString().toUpperCase()) {
        case '0': return 1;
        case '1': return 0;
        case 'TRUE': return 'false';
        case 'FALSE': return 'true';
        case 'ON': return 'off';
        case 'OFF': return 'on';
        default: return defaultValue;
    }
}



