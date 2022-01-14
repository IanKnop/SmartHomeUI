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
            var currentRow = 0;

            content.forEach(row => {

                var currentColumn = 0;
                if (typeof row === 'string') {
                    
                    // SIMPLE STRING DATA
                    returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '"><td class="list-td" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + '">' + row + '</td></tr>';

                } 
                else if (Array.isArray(row)) {

                    // LIST WITHOUT HEADERS (= STRING ARRAY)
                    returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '">'; row.forEach(function(col) { 
                        
                        returnValue += '<td class="list-td" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + '" onclick="ControlProviders.list.clickItem(\'' + col + '\', ' + currentColumn + ', ' + currentRow + ', \'' + control.id + '\')>' + col + '</td>';
                        currentColumn++;

                    }); returnValue += '</tr>';

                } else if (typeof row === 'object') {

                    // LIST WITH HEADERS (= OBJECT ARRAY)
                    
                    returnValue += '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '">'; 
                    if (isFirstRow) Object.keys(row).forEach(function(col) { returnValue += '<th class="list-th" style="' + (styles != null && styles.header != undefined ? styles.header : '') + '">' + col + '</th>' });
                    else Object.keys(row).forEach(function(col) { 
                        
                    
                        returnValue += '<td class="list-td" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + '" onclick="ControlProviders.list.clickItem(\'' + col + '\', ' + currentColumn + ', ' + currentRow + ', \'' + control.id + '\')">' + row[col] + '</td>' 
                        currentColumn++;
                    
                    }); 
                    returnValue += '</tr>';

                }
                
                currentRow++;
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

        var returnIndex = -1;
        sourceControl.FirstChild.rows[0].children.forEach(headerCell => {
            
            returnIndex++;
            if (headerCell.innerText.toLowerCase() == fieldId.toLowerCase()) return returnIndex;
        
        });

        return null;
    }


    List.prototype.clickItem = function (fieldName, row, column, sender) {

        /* clickItem()________________________________________________________
        Raises list click event based on cc-action definition                */

        var senderList = document.getElementById(sender);
        var action = JSON.parse(senderList.getAttribute('cc-action'));
        
        replaceFieldValues(action, { row: row, column: column  }, senderList);
        sendRequest(action.adapter, action.method, action.payload, senderList, '', 'list', function(response, adapter, refreshControl) { 
            
            var payload = {}; 
            var responseAdapter = (action.handle.adapter != undefined ? action.handle.adapter : action.adapter);

            payload.response = response; 
            payload.request = action.handle.payload; 
            
            sendRequest(responseAdapter, action.handle.method, payload, refreshControl); 

        });                
    }

}


