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

        var returnValue = '<table>';

        if (Array.isArray(content)) {

            var isFirstRow = true;
            content.forEach(row => {

                if (typeof row === 'string') {
                    
                    // SIMPLE STRING DATA
                    returnValue += '<tr><td>' + row + '</td></tr>';

                } 
                else if (Array.isArray(row)) {

                    // LIST WITHOUT HEADERS (= STRING ARRAY)
                    returnValue += '<tr>'; row.forEach(col => { returnValue += '<td class="list-td">' + col + '</td>' }); returnValue += '</tr>';

                } else if (typeof row === 'object') {

                    // LIST WITH HEADERS (= OBJECT ARRAY)
                    returnValue += '<tr>'; 
                    if (isFirstRow) Object.keys(row).forEach(col => { returnValue += '<th class="list-th">' + col + '</th>' });
                    else Object.keys(row).forEach(col => { returnValue += '<td class="list-td">' + row[col] + '</td>' }); 
                    returnValue += '</tr>';

                }

                isFirstRow = false
            });

        }
        
        control.innerHTML = returnValue + '</table>';

    }

}


