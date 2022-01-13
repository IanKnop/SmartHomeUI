<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas List
   
    (C) 2022 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

    class CanvasList extends Control implements ICanvasControl
    {
    
        public $ParentModule = null;
        public function __construct($ParentModule)
        {
    
            /* __construct()____________________________________________________________*/
    
            $this->ParentModule = $ParentModule;
        }
    
        public function parseControl($Source, $Variant = null)
        {
            /* parseControl()___________________________________________________________
            Returns list as canvas element                                     */
    
            return Views::parseTemplate('canvas', 'list/templates/list',
                array(
    
                    "id"            => @Util::val($Source->id, rand(1000000, 9999999)),

                    /* Set canvas element classes and styles */
                    "element-style"     => Util::getStdStylesByScope($Source->style, 'element', true),
                    "element-class"     => isset($Source->class) ? Util::getValueByScope($Source->class, 'element') : '',

                    "style-table"       => Util::getStdStylesByScope($Source->style, 'table', false),
                    "style-row"         => Util::getStdStylesByScope($Source->style, 'row', false),
                    "style-cell"        => Util::getStdStylesByScope($Source->style, 'cell', false),
                    "style-header"      => Util::getStdStylesByScope($Source->style, 'header', false),

                    "binding"           => @Util::val($Source->binding, (isset($Source->bindingProvider) && $Source->bindingProvider == 'internal' ? '#' : '')),
                    "binding-provider"  => @Util::val($Source->bindingProvider, 'cc-provider="internal"', 'cc-provider="', '" '),

                    "action"            => @Util::val(htmlentities(json_encode($Source->action))), // $this->getEventFromAction($Source, false),
                    "update"            => @Util::val($Source->update, 'true')


                )
    
            );
        }
    }
?>