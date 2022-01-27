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

var Lists = {};

// ADAPTER BASE FUNCTION
function List() {

    /* =========================================================
        LIST PARSING
       ========================================================= */
    List.prototype.parseList = function (controlInfo, content) {

        /* parseList()________________________________________________________
        Parses list based on binding info and content                        */

        Lists[controlInfo.control.id] = content;
        this.parseListControl(controlInfo.control, content);
    }

    List.prototype.parseListControl = function (control, content) {

        /* parseList()________________________________________________________
        Parses list based on list control and content                        */

        var returnValue = '<table class="list-table">';
        var headersHide = control.getAttribute('cc-hide-header') != null ? control.getAttribute('cc-hide-header') : false;
        var headers = (control.hasAttribute('cc-column-headers') ? control.getAttribute('cc-column-headers') : '').split(',');
        var headersWidth = (control.hasAttribute('cc-column-widths') ? control.getAttribute('cc-column-widths') : '').split(',');
        var headersHidden = (control.hasAttribute('cc-hidden-columns') ? control.getAttribute('cc-hidden-columns') : '').split(',');

        var styles = this.getStyles(control);

        if (Array.isArray(content)) {

            for (var index = 0; index < content.length; index++) {

                var highlightSource = replaceFieldValues(control.getAttribute('cc-highlight-source'));
                var highlightValue = replaceFieldValues(control.getAttribute('cc-highlight-value'), { row: index + 1 }, control);

                returnValue += this.parseRow(control, content[index], styles, (index == 0), headersHide, headers, headersWidth, headersHidden, (highlightSource == highlightValue));

            }
        }

        control.innerHTML = returnValue + '</table>';
    }

    List.prototype.parseRow = function (control, content, styles = null, isHeader = false, headersHide = false, headers = [], headersWidths = [], hiddenColumns = [], highlight = false) {

        /* parseRow()_________________________________________________________
        Parses row of list based on given data                               */

        var cells = ''; var index = 0;
        if (typeof content === 'string') content = { "value": content };

        Object.keys(content).forEach(function (col) {

            if (isHeader && headers != [] && headers[index] != undefined) col = headers[index];
            cells += ControlProviders.list.parseCell(col, index, control, content, styles, isHeader, headersWidths, hiddenColumns);

            index++;
        });

        // IF THIS WAS HEADER ROW, THE CONTENT ROW WITH INDEX 0 HAS ALSO TO BE PARSED
        var nextRow = (isHeader ? ControlProviders.list.parseRow(control, content, styles, false, headersHide, headers, headersWidths, hiddenColumns, highlight) : '');

        return '<tr class="list-tr ' + (highlight && !isHeader ? 'list-tr-highlighted' : '') + '" style="' + (styles != null && styles.row != undefined ? styles.row : '') + (isHeader && headersHide ? ' display: none;' : '') + '">' + cells + '</tr>' + nextRow;
    }

    List.prototype.parseCell = function (col, index, control, content, styles, isHeader, headersWidths, hiddenColumns) {

        /* parseCell()_________________________________________________________
        Parses standard or header cell based on given data                    */

        return this.parseCellTag(isHeader) + ' ' +
            this.parseCellStyles(index, styles, isHeader, headersWidths, hiddenColumns) + ' ' +
            this.parseCellEvent(col, control, isHeader) + '>' +
            (isHeader ? col : content[col]) +
            '</t' + (isHeader ? 'h' : 'd') + '>';
    }

    List.prototype.parseCellTag = function (isHeader = false) {

        /* parseCellTag()________________________________________________________
        Parses beginning of table cell tag                                       */

        return '<t' + (isHeader ? 'h' : 'd') + ' class="list-t' + (isHeader ? 'h' : 'd') + '"';

    }

    List.prototype.parseCellStyles = function (index, styles, isHeader, headersWidths = [], hiddenColumns = []) {

        /* parseCellStyles()______________________________________________________
        Parses styles for table cell                                             */

        return 'style="' +
            (styles != null && styles.cell != undefined && !isHeader ? styles.cell : '') +
            (styles != null && styles.header != undefined && isHeader ? ' ' + styles.header : '') +
            (headersWidths != [] && headersWidths[index] != undefined ? ' width: ' + headersWidths[index] + '; ' : '') +
            (hiddenColumns.includes(index.toString()) ? ' display: none;' : '') + '"';

    }

    List.prototype.parseCellEvent = function (col, control, isHeader = false) {

        /* parseCellEvent()_______________________________________________________
        Parses event script command for table cell                               */

        var event = (isHeader ? 'ControlProviders.list.clickHeader(\'' + col + '\', this, \')' : 'ControlProviders.list.clickItem(\'' + col + '\', this, \'' + control.id + '\')');
        return 'onclick="' + event + '"';

    }

    /* =========================================================
        INTERFACE METHODS
       ========================================================= */
    List.prototype.replaceFieldValue = function (fieldId, responseDataset = null, sourceControl = null, thisDataset = Dataset) {

        /* replaceFieldValue()___________________________________________________
        Replaces list specific value for given field names in (payload)-object  */

        if (isNaN(fieldId)) fieldId = ControlProviders.list.getFieldId(sourceControl, fieldId);

        return (sourceControl.firstChild.localName == 'table' && sourceControl.firstChild.rows[responseDataset.row] != undefined ? sourceControl.firstChild.rows[responseDataset.row].cells[fieldId].innerText : '');
    }

    /* =========================================================
        EVENTS 
       ========================================================= */
    List.prototype.clickItem = function (fieldName, cell, list) {

        /* clickItem()________________________________________________________
        Raises list click event based on cc-action definition                */

        var senderList = document.getElementById(list);
        var action = JSON.parse(senderList.getAttribute('cc-action'));

        replaceFieldValues(action, this.getCellObject(cell), senderList);
        sendRequest(action.adapter, action.method, action.payload, senderList, '', 'list', function (response, adapter, refreshControl) {

            var payload = {};
            var responseAdapter = (action.handle.adapter != undefined ? action.handle.adapter : 'internal');

            payload.response = response;
            payload.request = action.handle.payload;

            sendRequest(responseAdapter, action.handle.method, payload, refreshControl, '', 'list', function () {

                // REFRESH LIST AFTER CLICK ACTION (i.e. for highlighting)
                if (Lists[refreshControl.id] != undefined) ControlProviders.list.parseListControl(refreshControl, Lists[refreshControl.id])

            });
        });
    }

    /* =========================================================
        TOOL FUNCTIONS 
       ========================================================= */
    List.prototype.getStyles = function (control) {

        /* getStyles()________________________________________________________
        Merges styles for list control in one object                         */

        return {
            table: control.getAttribute('cc-table-style'),
            row: control.getAttribute('cc-row-style'),
            header: control.getAttribute('cc-header-style'),
            cell: control.getAttribute('cc-cell-style')
        };
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

    List.prototype.getListNextIndex = function (payload, value) {

        /* getListNextIndex()_____________________________________________________
        Gets index of next element in list based on current control value        */

        var add = (payload.direction != undefined ? (payload.direction.toLowerCase() == 'up' ? 1 : -1) : 1);
        var list = (payload.valueKeys != undefined ? payload.valueKeys : payload.values);

        return ((list.indexOf(value) + add > (list.length - 1) || list.indexOf(value) + add < 0) ? (add == 1 ? 0 : (list.length - 1)) : list.indexOf(value) + add);
    }

    List.prototype.getCellObject = function (cell) {

        /* getCellObject()____________________________________________________
        Gets object with row and column of given table cell                  */

        return { row: cell.parentElement.rowIndex, column: cell.cellIndex };

    }
}


