<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Favorite Buttons Control 
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class Favorites implements ICanvasControl {

    public $ParentModule = null;
    
    public $GridCols = 2;
    public $GridRows = 3;
    
    public function __construct($ParentModule) {

        /* __construct()____________________________________________________________*/

        $this->ParentModule = $ParentModule;
    }

    public function parseControl($Source, $Variant = null) {

        /* parseModule()____________________________________________________________
        Returns favorite buttons module content as HTML                            */     

        if (isset($Source->buttons)) {

            $this->GridRows = isset($Source->gridRows) ? $Source->gridRows : $this->GridRows;
            $this->GridCols = isset($Source->gridColumns) ? $Source->gridColumns : $this->GridCols;

            return Views::parseTemplate('canvas', 'favorites/templates/favorite.group', array(
                    "rows"      => 'repeat(' . floatval($this->GridRows) . ', 1fr)',
                    "cols"      => 'repeat(' . floatval($this->GridCols) . ', 1fr)',
                    "class"     => @Util::val($Source->class),
                    "style"     => @Util::val($Source->style),
                    "buttons"   => $this->getFavButtons(Util::getVariantValue($Source->buttons, $Variant))));
        }
    }

    private function getFavButtons($SourceObject) {

        /* getFavButtons()__________________________________________________________
        Returns all favorite buttons                                               */

        $ReturnValue = '';
        for ($Row = 1; $Row <= $this->GridRows; $Row++) 
            for ($Col = 1; $Col <= $this->GridCols; $Col++) {

                $ArrayIndex = ($Row + $Col - ($this->GridCols - $Row)) - 1;
                
                if (isset($SourceObject[$ArrayIndex])) $ButtonSource = $SourceObject[$ArrayIndex];
                else $ButtonSource = null;

                $ReturnValue .= $this->getFavButton($Row, $Col, $ButtonSource);
            }

        return $ReturnValue;
    }

    private function getFavButton($Row, $Col, $ButtonSource = null) {

        /* getFavButton()___________________________________________________________
        Returns favorite button for current module as HTML                         */    

        return Views::parseTemplate('canvas', 'favorites/templates/favorite.button', array(
            "row"       => $Row,
            "col"       => $Col,
            "action"    => @Util::val($ButtonSource->action),
            "class"     => 'fav-button border ' . $this->getButtonClasses($Row, $Col, $ButtonSource),
            "style"     => @Util::val($ButtonSource->style),
            "img"       => (isset($ButtonSource->img) ? Base::getBGImage($ButtonSource->img) : ''),
            "title"     => ($ButtonSource != null ? $ButtonSource->title : '')));
    }

    private function getButtonClasses($Row, $Col, $ButtonSource) {

        /* getButtonClasses()_______________________________________________________
        Returns button class based on grid position                                */   

        return $this->getLocationBasedClass($Row, $Col) . ' ' .
               (isset($ButtonSource->specialColor) ? Base::getButtonColorClass($ButtonSource->specialColor) : '') . ' ' .
               ($ButtonSource == null ? 'inactive' : '');
    }

    private function getLocationBasedClass($Row, $Col) {

        /* getLocationBasedClass()__________________________________________________
        Returns button class based on grid position                                */   

        return Base::getEdgeValue($Row, $this->GridRows, 
                Base::getEdgeValue($Col, $this->GridCols, 'rounded-top-left', '', 'rounded-top-right'),
                Base::getEdgeValue($Col, $this->GridCols, 'fav-button-middle', 'fav-button-middle', 'fav-button-middle'),
                Base::getEdgeValue($Col, $this->GridCols, 'fav-button-bottom rounded-bottom-left', 'fav-button-bottom', 'fav-button-bottom rounded-bottom-right'));
    }

}
?>