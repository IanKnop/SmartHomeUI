/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Utility Functions
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

function toBool(variantValue) {

    /* toBool()___________________________________________________________
    Transform variant value types to valid boolean value                 */

    if (typeof variantValue === 'boolean') return variantValue;
    else if (variantValue.toString().toLowerCase() == 'true' || variantValue.toString() == '1') return true;
    else return false;

}

function hasClass(target, targetClass) {
    return document.getElementById(target).classList.contains(targetClass);
}

function addClass(target, targetClass) {
    document.getElementById(target).classList.add(targetClass);
}

function removeClass(target, targetClass) {
    document.getElementById(target).classList.remove(targetClass);
}

function getVar(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName);
}

function replaceComma(inputString) {

    /* replaceComma()________________________________________________________
    Changes number value string to German format                            */ 

    return (inputString != null ? inputString.toString().replace(/,/g , "__COMMA__").replace(/\./g, ',').replace(/__COMMA__/g, '.') : 0);
}

function urlDecode(inputString) {

    /* urlDecode()________________________________________________________
    Decodes PHP encoded url string                                       */
    
    return decodeURIComponent(inputString.replace(/\+/g, ' '));
}

