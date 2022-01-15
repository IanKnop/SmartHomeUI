<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Button Group (for Canvas)
   
    (C) 2021 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class ButtonGroup extends Control implements ICanvasControl
{

    const DEFAULT_CONTROL_TYPE = 'switch';

    public $ParentModule = null;
    public function __construct($ParentModule)
    {

        /* __construct()____________________________________________________________*/

        $this->ParentModule = $ParentModule;
    }

    public function parseControl($Source, $Variant = null)
    {

        /* parseControl()___________________________________________________________
        Returns button group as canvas element                                     */

        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup',
            array(

                /* Set canvas element classes and styles */
                "element-style"     => Util::getStdStyles($Source),
                "element-class"     => isset($Source->class) ? Util::getValueByScope($Source->class, 'element') : '',

                /* Parse button group control */
                "header"            => $this->getHeader($Source),
                "content"           => isset($Source->controls) ? $this->getControls($Source) : '',
                "footer"            => isset($Source->footer) ? $this->getFooter($Source) : ''
            )

        );
    }

    private function getControls($Source)
    {

        /* getControls()_____________________________________________________________
        Returns stack of controls for button group                                  */

        $InnerHTML = '';
        $ControlIndex = 0;
        foreach ($Source->controls as $Control) $InnerHTML .= $this->getControl($Control, $ControlIndex, sizeof($Source->controls));

        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.elements',
            array(
                "content"           => $InnerHTML,
                "group-class"       => (isset($Source->class) ? Util::getValueByScope($Source->class, 'group', false) : '')
            )
        );
    }

    private function getControl($Control, &$ControlIndex, $ControlCount)
    {

        /* getControl()______________________________________________________________
        Returns control                                                             */

        $ControlIndex++;
        $Properties =
            array(
                "id"                => @Util::val($Control->id, $this->getControlType($Control->type) . '-' . rand(1000000, 9999999)),
                "hasWindow"         => $Control->type == 'navigate',

                /* Set binding (Id) and binding provider (if set) */
                "binding"           => @Util::val($Control->binding, (isset($Control->bindingProvider) && $Control->bindingProvider == 'internal' ? '#' : '')),
                "binding-provider"  => @Util::val($Control->bindingProvider, 'cc-provider="internal"', 'cc-provider="', '" '),

                /* Set standard control class ([type]-class) and any additionally defined classes and styles */
                "control-provider"  => @Util::val($Control->controlProvider, 'canvas'),
                "control-class"     => $this->getControlType($Control->type) . '-control ' . 
                                       $this->getLocationBasedClasses($ControlCount, $ControlIndex) . 
                                       (isset($Control->class) ? Util::getValueByScope($Control->class, 'control') . ' ' : ''),

                "control-style"     => isset($Control->style) ? Util::getStdStylesByScope($Control->style, 'control', true) . ' ' : '',

                /* Set script events and update behaviour */
                "events"            => $this->getEventFromAction($Control),
                "update"            => 'false'
            );

        // RETURN CONTROL BASED ON PROPERTIES
        $this->getTypeBasedProperties($Control, $Properties, $ControlIndex, $ControlCount);

        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.controls/' . $this->getControlType($Control->type, true), $Properties);
    }

    private function getControlType($TypeId, $TemplateId = false)
    {
        /* getControlType()__________________________________________________________
        Returns inner control type based on type name (i.e. text -> value)          */

        if ($TypeId == 'text' || $TypeId == 'numeric' || $TypeId == 'date' || $TypeId == 'time' || $TypeId == 'shorttime' || $TypeId == 'html') return 'value';
        else if ($TemplateId && ($TypeId == 'button' || $TypeId == 'switch' || $TypeId == 'select' || $TypeId == 'navigate')) return 'button';
        else if ($TypeId != '') return strtolower($TypeId);
        else return self::DEFAULT_CONTROL_TYPE;
    }

    private function getHeader($CanvasElement)
    {

        /* getHeader()_______________________________________________________________
        Returns header for button group                                             */

        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.header',
            array(
                "title"     => @Util::val($CanvasElement->title, ''),
                "visible"   => (!isset($CanvasElement->hideTitle) && isset($CanvasElement->title)) || isset($CanvasElement->hideTitle) && !$CanvasElement->hideTitle
            )
        );
    }

    private function getFooter($CanvasElement)
    {

        /* getFooter()_______________________________________________________________
        Returns footer for canvas element                                           */

        return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.footer',
            array(
                "small"     => isset($CanvasElement->smallFooter) && $CanvasElement->smallFooter,
                "content"   => $this->getFooterValues($CanvasElement)
            )
        );
    }

    private function getFooterValues($CanvasElement)
    {

        /* getFooterValues()_________________________________________________________
        Returns values for canvas element footer                                    */

        $ReturnValue = '';
        foreach ($CanvasElement->footer as $ValueSource) {

            $ReturnValue .= Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.footer-value',
                array(
                    /* Set footer base information */
                    "id"                => @Util::val($ValueSource->id, 'footerValue-' . rand(1000, 9999)),
                    "binding"           => @Util::val($ValueSource->binding, '', 'cc-binding="', '"'),
                    "binding-provider"  => @Util::val($ValueSource->bindingProvider, '', 'cc-provider="', '"'),
                    "is-small"          => isset($CanvasElement->smallFooter) && $CanvasElement->smallFooter,
                    "value-style"       => Util::getStdStyles($ValueSource),
                    "type"              => @Util::val($ValueSource->type, 'numeric'),
                    "prefix"            => @Util::val($ValueSource->prefix, '', 'cc-prefix="', '"'),
                    "suffix"            => @Util::val($ValueSource->suffix, '', 'cc-suffix="', '"'),
                    "decimals"          => @Util::val($ValueSource->decimals, '', 'cc-decimals="', '"'),
                    "offset"            => @Util::val($ValueSource->offset, '', 'cc-offset="', '"'),
                    "update"            => (isset($ValueSource->binding) && trim($ValueSource->binding) != '' ? 'cc-update="true"' : '')
                )
            );
        }

        return $ReturnValue;
    }

    /* =========================================================
        BUTTON GROUP CONTROLS 
       ========================================================= */
    private function getTypeBasedProperties($Control, &$Properties, &$ControlIndex, $ControlCount)
    {

        /* getTypeBasedProperties()___________________________________________________
        Adds control specific properties to $Properties                             */

        switch ($this->getControlType($Control->type)) {

            case 'navigate':
                $this->getNavigate($Control, $Properties);

            case 'select':
            case 'switch':
            case 'button':
                $this->getButton($Control, $ControlIndex, $ControlCount, $Properties);
                break;
            
            case 'value':
                $this->getLabel($Control, $Properties);
                break;
        }
    }

    private function getLocationBasedClasses($ControlCount, $ControlIndex)
    {

        /* getLocationBasedClasses()_________________________________________________
        Returns classes based on position in button group (i.e. rounded corners)    */

        return ($ControlCount == 1 ? 'single-button ' : Base::getEdgeValue($ControlIndex, $ControlCount, 'group-button-left ', 'group-button-center ', 'group-button-right '));
    }

    private function getButton($Control, $ControlIndex, $ControlCount, &$Properties)
    {

        /* getButton()_______________________________________________________________
        Returns properties for button in button group                               */
        
        $ImageSource = (isset($Control->style->img) ? $Control->style->img : (isset($Control->img) ? $Control->img : ''));
        $Properties = array_merge($Properties,
            array(
                "img"               => @Util::val($ImageSource, '', 'background-image: url(', ');'),
                "text"              => @Util::val($Control->text),

                "value"             => @Util::val($Control->value, '', 'cc-value="', '"'),
                "value-key"         => @Util::val($Control->valueKey, '', 'cc-value-key="', '"'), 

                /* Set classes and styles for image and/or text content */
                "content-class"     => (isset($ImageSource) ? 'button-image ' : '') . (isset($Control->class) ? Util::getValueByScope($Control->class, 'content', false) : ''),
                "text-class"        => isset($Control->class) ? Util::getValueByScope($Control->class, 'text', false) : '',
                "image-class"       => isset($Control->class) ? Util::getValueByScope($Control->class, 'image', false) : '',

                "content-style"     => isset($Control->style) ? Util::getStdStyles(Util::getValueByScope($Control->style, 'content', true)) : '',
                
                /* Set script events and update behaviour */
                "events"            => ($Properties['events'] == '' ? Base::getClickEvent('triggerSwitch(\'' . $Properties['binding'] . '\', this);') : $Properties['events']),
                "update"            => (isset($Control->update) ? $Control->update : 'true'),
                
                /* Set axtivation behaviour and indicator style */
                "cc-true"           => @Util::val((is_array($Control->trueIf) ? htmlentities(json_encode($Control->trueIf)) : $Control->trueIf), '', 'cc-true="', '"'),
                "cc-color"          => @Util::val($Control->trueColor, '', 'cc-color="', '"'),
                "indicator-class"   => 'indicator ' . (isset($Control->trueColor) ? 'indicator-' . strtolower($Control->trueColor) : ''),
                "indicator-visible" => 'hidden'
            )
        );
    }

    private function getLabel($Control, &$Properties)
    {

        /* getLabel()________________________________________________________________
        Returns properties for label in button group (replacing button)             */

        $Properties = array_merge($Properties,
            array(
                /* Set value type and systematic */
                "type"              => @Util::val($Control->type, 'numeric'),
                "value"             => @Util::val($Control->value, '', 'cc-value="', '"'),
                "value-key"         => @Util::val($Control->valueKey, '', 'cc-value-key="', '"'),
                "min"               => @Util::val($Control->min, '', 'cc-min="', '"'),
                "max"               => @Util::val($Control->max, '', 'cc-max="', '"'),
                "suffix"            => @Util::val($Control->suffix, '', 'cc-suffix="', '"'),
                "prefix"            => @Util::val($Control->prefix, '', 'cc-prefix="', '"'),
                "decimals"          => @Util::val($Control->decimals, '', 'cc-decimals="', '"'),
                "format-value"      => @Util::val((isset($Control->decimals) ? number_format($Control->value, $Control->decimals, ',', '.') : $Control->value), '', @Util::val($Control->prefix), @Util::val($Control->suffix)),

                /* Set classes and styles for label */
                "content-class"     => isset($Control->class) ? Util::getValueByScope($Control->class, 'content', false) : '',
                "content-style"     => isset($Control->style) ? Util::getStdStyles(Util::getValueByScope($Control->style, 'content', false)) : '',
                "update"            => (!isset($Control->binding) ? 'true' : 'true')
            )
        );
    }

    private function getNavigate($Control, &$Properties)
    {

        /* getNavigate()_____________________________________________________________
        Returns properties for button with ability to open window with view content */

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
