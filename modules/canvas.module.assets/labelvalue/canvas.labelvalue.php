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
            "style"         => Util::getStdStyles($Source),
            "type"          => @Util::val($Source->valueType, 'text'),
            "labelstyle"    => (isset($Source->labelStyles) ? $Source->labelStyles : '') . (isset($Source->labelStyle) ? $Source->labelStyle : ''),
            "valuestyle"    => (isset($Source->valueStyles) ? $Source->valueStyles : '') . (isset($Source->valueStyle) ? $Source->valueStyle : ''),
            "has-title"     => (isset($Source->title) && $Source->title != ''),
            "labelwidth"    => (isset($Source->labelWidth) ? $Source->labelWidth : '50%'),
            "valuewidth"    => (isset($Source->valueWidth) ? $Source->valueWidth : '50%'),
            "update"        => (isset($Source->binding) && $Source->binding != '' ? 'true': 'false'),
            "binding"       => @Util::val($Source->binding, '', 'cc-binding="', '"'),
            "title"         => (isset($Source->title) ? $Source->title : ''),
            "raw-value"     => $SourceValue,
            "suffix"        => @Util::val($Source->suffix, '', 'cc-suffix="', '"'),
            "prefix"        => @Util::val($Source->prefix, '', 'cc-prefix="', '"'),
            "decimals"      => @Util::val($Source->decimals, '', 'cc-decimals="', '"'),
            "value"         => htmlentities($SourceValue),
            "formatvalue"   => $SourceValue . (isset($Source->suffix) ? $Source->suffix : '')));
    }
}
?>