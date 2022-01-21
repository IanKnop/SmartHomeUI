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

const DEFAULT_ADAPTER = 'iobroker';
const NUMBER_FORMAT = 'EU';

// GLOBAL PROPERTIES
var Adapters = {};
var AdapterBindings = [];
var AdapterControls = [];
var AdapterConditionControls = [];
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

        // CONTROLS WITH BINDINGS
        if (element.getAttribute('cc-binding') != null && element.getAttribute('cc-binding').trim() != '') {

            var provider = getDataProvider(element);

            AdapterControls.push({ id: element.id, binding: element.getAttribute('cc-binding'), provider: provider, dataprovider: element.getAttribute('cc-dataprovider'), value: element.getAttribute('cc-value'), control: element });
            AdapterBindings.push({ binding: element.getAttribute('cc-binding'), provider: provider });
        }

        // CONTROLS WITH CONDITION BINDINGS
        if (element.getAttribute('cc-conditions') != null && element.getAttribute('cc-conditions').trim != '') {

            AdapterConditionControls.push({ id: element.id, conditions: element.getAttribute('cc-conditions'), style: element.style });
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
    //replaceFieldValues(response);
    Adapters[adapter].handleResponse(responseMode, response, payload, refreshControl);

}

/* =========================================================
    ADAPTER DATA
   ========================================================= */
   function refreshStates(force = false) {

    /* refreshStates()________________________________________________________
    Frequently refreshes states of elements based on interface values        */

    if (AdapterControls != [] || AdapterConditionControls != []) {

        // STANDARD ADAPTER DATA POINTS
        if (force || (updateIteration == -1 || updateIteration == DATA_REFRESH_FREQUENCY)) {

            // PROVIDER BASED ADAPTERS (i.e. ioBroker, Node-RED)
            AdapterControls.forEach(function (control) {

                if (control.provider == undefined || control.provider == null || control.provider == 'null' || control.provider == '') control.provider = DEFAULT_ADAPTER;
                Adapters[control.provider].refreshState(control, Date.now());

            });

            // CONDITIONAL CONTROL BEHAVIOUR
            AdapterConditionControls.forEach(function (control) {

                var conditionControl = document.getElementById(control.id);

                // CHECK CONDITIONS
                if (conditionControl.hasAttribute('cc-conditions') && conditionControl.getAttribute('cc-conditions').trim() != '')
                    applyCondition(conditionControl, JSON.parse(urlDecode(conditionControl.getAttribute('cc-conditions'))), Dataset);
            });

            updateIteration = 0;

        } else {

            updateIteration++;
        }
    }

    refreshAdapterThread = setTimeout(refreshStates, REFRESH_FREQUENCY);
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

function getBindingInfo(tagetDef, senderControl = null) {

    /* getBindingInfo()_____________________________________________________
    Gets target information values as object                               */

    var returnObject = {};

    if (tagetDef.startsWith('{[') || tagetDef.startsWith('{{[')) {

        // STANDARD EXPRESSIONS OR FIELDS 
        returnObject.id = tagetDef;
        returnObject.fullId = tagetDef;
        returnObject.control = null;
        returnObject.mode = tagetDef.startsWith('{{[') ? 'field' : 'expression';

    } else if (tagetDef.includes('[')) {

        // BINDING IS TARGETING AN ARRAY
        returnObject.id = tagetDef.substring(0, tagetDef.indexOf('['));
        returnObject.arrayIndex = tagetDef.substring(tagetDef.indexOf('[') + 1, tagetDef.indexOf(']'));

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

        returnObject.fullId = returnObject.id + '[' + returnObject.arrayIndex + ']';
        returnObject.control = null;

    } else {

        // SINGLE VALUE OR KEY 
        returnObject.id = tagetDef;
        returnObject.fullId = tagetDef;
        returnObject.control = document.getElementById(returnObject.id) != undefined ? document.getElementById(returnObject.id) : null;
        returnObject.mode = (returnObject.control != null && returnObject.control.hasAttribute('cc-value-key')) ? 'key' : 'value';
    }

    return returnObject;
}

function getBindingValue(bindingId, control = null, thisDataset = Dataset) {

    /* getBindingValue()______________________________________________________
    Returns binding value based on given binding id and dataset              */

    var bindValue = null;

    if (bindingId == null || bindingId == '' || bindingId == '#') {

        var bindValue = (control != null ? control.getAttribute('cc-value') : null);

    }
    else if (bindingId.includes('[') && !bindingId.startsWith('{[')) {

        var arrayName = bindingId.substring(0, bindingId.indexOf('['));
        var arrayIndex = bindingId.substring(bindingId.indexOf('[') + 1, bindingId.indexOf(']'));

        if (thisDataset[arrayName] != undefined && thisDataset[arrayName][arrayIndex] != undefined) var bindValue = thisDataset[arrayName][arrayIndex];

    } else {

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

            if (binding.id.includes('::')) value = replaceAdapterFieldValue(value, responseDataset, sourceControl, thisDataset);
            else {

                if (Dataset[binding.id] != undefined && typeof Dataset[binding.id] === 'string') {

                    value = value.replace('{[' + binding.id + ']}', Dataset[binding.id]);

                } else if (Dataset[binding.id] != undefined) {

                    if ((binding.mode == 'bool' || binding.mode == 'reverse-bool') && binding.arrayIndex == 'n') {

                        // TRANSFORM ARRAY OF BOOL IN LIST OF TRUE OR FALSE INDEXES
                        var computeValue = '';
                        for (var index = 0; index <= Dataset[binding.id].length; index++)
                            if (Dataset[binding.id][index] == (binding.mode == 'bool')) computeValue += index + ',';
                         
                        value = value.replace('{[' + binding.id + '[' + (binding.mode == 'bool' ? '?' : '!') + 'n]' + ']}', computeValue.substring(0, Math.max(0, computeValue.length - 1)));
                    
                    } else {

                        value = value.replace('{[' + binding.id + ']}', JSON.stringify(Dataset[binding.id]));
                    
                    }

                } else {

                    value = value.replace('{[' + binding.id + ']}', null);

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
function refreshControl(control, adapter) {

    /* refreshControl()________________________________________________________
    Refreshes control using assigned adapter                                  */

    var binding = getBindingInfo(control.getAttribute('cc-binding'));
    
    /*var bindingId = control.getAttribute('cc-binding');
    var bindValue = getBindingValue(bindingId, control);*/

    var bindingId = binding.fullId;
    var bindValue = getBindingValue(bindingId, control);

    if (bindValue != undefined) {

        if (control.hasAttribute('cc-type')) {

            var typeAttr = control.getAttribute('cc-type').toLowerCase();
            var decimals = control.getAttribute('cc-decimals');

            var prefix = (control.hasAttribute('cc-prefix') ? control.getAttribute('cc-prefix') : '');
            var suffix = (control.hasAttribute('cc-suffix') ? control.getAttribute('cc-suffix') : '');
            var offset = control.getAttribute('cc-offset');

            switch (typeAttr) {

                case 'numeric':

                    bindValue = parseFloat((parseFloat(bindValue) + (offset != null ? parseFloat(offset) : 0))).toFixed((decimals != null ? parseFloat(decimals) : 0));
                    if (NUMBER_FORMAT == 'EU') bindValue = replaceComma(bindValue);

                case 'html':
                case 'text':
                case 'src':

                    if (typeAttr == 'src') control.src = prefix + bindValue + suffix;
                    else control.innerHTML = prefix + bindValue + suffix;
                    break;

                case 'date':
                case 'time':
                case 'shorttime':

                    bindValue = bindValue.substring(0, (typeAttr == 'shorttime' ? 5 : 8));
                    control.innerHTML = prefix + bindValue + suffix;
                    break;

                case 'button':
                case 'switch':
                case 'select':
                case 'scene':

                    var controlProvider = (control.hasAttribute('cc-control-provider') ? control.getAttribute('cc-control-provider') : DEFAULT_CONTROL);
                    if (ControlProviders[controlProvider] != undefined) ControlProviders[controlProvider].updateActiveState(control, adapter.checkActiveState(bindValue, typeAttr));
                    break;

                case 'list':

                    var controlProvider = (control.hasAttribute('cc-control-provider') ? control.getAttribute('cc-control-provider') : DEFAULT_LIST_CONTROL);
                    if (ControlProviders[controlProvider] != undefined) ControlProviders[controlProvider].parseList(control, bindValue);
                    break;

            }
        }
    }
}

function applyCondition(control, conditionObject, data) {

    /* applyCondition()___________________________________________________
    Applys conditions to control (i.e. visibility)                       */

    if (data != null && data != {}) conditionObject.forEach(function (condition) {

        var binding = condition.binding;
        var bindingValue = (data[binding] != null ? data[binding] : null);

        // EVALUATE CONDITION
        if (bindingValue != undefined && bindingValue != null) {
            if (bindingValue == condition.value) {
                if (condition.style != undefined) {
                    for (var key in condition.style) {
                        if (control.style.hasOwnProperty(key)) control.style[key] = condition.style[key];
                    }
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

        var binding = { binding: condition.binding, provider: (condition.provider != undefined ? condition.provider : DEFAULT_ADAPTER) };

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



