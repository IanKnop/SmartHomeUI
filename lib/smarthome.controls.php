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

            if (isset($Action->handle)) $NextFunction = $this->getHandleTree($Action->handle, $Control, $ControlProvider);
            else $NextFunction = null;
            
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

    public function getHandleTree($Handle, $Control, $ControlProvider) {

        /* getHandleTree()___________________________________________________________
        Returns parsed handle-functions following an initial action                 */

        $Adapter = @Util::val($Handle->adapter, 'internal');
        $Method = @Util::val($Handle->method, 'msg');
        
        $Payload = (isset($Handle->payload) ? Base::replaceProperties(json_encode($Handle->payload), $Control) : '{ }');
        
        if (isset($Handle->handle)) $NextFunction = $this->getHandleTree($Handle->handle, $Control, $ControlProvider);
        else $NextFunction = 'null';

        return 'function(response, adapter, refreshControl) { var payload = {}; payload.request = ' . $Payload . '; payload.response = response; sendRequest(\'' . $Adapter . '\', \'' . $Method . '\', payload, refreshControl, \'\', \'' . $ControlProvider . '\', ' . $NextFunction . '); }';                

    }
}
    

?>