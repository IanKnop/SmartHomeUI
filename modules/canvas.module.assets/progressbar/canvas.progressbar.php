<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Progress Bar (for Canvas)
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class ProgressBar implements ICanvasControl {

    public $ParentModule = null;
    
    public function __construct($ParentModule) {

        /* __construct()____________________________________________________________*/

        $this->ParentModule = $ParentModule;
    }

    public function parseControl($Source, $Variant = null) {

        /* getProgressBar()_________________________________________________________
        Returns standard progress bar as canvas element                            */    

        return Views::parseTemplate('canvas', 'progressbar/templates/progressbar', array(
            "id"                => @Util::val($Source->id, 'progressbar-' . rand(1000,9999)),
            "style"             => Util::getStdStyles($Source),
            "bar"               => $this->drawProgressBar($Source, $Caption, $HasTitle),
            "show_title"        => $HasTitle,
            "show_value"        => (isset($Source->showValue) ? $Source->showValue : true),
            "action"            => @Util::val($Source->action),
            "update"            => (isset($Source->binding) ? 'true' : 'false'),
            "binding"           => @Util::val($Source->binding, '', 'cc-binding="', '"'),
            "bindingProvider"   => @Util::val($Source->bindingProvider, 'cc-provider="progressBar"', 'cc-provider="', '"'),
            "dataprovider"      => @Util::val($Source->dataprovider, '', 'cc-dataprovider="', '"'),
            "title"             => $Source->title,
            "caption"           => $Caption));
    }

    private function drawProgressBar($CanvasElement, &$Caption, &$SmallTitle) {

        /* drawProgressBar()_________________________________________________________
        Calculates progress bar value and returns bar and caption value             */    

        $this->calculateProgressBar($CanvasElement, $Value, $MaxValue, $Decimals);
        $Caption = number_format((floatval($Value / $MaxValue) * 100), $Decimals);

        return Views::parseTemplate('canvas', 'progressbar/templates/progressbar.inner', array(
            "header"        => $this->getProgressBarHeader($CanvasElement, $SmallTitle),
            "borderstyle"   => @Util::val($CanvasElement->borderStyle),
            "barstyle"      => @Util::val($CanvasElement->barStyle),
            "value"         => (floatval($Value / $MaxValue) * 100),
            "show_icon"     => (isset($CanvasElement->icon) && $CanvasElement->icon != ''),
            "icon"          => (isset($CanvasElement->icon) && $CanvasElement->icon != '') ? Base::getBGImage($CanvasElement->icon) : ''));
    }

    private function getProgressBarHeader($CanvasElement, &$SmallTitle) {

        /* getProgressBarHeader()____________________________________________________
        Returns header for progress bar element                                     */    

        $SmallTitle = false;
        if (!isset($CanvasElement->hideTitle) || $CanvasElement->hideTitle == false) {
            
            if (!isset($CanvasElement->smallTitle) || $CanvasElement->smallTitle == false) {
             
                return Views::parseTemplate('canvas', 'buttongroup/templates/buttongroup.header', array(
                    "visible" => true,
                    "title"   => $CanvasElement->title));
            }
            else {
                
                $SmallTitle = true;
                return '';
            }
        }
    }

    private function calculateProgressBar($CanvasElement, &$Value, &$MaxValue, &$Decimals) {

        /* calculateProgressBar()____________________________________________________
        Calculates progress bar base values                                         */    

        $Value = 0;

        $MaxValue = (isset($CanvasElement->maxValue) ?  $CanvasElement->maxValue : 100);
        $Decimals = (isset($CanvasElement->decimals) ? $CanvasElement->decimals : 0);

    }
}
?>