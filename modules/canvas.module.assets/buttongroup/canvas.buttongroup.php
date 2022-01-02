<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Button Group (for Canvas)
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class ButtonGroup implements ICanvasControl {

    const DEFAULT_CONTROL_TYPE = 'switch';

    public $ParentModule = null;
    public function __construct($ParentModule) {

        /* __construct()____________________________________________________________*/

        $this->ParentModule = $ParentModule;
    }

    public function parseControl($Source, $Variant = null) {

        /* getProgressBar()_________________________________________________________
        Returns standard progress bar as canvas element                            */    

        $ControlClasses = (!isset($Source->classTarget) || $Source->classTarget == '' || (strtolower($Source->classTarget) == 'all' || strtolower($Source->classTarget) == 'control') ? @Util::val($Source->class, '', 'class="', '"') : '');
        $GroupClasses = (isset($Source->classTarget) && (strtolower($Source->classTarget) == 'all' || strtolower($Source->classTarget) == 'group') ? @Util::val($Source->class) : '');
        
        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup', 
            array(
                "style"     => Util::getStdStyles($Source), 
                "class"     => $ControlClasses,
                "header"    => Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.header', 
                    array(
                        "title"     => $Source->title, 
                        "visible"   => !isset($Source->hideTitle) || !$Source->hideTitle)),
                "content"   => isset($Source->controls) ? $this->getControls($Source, $GroupClasses) : '',
                "footer"    => isset($Source->footer) ? $this->getFooter($Source) : ''));
    }

    private function getControls($CanvasElement, $GroupClasses = '') {

        /* getControls()_____________________________________________________________
        Returns stack of controls for canvas element group                          */    

        $InnerHTML = ''; $ControlIndex = 0; $ControlCount = sizeof($CanvasElement->controls);
        foreach ($CanvasElement->controls as $Control) $InnerHTML .= $this->getControl($Control, $ControlIndex, $ControlCount);
        
        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.elements', 
            array(
                "content" => $InnerHTML,
                "classes" => $GroupClasses));
    }    

    private function getControl($Control, &$ControlIndex, $ControlCount) {
        
        /* getControl()______________________________________________________________
        Returns control                                                             */    
        
        // GENERAL PROPERTIES
        $ControlIndex++;
        $Properties = array(
            "id"                => @Util::val($Control->id, $this->getControlType($Control->type) . '-' . rand(1000000, 9999999)),
            "binding"           => @Util::val($Control->binding),
            "binding-provider"  => @Util::val($Control->bindingProvider, '', 'cc-provider="', '" '),
            "class"             => $this->getControlType($Control->type) . '-control ',
            "events"            => isset($Control->action) ? Base::getClickEvent(Base::replaceProperties($Control->action, $Control)) : '',
            "value"             => '',
            "styles"            => @Util::val($Control->styles),   
            "update"            => 'false'
        );

        // CONTROL SPECIFIC PROPERTIES
        switch ($this->getControlType($Control->type)) {

            case 'navigate':                
                $this->getNavigate($Control, $Properties); 

            case 'select': case 'switch':
                $this->getButton($Control, $ControlIndex, $ControlCount, $Properties); 
                break;
                
            case 'value':
                $this->getLabel($Control, $Properties); 
                break; 
        }
        
        // RETURN CONTROL BASED ON PROPERTIES
        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.controls/' . $this->getControlType($Control->type), $Properties);
    }
    
    private function getControlType($TypeId) {

        /* getControlType()__________________________________________________________
        Returns inner control type based on type name (i.e. text -> value)          */   

        if ($TypeId == 'text' || $TypeId == 'numeric' || $TypeId == 'date' || $TypeId == 'time' || $TypeId == 'html') return 'value';
        else if ($TypeId != '') return strtolower($TypeId);
        else return self::DEFAULT_CONTROL_TYPE;
    }

    private function getFooter($CanvasElement) {

        /* getFooter()_______________________________________________________________
        Returns footer for canvas element                                           */    

        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.footer', 
            array(
                "small"     => isset($CanvasElement->smallFooter) && $CanvasElement->smallFooter, 
                "content"   => $this->getFooterValues($CanvasElement)));
    }

    private function getFooterValues($CanvasElement) {

        /* getFooterValues()_________________________________________________________
        Returns values for canvas element footer                                    */  

        $ReturnValue = '';
        foreach ($CanvasElement->footer as $ValueSource) {

            $ReturnValue .= Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.footer-value', 
                array(
                    "id"          => @Util::val($ValueSource->id, 'footerValue-' . rand(1000,9999)),
                    "small"       => isset($CanvasElement->smallFooter) && $CanvasElement->smallFooter, 
                    "style"       => Util::getStdStyles($ValueSource),
                    "type"        => @Util::val($ValueSource->type, 'numeric'),
                    "prefix"      => @Util::val($ValueSource->prefix, '', 'cc-prefix="', '"'),
                    "suffix"      => @Util::val($ValueSource->suffix, '', 'cc-suffix="', '"'),
                    "decimals"    => @Util::val($ValueSource->decimals, '', 'cc-decimals="', '"'),
                    "offset"      => @Util::val($ValueSource->offset, '', 'cc-offset="', '"'),
                    "update"      => (isset($ValueSource->binding) && trim($ValueSource->binding) != '' ? 'cc-update="true"' : ''),
                    "binding"     => @Util::val($ValueSource->binding, '', 'cc-binding="', '"'),
                    "provider"    => @Util::val($ValueSource->bindingProvider, '', 'cc-provider="', '"')
                    ));
        }

        return $ReturnValue;
    }

    /* =========================================================
        BUTTON GROUP CONTROLS 
       ========================================================= */

    private function getButton($Control, $ControlIndex, $ControlCount, &$Properties) {

        /* getButton()_______________________________________________________________
        Returns properties for button in button group                               */  

        $Properties['class'] .= ($ControlCount == 1 ? 'single-button ' : Base::getEdgeValue($ControlIndex, $ControlCount, 'group-button-left ', 'group-button-center ', 'group-button-right '));
        
        if (isset($Control->class)) $Properties['class'] .= ' ' . $Control->class;

        $Properties = array_merge($Properties, array(
            "img"               => @Util::val($Control->img),
            "events"            => ($Properties['events'] == '' ? Base::getClickEvent('triggerSwitch(\'' . $Properties['binding'] . '\', this);') : $Properties['events']),
            "update"            => (strtolower($Control->type) == 'switch' ? 'true' : 'false'),
            "cc-true"           => @Util::val((is_array($Control->trueIf) ? htmlentities(json_encode($Control->trueIf)) : $Control->trueIf), '', 'cc-true="', '"'),
            "cc-color"          => @Util::val($Control->trueColor, '', 'cc-color="', '"'),
            "indicator-class"   => 'indicator ' . (isset($Control->trueColor) ? 'indicator-' . strtolower($Control->trueColor) : ''),
            "indicator-visible" => 'hidden'
        ));
    }

    private function getLabel($Control, &$Properties) {

        /* getLabel()________________________________________________________________
        Returns properties for label in button group (replacing button)             */  

        if (isset($Control->class)) $Properties['class'] .= ' ' . $Control->class;
        $Properties = array_merge($Properties, array(
            "update"            => (!isset($Control->binding) ? 'true' : 'true'),
            "style"             => @Util::val($Control->style, ''),
            "labelstyle"        => @Util::val($Control->labelstyle, ''),
            "labelclass"        => @Util::val($Control->labelclass, ''),
            "suffix"            => @Util::val($Control->suffix, '', 'cc-suffix="', '"'),
            "type"              => @Util::val($Control->type, 'numeric'),
            "prefix"            => @Util::val($Control->prefix, '', 'cc-prefix="', '"'),
            "decimals"          => @Util::val($Control->decimals, '', 'cc-decimals="', '"'),
            "value"             => @Util::val($Control->value, '', 'cc-value="', '"'),
            "formatvalue"       => (!isset($Control->binding) ? @Util::val($Control->value, '') : $this->ParentModule->getFormattedValue($Control->binding, @Util::val($Control->decimals, 0), @Util::val($Control->suffix), @Util::val($Control->prefix)))
        ));
    }

    private function getNavigate($Control, &$Properties) {

        /* getNavigate()_____________________________________________________________
        Returns properties for button with ability to open window with view content */  

        if (isset($Control->class)) $Properties['class'] .= ' ' . $Control->class;
        if (isset($Control->view) && (!isset($Control->view->target) || strtolower($Control->view->target) == 'self')) {

            // INSERT LINK TO OTHER VIEW
            $Properties['events'] = 'onclick="SmartHomeUI.showView(\'' . @Util::val($Control->view->source) . '\'' . Util::val($Control->view->variant, '', ', \'', '\'') . ')"';
            $Properties['windows'] = '';
        
        } else {

            // OPEN VIEW AS WINDOW
            $Window = new View($Control->view);

            $Properties['events'] = 'onclick="SmartHomeUI.openWindow(\'' . $Window->Id . '\');"';
            $Properties['windows'] = $Window->getView(@Util::val($Control->view->variant, null), 'window');
        }
    }

}
