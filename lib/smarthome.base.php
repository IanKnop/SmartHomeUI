<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - General
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

require_once('lib/smarthome.util.php');

/*  =========================================================
     Settings (stored in JSON file)
    ========================================================= */

class Settings {
    
    public static $ConfigSource = 'config.json';
    public static $Source = null;

    public static function get($Id, $ForceReload = false) {

        /* get()_________________________________________________________________
        Gets value from config JSON file                                        */     
        
        if (self::$Source == null || $ForceReload) self::$Source = file_get_contents(self::$ConfigSource);
        return json_decode(self::$Source)->{$Id};
    }

    public static function has($Id, $ForceReload = false) {

        /* has()_________________________________________________________________
        Checks if config has certain property                                   */     

        if (self::$Source == null || $ForceReload) self::$Source = file_get_contents(self::$ConfigSource);
        return isset(json_decode(self::$Source)->{$Id});
    }
}

/*  =========================================================
     Extensions and Parsing
    ========================================================= */

class Base {    
    
    public static function loadLibraries($BasePath = 'lib/', $LoadScripts = false) {

        /* loadLibraries()_______________________________________________________
        Loads php-files in given directory                                      */     

        if (file_exists($BasePath)) {
            $AdaptersDirectory = scandir($BasePath);
            foreach ($AdaptersDirectory as $Adapter) {

                if (substr($Adapter, strlen($Adapter) - 3) == 'php' && $Adapter != 'smarthome.base.php' && $Adapter != 'smarthome.util.php') {
                    
                    require_once($BasePath . (!Util::endsWith($BasePath, '/') ? '/' : '') . $Adapter);

                }
            }
        }

        if ($LoadScripts) self::loadScripts($BasePath);
    }

    public static function loadScripts($BasePath = 'scripts/') {

        /* loadScripts()__________________________________________________________
        Loads JavaScript files in given directory                                */     

        if (file_exists($BasePath)) {

            $ScriptsDirectory = scandir($BasePath);
            foreach ($ScriptsDirectory as $Script) {
                
                if (substr($Script, strlen($Script) - 2) == 'js') 
                    echo '<script type="text/javascript" src="' . $BasePath . $Script . '"></script>';
            }
        }
    }

    public static function loadStyles($BasePath = 'styles/') {

        /* loadStyles()__________________________________________________________
        Loads CSS files in given directory                                      */     

        /* Theme */
        if ($BasePath == 'styles/' && Settings::get('theme') != null && Settings::get('theme') != '') self::prepareThemeCSS(Settings::get('theme'));

        /* Load all .css-files */
        if (file_exists($BasePath)) {

            $StylesDirectory = scandir($BasePath);
            foreach ($StylesDirectory as $Style) {
                
                if (substr($Style, strlen($Style) - 3) == 'css') 
                    echo '<link rel="stylesheet" type="text/css" href="' . $BasePath . $Style . '"></link>';
            }
        }
    }

    public static function prepareThemeCSS($ThemeId) {

        $ThemeFile = 'styles/smarthome.theme.' . strtolower($ThemeId) . '.css';
        if (file_exists($ThemeFile) == false) {
        
            $StylesDirectory = scandir('styles/');
            foreach ($StylesDirectory as $Style) {
                
                if (Util::startsWith($Style, 'smarthome.theme.')) {

                        if (Util::startsWith($Style, $ThemeFile)) {
                            
                            /* If previously deactivated the file is activated again (otherwise remains same) */
                            if (!file_exists($ThemeFile)) rename('styles/' . $Style, 'styles/' . $ThemeFile);
                            
                        } else {
                            
                            /* Deactivate CSS file */                            
                            if (!Util::endsWith($Style, '.deactivated')) rename('styles/' . $Style, 'styles/' . $Style . '.deactivated');
                        }
                }
            }
        }
    }

    public static function getGradients($From, $FromColor, $ToColor) {

        /* getGradients()_______________________________________________________
        Returns gradient values for different browsers                         */   

        return 'background: -moz-linear-gradient(' . $From . ', ' . $FromColor . ' 0%, ' . $ToColor . ' 100%); 
                background: -webkit-linear-gradient(' . $From . ', ' . $FromColor . ' 0%, ' . $ToColor . ' 100%);
                background: linear-gradient(to ' . Util::oppositeSide($From) . ', ' . $FromColor . ' 0%, ' . $ToColor . ' 100%);';
    }

    public static function includeStyles($ModuleName) {
        
        /* includeStyles()__________________________________________________________
        Returns standard style sheet include html5 command                         */ 
        
        return '<link rel="stylesheet" type="text/css" href="modules/' . strtolower($ModuleName) . '.module.assets/' . strtolower($ModuleName) . '.module.css">';
    }

    public static function getBGImage($Url) {
        
        /* getBGImage()_____________________________________________________________
        Returns standard style background image                                    */ 
        
        return 'background-image: url(' . $Url . '); background-repeat: no-repeat; background-position: center;';
    }

    public static function getClickEvent($Event, $SourceObject = null, $WithTouch = false) {
        
        /* getClickEvent()__________________________________________________________
        Returns HTML click events                                                  */ 
        
        return 'onclick="' . $Event . '"' . ($WithTouch ? ' ontouchstart="' . $Event . '"' : '');
    }

    public static function replaceProperties($SourceString, $Object) {

        /* replaceProperties()______________________________________________________
        Replaces placeholders for properties in config file strings                */ 

        while (strpos($SourceString, '{{[') != false) {

            $Start = strpos($SourceString, '{{[');
            $End = strpos($SourceString, ']}}') + 3;
            $Tag = substr($SourceString, $Start, $End - $Start);
            $Property = substr($SourceString, $Start + 3, ($End - $Start) - 6);

            if (isset($Object->{$Property})) $SourceString = str_replace($Tag, $Object->{$Property}, $SourceString);
        }

        return $SourceString; 
    }

    public static function getButtonColorClass($SpecialColor) {

        /* getButtonColorClass()____________________________________________________
        Returns css class for special colored buttons                              */ 

        switch (strtolower($SpecialColor)) {

                case 'green': return 'button-green';
                case 'orange': return 'button-orange';
        }

        return '';
    }

    public static function getEdgeValue($Index, $Count, $MinValue, $CenterValue, $MaxValue, $BaseValue = 1) {

        /* getEdgeValue()___________________________________________________________
        Returns values for beginning, center or end of lisitng                     */

        return ($Index == $BaseValue ? $MinValue : '') . ($Index > $BaseValue && $Index < $Count ? $CenterValue : '') . ($Index == $Count ? $MaxValue : '');
    }

    public static function debug($Name, $Source, $JSON = true) {

        /* debug()__________________________________________________________________
        Writes Data as JSON to debug file                                          */

        file_put_contents('debug/' . $Name . '.json', ($JSON ? json_encode($Source, JSON_UNESCAPED_UNICODE) : $Source));
    }

}

?>