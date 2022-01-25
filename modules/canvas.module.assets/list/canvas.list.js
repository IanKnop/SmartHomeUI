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

    List.prototype.parseList = function (bindingInfo, content) {

        /* parseList()________________________________________________________
        Parses list based on array                                           */

        var returnValue = '<table class="list-table">';
        
        var hiddenColumns = (bindingInfo.control.hasAttribute('cc-hidden-columns') ? bindingInfo.control.getAttribute('cc-hidden-columns') : '').split(',');

        var styles = { 
            table: bindingInfo.control.getAttribute('cc-table-style'), 
            row: bindingInfo.control.getAttribute('cc-row-style'), 
            header: bindingInfo.control.getAttribute('cc-header-style'), 
            cell: bindingInfo.control.getAttribute('cc-cell-style') 
        };

        if (Array.isArray(content)) {

            var isFirstRow = true;
           
            content.forEach(row => {

                returnValue += this.parseRow(bindingInfo, row, styles, isFirstRow, hiddenColumns);
                isFirstRow = false;

            });

        }
        
        bindingInfo.control.innerHTML = returnValue + '</table>';
    }

    List.prototype.parseRow = function (bindingInfo, content, styles = null, isHeader = false, hiddenColumns = []) {

        /* parseRow()_________________________________________________________
        Parses row of list based on given data                               */

        if (typeof content === 'string') content = [ content ];
        
        var cells = '';
        if (Array.isArray(content)) {
            
            // ARRAY
            var index = 0;
            content.forEach(function(col) { cells += '<t' + (isHeader ? 'h' : 'd') + ' class="list-t' + (isHeader ? 'h' : 'd') + '" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + (hiddenColumns.includes(index.toString()) ? ' display: none; ': '') + '" onclick="ControlProviders.list.clickItem(\'' + col + '\', this, \'' + bindingInfo.controlId + '\')>' + col + '</t' + (isHeader ? 'h' : 'd') + ' >'; index++ }); 

        } else {

            // OBJECT
            var index = 0;
            Object.keys(content).forEach(function(col) { 
                
                cells += ControlProviders.list.parseCell(col, index, bindingInfo, content, styles, isHeader, hiddenColumns); 
                index++; 
            
            }); 

        }

        var nextRow = (isHeader ? ControlProviders.list.parseRow(bindingInfo, content, styles, false, hiddenColumns) : '');
        return '<tr class="list-tr" style="' + (styles != null && styles.row != undefined ? styles.row : '') + '">' + cells + '</tr>' + nextRow;
    }

    List.prototype.parseCell = function (col, index, bindingInfo, content, styles, isHeader, hiddenColumns) {
      
        /* parseCell()_________________________________________________________
        Parses standard or header cell based on given data                    */ 
        
        var clickScript = (isHeader ? 'ControlProviders.list.clickHeader(\'' + col + '\', this, \')' : 'ControlProviders.list.clickItem(\'' + col + '\', this, \'' + bindingInfo.controlId + '\')');
        return '<t' + (isHeader ? 'h' : 'd') + ' class="list-t' + (isHeader ? 'h' : 'd') + '" style="' + (styles != null && styles.cell != undefined ? styles.cell : '') + (hiddenColumns.includes(index.toString()) ? ' display: none;': '') + '" onclick="' + clickScript +'">' + (isHeader ? col : content[col]) + '</t' + (isHeader ? 'h' : 'd') + '>';
    }

    List.prototype.replaceFieldValue = function (fieldId, responseDataset = null, sourceControl = null,  thisDataset = Dataset) {

        /* replaceFieldValue()___________________________________________________
        Replaces list specific value for given field names in (payload)-object  */
        
        if (isNaN(fieldId)) fieldId = ControlProviders.list.getFieldId(sourceControl, fieldId);
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

        var index = (value == null ? 0 : ControlProviders.list.getListNextIndex(payload, value));
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


