/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Custom Functions
   
    (C) 2022 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

/* =========================================================
    CUSTOM SCRIPTS: HEATING PROFILES
   ========================================================= */
var HeatingProfiles = new function() {

    const PROFILE_NEVER = 'nie';

    this.getProfileName = function(weekdays, start, end, capitals = 0) {

        /* getProfileName()____________________________________________________
        Creates heating profile name based on settings                        */
    
        var daysValue = this.getDaysValue(weekdays);
        var returnValue = daysValue + (daysValue != PROFILE_NEVER ? ' (' + this.betweenTime(start, end) + ')' : '');

        if (capitals == 1) returnValue = returnValue.substring(0,1).toUpperCase() + returnValue.substring(1);
        else if (capitals == 2) returnValue = returnValue.toUpperCase();
        
        return returnValue;
    }
    
    this.getDaysValue = function (weekdays) {
    
        /* getDaysValue()______________________________________________________
        Get text representing the selected days                               */
    
        switch (weekdays) {
    
            case '0,1,2,3,4,5,6':                       return 'täglich';
            case '0,1,2,3,4':                           return 'wochentags';
            case '0,1,2,3': case '0,1,2': case '0,1':   return 'Wochenanfang';
            case '1,2,3': case '1,2': case '2,3':       return 'Wochenmitte';
            case '4,5,6': case '5,6':                   return 'Wochenende';
            case '0':                                   return 'montags';
            case '1':                                   return 'dienstags';
            case '2':                                   return 'mittwochs';
            case '3':                                   return 'donnerstags';
            case '4':                                   return 'freitags';
            case '5':                                   return 'samstags';
            case '6':                                   return 'sonntags';
            case '': case null: case undefined:         return PROFILE_NEVER;
            default:                                    return 'diverse Tage';
        }
    }

    this.betweenTime = function (start, end) {
    
        /* betweenTime()________________________________________________________
        Checks if value lies between given time of the day                     */
    
        var startHour = start.substring(0,2);
        var endHour = end.substring(0,2);
        var timeValue = '';
    
        if (startHour == endHour) {
            return 'ganztägig';
        }
        else if (startHour >= 6 && endHour <= 12 && endHour >= startHour) {
            return 'vormittags';
        }
        else if (startHour >= 6 && endHour <= 18 && endHour >= startHour) {
            return 'tagsüber';
        }
        else if (startHour >= 12 && endHour <= 18 && endHour >= startHour) {
            return 'nachmittags';
        }
        else if (startHour >= 16 && endHour <= 23 && endHour >= startHour) {
            return 'abends';
        }
        else if ((startHour >= 22 || (startHour >= 0 && startHour < 6)) && (endHour >= 22 || endHour < 6)) {
            return 'nachts';
        }
        else return this.getCombTimeExp(startHour, endHour);
    }
    
    this.getCombTimeExp = function (start, end) {
    
        /* getCombTimeExp()____________________________________________________
        Gets combined expression for further time frames                      */
    
        var startValue = '';
        if (start == 0) {
            startValue = 'Mitternacht';
        }
        else if (start >= 6 && start < 12) {
            startValue = 'morgens';
        }
        else if (start == 12) {
            startValue = 'Mittag';
        }
        else if (start >= 12 && start < 15) {
            startValue = 'mittags';
        }
        else if (start >= 15 && start < 19) { 
            startValue = 'nachmittags';
        }
        else if (start >= 19 && start <= 23) { 
            startValue = 'abends';
        }
        else if (start < 6) { 
            startValue = 'nachts';
        }
        
        var endValue = '';
        if (end == 0) { 
            endValue = 'Mitternacht';
        }
        else if (end >= 6 && end < 12) { 
            endValue = 'morgens';
        }
        else if (end == 12) { 
            endValue = 'Mittag';
        }
        else if (end >= 12 && end < 15) { 
            endValue = 'mittags';
        }
        else if (end >= 15 && end < 19) { 
            endValue = 'nachmittags';
        }
        else if (end >= 18 && end <= 23) { 
            endValue = 'abends';
        }
        else if (end < 6) { 
            endValue = 'nachts';
        }
        
        return startValue + ' - ' + endValue;
    }


}


