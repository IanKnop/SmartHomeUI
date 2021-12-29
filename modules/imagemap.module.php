<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Image Map Module 
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class ImageMap extends Module implements IModule {

    public function parseModule($Content = '', $Target = 'view.module') {

        /* parseModule()____________________________________________________________
        Returns image map module content as HTML                                   */     
       
        $Content .= Views::parseTemplate('imagemap', 'templates/map', array(
            "image" => Util::getVariantValue($this->VariantProperties->img, $this->Variant, $this->ViewSource),
            "size"  => (isset($this->VariantProperties->size) ? $this->VariantProperties->size : '100% max(100%)'),
            "style" => Util::getStdStyles($this->VariantProperties),
            "areas" => $this->getAreas()));

        return parent::parseModule($Content);
    }

    private function getAreas($Variant = null) {

        /* getAreas()_______________________________________________________________
        Returns clickable areas as overlay for image map                           */    

        $ReturnValue = '';
        if (isset($this->VariantProperties->areas)) foreach ($this->VariantProperties->areas as $Area) {
            
            $ReturnValue .= Views::parseTemplate('imagemap', 'templates/area', array(
                "class" => (isset($Area->invokeVariant) && $Area->invokeVariant == $this->Variant ? ' imagemap-link-active' : ''),
                "style"  => Util::getStdStyles($Area),
                "events" => (isset($Area->invokeVariant) ? 'onmousedown="showVariant(\'' . $Area->invokeVariant . '\');"  ontouchstart="showVariant(\'' . $Area->invokeVariant . '\');"' : '')));
    
        }

        return $ReturnValue; 
    }
}



?>