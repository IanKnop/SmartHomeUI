/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas List
   
    (C) 2022 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

// ADAPTER REGISTRATION AFTER LOAD
this.addEventListener("load", function () {

    ControlProviders.list = new List();

});

// ADAPTER BASE FUNCTION
function List() {

    List.prototype.parseList = function (control, content) {

        /* parseList()________________________________________________________
        Parses list based on array                                           */

        var returnValue = '<table class="list-table">';
        
        var styles = { 
            table: control.getAttribute('cc-table-style'), 
            row: control.getAttribute('cc-row-style'), 
            header: control.getAttribute('cc-header-style'), 
            cell: control.getAttribute('cc-cell-style') 
        };

        if (Array.isArray(content)) {

            var isFirstRow = true;
           
            content.forEach(row => {

                if (typeof row === 'string') {
                    
                    // SIMPLE STRING DATA
                    returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '"><td class="list-td" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + '">' + row + '</td></tr>';

                } 
                else if (Array.isArray(row)) {

                    // LIST WITHOUT HEADERS (= STRING ARRAY)
                    returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '">'; row.forEach(function(col) { 
                        
                        returnValue += '<td class="list-td" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + '" onclick="ControlProviders.list.clickItem(\'' + col + '\', this, \'' + control.id + '\')>' + col + '</td>';

                    }); returnValue += '</tr>';

                } else if (typeof row === 'object') {

                    // LIST WITH HEADERS (= OBJECT ARRAY)
                    
                    if (isFirstRow) {
                        
                        returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '">'; 
                        Object.keys(row).forEach(function(col) { returnValue += '<th class="list-th" style="' + (styles != null && styles.header != undefined ? styles.header : '') + '">' + col + '</th>' });
                        returnValue += '</tr>';
                    }

                    returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '">'; 
                    Object.keys(row).forEach(function(col) { 
                    
                        returnValue += '<td class="list-td" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + '" onclick="ControlProviders.list.clickItem(\'' + col + '\', this, \'' + control.id + '\')">' + row[col] + '</td>' 
                    
                    }); 
                    returnValue += '</tr>';
                }

                isFirstRow = false;
            });

        }
        
        control.innerHTML = returnValue + '</table>';
    }

    List.prototype.replaceFieldValue = function (fieldId, responseDataset = null, sourceControl = null,  thisDataset = Dataset) {

        /* replaceFieldValue()___________________________________________________
        Replaces list specific value for given field names in (payload)-object  */
        
        if (isNaN(fieldId)) fieldId = this.getFieldId(sourceControl, fieldId);
        return sourceControl.firstChild.rows[responseDataset.row].cells[fieldId].innerText;
    }

    List.prototype.getFieldId = function (sourceControl, fieldName) {

        /* replaceFieldValue()___________________________________________________
        Finds column based on given header title                                */
        
        var returnIndex = -1;
        sourceControl.FirstChild.rows[0].children.forEach(headerCell => {
            
            returnIndex++;
            if (headerCell.innerText.toLowerCase() == fieldId.toLowerCase()) return returnIndex;
        
        });

        return null;
    }

    List.prototype.setValue = function (payload, target, value) {

        /* setValue()____________________________________________________________
        Sets value in list requested by adapter                                 */

        var index = (value == null ? 0 : this.getListNextIndex(payload, value));
        if (payload.valueKeys != undefined) target.control.setAttribute('cc-value-key', (payload.valueKeys != undefined ? payload.valueKeys[index] : payload.value[index]));
        
        return (payload.valueKeys != undefined ? payload.valueKeys[index] : payload.values[index]);

    }
        
    List.prototype.getListNextIndex = function(payload, value) {

        /* getListNextIndex()_____________________________________________________
        Gets index of next element in list based on current control value        */
    
        var add = (payload.direction != undefined ? (payload.direction.toLowerCase() == 'up' ? 1 : -1) : 1);
        var list = (payload.valueKeys != undefined ? payload.valueKeys : payload.values);
        
        return ((list.indexOf(value) + add > (list.length - 1) || list.indexOf(value) + add < 0) ? (add == 1 ? 0 : (list.length - 1)) : list.indexOf(value) + add);
    }

    List.prototype.clickItem = function (fieldName, senderRow, list) {

        /* clickItem()________________________________________________________
        Raises list click event based on cc-action definition                */

        var senderList = document.getElementById(list);
        var action = JSON.parse(senderList.getAttribute('cc-action'));

        var column = senderRow.cellIndex;
        var row = senderRow.parentElement.rowIndex;
        
        replaceFieldValues(action, { row: row, column: column  }, senderList);
        sendRequest(action.adapter, action.method, action.payload, senderList, '', 'list', function(response, adapter, refreshControl) { 
            
            var payload = {}; 
            var responseAdapter = (action.handle.adapter != undefined ? action.handle.adapter : 'internal');

            payload.response = response; 
            payload.request = action.handle.payload; 
            
            sendRequest(responseAdapter, action.handle.method, payload, refreshControl); 

        });                
    }

}


