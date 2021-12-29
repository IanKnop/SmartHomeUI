<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Canvas Module (i.e. Floorplan)
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

interface ICanvasControl {

    /* =========================================================
        CANVAS CONTROL INTERFACE
       ========================================================= */

    public function parseControl($Source, $Variant = null);
    
}

class Canvas extends Module implements IModule {

    /* =========================================================
        CANVAS
       ========================================================= */

    public function parseModule($Content = '', $Target = 'view.module') {

        /* parseModule()____________________________________________________________
        Returns canvas module content as HTML (i.e. showing a floorplan)           */     

        if (isset($this->Properties)) {
        
            $Properties = array(
                "id"        => @Util::val($this->Id, rand(1000000, 9999999)), 
                "style"     => @Util::val($this->VariantProperties->style),
                "content"   => $this->getCanvasElements());
            
            // IF IMAGE PRESENT "analyzeImage" RETURNS WIDTH AND HEIGHT
            if (ImageUtil::analyzeImage($this->VariantProperties, $ImageWidth, $ImageHeight)) {

                $Properties = array_merge($Properties, array(
                    "width"     => $ImageWidth,
                    "height"    => $ImageHeight,
                    "ratio"     => number_format($ImageWidth / $ImageHeight, 2),
                    "img"       => $this->VariantProperties->img,
                    "imgsize"   => @Util::val($this->VariantProperties->imgSize, '', 'background-size: ', ';')));

                $Properties['content'] = Views::parseTemplate('canvas', 'templates/background', $Properties);
            } 
            
            $Content .= Views::parseTemplate('canvas', 'templates/canvas', $Properties);
            return parent::parseModule($Content, $Target);
            
        } else return null;
    }

    /* =========================================================
        ELEMENT PARSING
       ========================================================= */

    private function getCanvasElements($MaxElementCount = null) {

        /* getCanvasElements()______________________________________________________
        Returns all canvas elements                                                */     

        $ReturnValue = '';
        if (isset($this->VariantProperties->canvasElements)) 
        foreach ($this->VariantProperties->canvasElements as $Control) {
            
            if ($MaxElementCount != null && $MaxElementCount == 0) break; 
            
            /* Parse Canvas Elements */
            $ControlClass = $this->getControlClass($Control->type, 'ICanvasControl', 'modules/canvas.module.assets/')['Class'];
            
            $ReturnValue .= (new $ControlClass($this))->parseControl($Control, $this->Variant);
            $MaxElementCount--;
        }

        return $ReturnValue;
    }
}
?>