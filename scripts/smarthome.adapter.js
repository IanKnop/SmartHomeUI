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
const REFRESH_FREQUENCY      = 100;  // 100 = 10 times per second
const DATA_REFRESH_FREQUENCY = 50;   // 50  = every 5 seconds trigger API call
const DEFAULT_ADAPTER        = 'iobroker';     

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

function applyCondition(control, conditionObject, data) {

    /* applyCondition()___________________________________________________
    Applys conditions to control (i.e. visibility)                       */

    if (data != null && data != {}) conditionObject.forEach(function (condition) {

        var binding = condition.binding.toLowerCase();
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

function updateDataset(refreshData, parentObject = '') {

    /* updateDataset()________________________________________________________
    Updates datapoint and values in global dataset object                   */

    parentObject += (parentObject != '' && !parentObject.endsWith('.') ?  '.' : '');

    if (!Array.isArray(refreshData) && typeof refreshData === 'object') {
        
        Object.keys(refreshData).forEach(key => {
            
            var bindingId = (parentObject + key).toLowerCase();

            if (!(typeof refreshData[key] === 'object')) Dataset[bindingId] = refreshData[key];
            else Dataset[bindingId] = refreshData[key]; //'[object]';
        });

    } 
}

function triggerAdapterUpdate() {

    /* triggerAdapterUpdate()______________________________________________
    Manually triggers control update (i.e. after button was pressed)      */
    
    clearTimeout(refreshAdapterThread);
    setTimeout(function() { refreshStates(true); }, 1000);

}

/* =========================================================
    ADAPTER METHODS
   ========================================================= */
function refreshControl(control, adapter) {

    /* refreshControl()________________________________________________________
    Refreshes control using assigned adapter                                  */

    var bindingId = control.getAttribute('cc-binding');
    
    if (bindingId == null || bindingId == '' || bindingId == '#') var bindValue = control.getAttribute('cc-value');
    else var bindValue = Dataset[bindingId.toLowerCase()];

    if (bindValue != undefined) {

        if (control.hasAttribute('cc-type')) {

            var typeAttr = control.getAttribute('cc-type').toLowerCase();
            var decimals = control.getAttribute('cc-decimals');
        
            var prefix = (control.hasAttribute('cc-prefix') ? control.getAttribute('cc-prefix') : '');
            var suffix = (control.hasAttribute('cc-suffix') ? control.getAttribute('cc-suffix') : '');
            var offset = control.getAttribute('cc-offset');
        
            switch (typeAttr) {
        
                case 'numeric':
                
                    var bindValue = parseFloat((parseFloat(bindValue) + (offset != null ? parseFloat(offset) : 0)).toFixed((decimals != null ? parseFloat(decimals) : 2))).toLocaleString();
        
                case 'html':
                case 'date':
                case 'time':
                case 'text':
                case 'src':
        
                    if (typeAttr == 'src') control.src = prefix + bindValue + suffix;
                    else control.innerHTML = prefix + bindValue + suffix;
                    break;
        
                case 'button':
                case 'switch':
                case 'select':
                case 'scene':
        
                    var controlProvider = (control.hasAttribute('cc-control-provider') ? control.getAttribute('cc-control-provider') : DEFAULT_CONTROL);
                    ControlProviders[controlProvider].updateActiveState(control, adapter.checkActiveState(bindValue, typeAttr));
                    break;

                case 'list':

                    var controlProvider = (control.hasAttribute('cc-control-provider') ? control.getAttribute('cc-control-provider') : DEFAULT_LIST_CONTROL);
                    ControlProviders[controlProvider].parseList(control, bindValue);
                    break;
                
            }
        }
    }
}

function sendDefaultRequest(requestMode, payload, refreshControl = null, sound = '', controlProvider = 'canvas', nextFunction = null) {

    /* sendDefaultRequest()________________________________________________
    Sends request to default adapter                                      */

    sendRequest(DEFAULT_ADAPTER, requestMode, payload, refreshControl, sound, controlProvider, nextFunction);

}

function sendRequest(adapter, requestMode, payload, refreshControl = null, sound = '', controlProvider = 'canvas', nextFunction = null) {

    /* sendRequest()_______________________________________________________
    Sends request to specified adapter                                    */

    if (adapter == null || adapter == '') adapter = DEFAULT_ADAPTER;

    // PLAY SOUND
    if (sound != '') SmartHomeUI.Audio.playSound(sound.toUpperCase());
    
    // CALL ADAPTER BASED REQUEST HANDLING
    replaceFieldValues(payload, null, refreshControl);
    Adapters[adapter].sendRequest(requestMode, payload, refreshControl, controlProvider, nextFunction);

}

function handleResponse(adapter, responseMode, response, payload = null, refreshControl = null) {

    /* handleResponse()____________________________________________________
    Handles adapter based call-responses                                  */

    if (adapter == null || adapter == '') adapter = DEFAULT_ADAPTER;
    
    replaceFieldValues(payload, response, refreshControl);
    //replaceFieldValues(response);
    Adapters[adapter].handleResponse(responseMode, response, payload, refreshControl);

}

function getBindingValue(bindingId, thisDataset = Dataset) {
    
    /* getBindingValue()______________________________________________________
    Returns binding value based on given binding id and dataset              */

    return thisDataset.filter(item => {
        if (item.id != undefined) return item.id.toLowerCase() === bindingId;
        else return { val: null };
    })[0].val;
}

function replaceFieldValues(sourceObject, responseDataset = null, sourceControl = null, thisDataset = Dataset) {
    
    /* replaceFieldValues()___________________________________________________
    Replaces values for given field names in (payload)-object                */
    
    Object.keys(sourceObject).forEach(key => {

        var value = sourceObject[key];

        if (typeof value != 'string') replaceFieldValues(value, responseDataset, sourceControl, thisDataset);
        else {

            if (value.includes('{response}')) value = value.replace('{response}', (typeof responseDataset === 'string' ? responseDataset : JSON.stringify(responseDataset)));

            while (value.includes('{response.')) {

                var propertyId = value.substring(value.indexOf('{response.') + 10, value.indexOf('}', value.indexOf('{response.')));
                value = value.replace('{response.' + propertyId + '}', responseDataset[propertyId]);
            }

            while (value.includes('{[')) {

                var fieldName = value.substring(value.indexOf('{[') + 2, value.indexOf(']}'));

                if (fieldName.includes('::')) {

                    var fieldId = fieldName.split('::')[1];
                    var adapterId = fieldName.split('::')[0];
                    var replaceValue = '';

                    if (ControlProviders[adapterId] != undefined) replaceValue = ControlProviders[adapterId].replaceFieldValue(fieldId, responseDataset, sourceControl, thisDataset);
                    else if (Adapters[adapterId] != undefined) replaceValue = Adapters[adapterId].replaceFieldValue(fieldId, responseDataset, sourceControl, thisDataset);

                    value = value.replace('{[' + fieldName + ']}', replaceValue);

                } else {

                    if (Dataset[fieldName.toLowerCase()] != undefined && typeof Dataset[fieldName.toLowerCase()] === 'string') value = value.replace('{[' + fieldName + ']}', Dataset[fieldName.toLowerCase()]);
                    else if (Dataset[fieldName.toLowerCase()] != undefined) value = value.replace('{[' + fieldName + ']}', JSON.stringify(Dataset[fieldName.toLowerCase()]));
                    else value = value.replace('{[' + fieldName + ']}', null);
    
                }
            }

            sourceObject[key] = value;
        }
    });
}

function getAdapterDataSet(convertDataSet) {

    /* getAdapterDataSet()_________________________________________________
    Returns dataset with id and value property                            */

    var returnObject = {};
    convertDataSet.forEach(item => returnObject[item.id] = item.val);

    return returnObject;
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
    conditions.forEach(function(condition) {
        
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



