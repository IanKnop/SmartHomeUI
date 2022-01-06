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

    public function getEventFromAction($Control) {

        /* getEventFromAction()______________________________________________________
        Returns JavaScript function for given property based action definition      */

        if (isset($Control->action) && !is_string($Control->action)) {
            
            $Action = $Control->action;
            return Base::getClickEvent('sendRequest(\'' . @Util::val($Action->adapter) . '\', \'' . @Util::val($Action->method, 'trigger') . '\', ' . (isset($Action->payload) ? htmlentities(Base::replaceProperties(json_encode($Action->payload), $Control)) : '{ }') . ', this, \'' . @Util::val($Action->sound) . '\');');

        } else if (isset($Control->action)) {

            return Base::getClickEvent(Base::replaceProperties($Control->action, $Control));
        
        } else {

            return '';
        }
    }
}
    

?>