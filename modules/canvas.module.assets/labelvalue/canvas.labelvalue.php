<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Label (for Canvas)
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class LabelValue extends Control implements ICanvasControl {

    public $ParentModule = null;
    
    public function __construct($ParentModule) {

        /* __construct()____________________________________________________________*/

        $this->ParentModule = $ParentModule;
    }

    public function parseControl($Source, $Variant = null) {

        /* getProgressBar()_________________________________________________________
        Returns standard progress bar as canvas element                            */    

        if (isset($Source->fixedValue)) $SourceValue = $Source->fixedValue;
        else $SourceValue = '';

        if (isset($Source->decimals)) $SourceValue = number_format(floatval($SourceValue), $Source->decimals);
        
        return Views::parseTemplate('canvas', 'labelvalue/templates/labelvalue', array(
            "id"            => @Util::val($Source->id, 'label-' . rand(1000000, 9999999)),
            
            "type"          => @Util::val($Source->valueType, 'text'),
            
            "title"         => (isset($Source->title) ? $Source->title : ''),
            "has-title"     => (isset($Source->title) && $Source->title != ''),
            
            "style"         => isset($Source->style) ? Util::getStdStyles(Util::getValueByScope($Source->style, 'control')) : '',
            "labelstyle"    => isset($Source->style) ? Util::getStdStyles(Util::getValueByScope($Source->style, 'label', false)) : '',
            "valuestyle"    => isset($Source->style) ? Util::getStdStyles(Util::getValueByScope($Source->style, 'value', false)) : '',
            
            "labelwidth"    => (isset($Source->labelWidth) ? $Source->labelWidth : '50%'),
            "valuewidth"    => (isset($Source->valueWidth) ? $Source->valueWidth : '50%'),

            "labelclass"    => isset($Source->class) ? Util::getValueByScope($Source->class, 'label', false) : '',
            "valueclass"    => isset($Source->class) ? Util::getValueByScope($Source->class, 'value', false) : '',
           
            "suffix"        => @Util::val($Source->suffix, '', 'cc-suffix="', '"'),
            "prefix"        => @Util::val($Source->prefix, '', 'cc-prefix="', '"'),
            "decimals"      => @Util::val($Source->decimals, '', 'cc-decimals="', '"'),
            "value"         => @Util::val(htmlentities($SourceValue), '', 'cc-value="', '"'),
            "formatvalue"   => $SourceValue . (isset($Source->suffix) ? $Source->suffix : ''),
            "raw-value"     => $SourceValue,
            
            "binding"       => @Util::val($Source->binding, '', 'cc-binding="', '"'),
            "provider"      => @Util::val($Source->bindingProvider, '', 'cc-provider="', '"'),
            "update"        => (isset($Source->binding) && $Source->binding != '' ? 'true': 'false'),

            "conditions"    => isset($Source->conditions) ? 'cc-conditions="' . htmlentities(json_encode($Source->conditions)) .  '"' : ''));
    }
}
?>