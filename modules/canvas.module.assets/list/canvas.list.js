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

            content.forEach(row => {

                if (typeof row === 'string') returnValue += '<tr><td>' + row + '</td></tr>';
                else if (Array.isArray(row)) {

                    returnValue += '<tr>';
                    row.forEach(col => { returnValue += '<td>' + col + '</td>' });
                    returnValue += '</tr>';
                }
            });
        }
        
        control.innerHTML = returnValue + '</table>';

    }

}


