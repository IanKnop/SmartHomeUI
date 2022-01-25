<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas Controls
   
    (C) 2022 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

interface ICanvasControl {

    /* =========================================================
        CANVAS CONTROL INTERFACE
        ========================================================= */

    public function parseControl($Source, $Variant = null);
        
}
    
class Control implements ICanvasControl {

    public function parseControl($Source, $Variant = null)
    {
    }

    public function getEventFromAction($Control, $CreateClickEvent = true) {

        /* getEventFromAction()______________________________________________________
        Returns JavaScript function for given property based action definition      */

        if (isset($Control->action) && !is_string($Control->action)) {
            
            $Action = $Control->action;
            $ControlProvider = isset($Control->controlProvider) ? $Control->controlProvider : 'canvas';

            $NextFunction = '';
            if (isset($Control->action->handle)) {

                $Response = $Control->action->handle;
                $Adapter = @Util::val($Response->adapter, 'internal');
                $Method = @Util::val($Response->method, 'msg');
                $Payload = (isset($Response->payload) ? Base::replaceProperties(json_encode($Response->payload), $Control) : '{ }');

                // GET CALL AND RESPONSE FUNCTION
                $NextFunction = 'function(response, adapter, refreshControl) { 
                    var payload = {}; payload.request = ' . $Payload . '; payload.response = response; sendRequest(\'' . $Adapter . '\', \'' . $Method . '\', payload, refreshControl); }';                
            }

            $Event = 'sendRequest(\'' . @Util::val($Action->adapter, 'internal') . '\', \'' . @Util::val($Action->method, 'trigger') . '\', ' . (isset($Action->payload) ? htmlentities(Base::replaceProperties(json_encode($Action->payload), $Control)) : '{ }') . ', this, \'' . @Util::val($Action->sound) . '\', \'' . @Util::val($ControlProvider) . '\', ' . htmlentities($NextFunction) . ');';
            if ($CreateClickEvent) return Base::getClickEvent($Event);
            else return $Event;


        } else if (isset($Control->action)) {

            if ($CreateClickEvent) return Base::getClickEvent(Base::replaceProperties($Control->action, $Control));
            else return Base::replaceProperties($Control->action, $Control);
        
        } else {

            return '';
        }
    }
}
    

?>