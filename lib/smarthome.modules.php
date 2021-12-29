<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Module Parsing
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

interface IModule {
    
    public function initializeModule();
    public function parseModule($Content = '', $Target = 'view.module');

}

class Module implements IModule {

    const PRELOAD_DATAPOINTS = false;

    public $Id = null;
    public $Header = null;
    public $HideHeader = false;
    public $Name = null;
    public $Class = '';
    public $Style = '';
    public $Img = null;
    
    public $Start = null;
    public $End = null;
    
    public $Source = null;
    public $ViewSource = null;
    public $Variant = null;
    public $Properties = null;
    public $VariantProperties = null;
    public $Datapoints = array();

    public function __construct($ModuleSource, $Variant = null, $ViewSource = null) {

        /* __construct()____________________________________________________________*/

        /* SERIALIZE JSON TO OBJECT */
        $this->serializeObject($ModuleSource, $Variant, $ViewSource);

        /* SERIALIZE MODULE PROPERTIES */
        if (isset($ModuleSource->moduleProperties)) $this->Properties = $ModuleSource->moduleProperties;

        /* SPECIAL PROPERTY VALUES */
        if ($this->Properties != null) {
            
            /* EXTERNAL PROPERTIES */
            if (isset($this->Properties->__external)) {
                
                $InputSource = file_get_contents('config/' . $this->Properties->__external . '.json');

                /* VARIABLE VALUES FOR EXTERNAL PROPERTIES (ALTERATIVELY TO VARIANTS) */
                if (isset($this->Properties->__externalArgs)) {
                
                    foreach ($this->Properties->__externalArgs as $Key => $Var) {
                        $InputSource = str_replace('{{[' . $Key . ']}}', $Var, $InputSource); 
                    }
                }
                
                $this->Properties = json_decode($InputSource);
            }

            /* VARIANT PROPERTIES */
            $this->VariantProperties = $this->getVariantValue();
            /*if (isset($this->Properties->hasVariants) && $this->Properties->hasVariants = true && isset($this->Properties->{$Variant})) {
                $this->VariantProperties = $this->Properties->{$Variant};
            }*/
        }

        /* LOAD SOURCE EXTENSIONS */
        //if ($this->Name != '') Base::loadLibraries('modules/' . $this->Name . '.assets');
        if ($this->Name != '') $this->includeFiles('.php', 'php');
    }

    private function serializeObject($ModuleSource, $Variant, $ViewSource) {

        /* parseModule()____________________________________________________________
        Parses module content (override in inherited classes)                      */    

        $this->Id           = @Util::val($ModuleSource->id, rand(1000000, 9999999));
        $this->Name         = @Util::val($ModuleSource->module);
        $this->Source       = $ModuleSource;
        $this->Variant      = $Variant;
        $this->ViewSource   = $ViewSource;
        $this->Header       = @Util::val($ModuleSource->header);
        $this->HideHeader   = @Util::val($ModuleSource->hideHeader);
        $this->Img          = @Util::val($ModuleSource->img);
        $this->Class        = @Util::val($ModuleSource->class);
        $this->Conditions   = @Util::val($ModuleSource->conditions, null);
        $this->Style        = @Util::val($ModuleSource->style) . @Util::val($ModuleSource->styles);
        $this->Start        = @Util::val($ModuleSource->start);
        $this->End          = @Util::val($ModuleSource->end);
    }

    public function parseModule($Content = '', $Target = 'view.module') {

        /* parseModule()____________________________________________________________
        Parses module content (override in inherited classes)                      */    

        return Views::parseTemplate('__lib', $Target, 
            array(
                "id"            => $this->Id, 
                "class"         => $this->Class, 
                "style"         => $this->Style . 
                                   ($this->Start != null && $this->End != null ? Util::getGridValues($this->Start, $this->End) : '') . 
                                   ($Target == 'window' ? ' background: var(--module-gradient-opaque-r);' : '') . 
                                   ($this->Img != null ? ImageUtil::getBackgroundImage($this->Img, $this->Variant, 'var(--module-gradient)') : ''), 
                "conditions"    => ($this->Conditions != null ? 'cc-conditions="' . urlencode(json_encode($this->Conditions)) . '"' : ''),
                "has-header"    => ($this->Header != null && $this->Header != '' && !$this->HideHeader),
                "header"        => ($this->Header != null ? Util::getVariantValue($this->Header, $this->Variant, $this->ViewSource) : ''),
                "content"       => $Content));
    }

    public function initializeModule() {

        /* initializeModule()_______________________________________________________
        Initializes module (i.e. include external ressources)                      */    

        $this->includeFiles('.php', 'php', null, true);
        return $this->includeFiles('.js', 'script', null, true) . $this->includeFiles('.css', 'stylesheet', null, true);
    }

    public function includeFiles($FileSuffix = '.js', $ImplementAs = 'script', $BasePath = null, $IncludeSubFolder = false) {

        /* includeFiles()____________________________________________________________
        Includes files in module's asset folder (i.e. Scripts)                      */    

        $ReturnValue = '';

        if ($BasePath == null) $BasePath = 'modules/' . $this->Name . '.assets/';
        $AssetDirectory = scandir($BasePath);

        foreach ($AssetDirectory as $File) {
            
            $FullName = ($BasePath . (!Util::endsWith($BasePath, '/') ? '/' : '')  . $File);

            if (substr($File, strlen($File) - strlen($FileSuffix)) == $FileSuffix) {

                switch (strtolower($ImplementAs)) {

                    case 'js': case 'javascript': case 'script':
                        $ReturnValue .= '<script type="text/javascript" src="' . $FullName . '"></script>';
                        break;
                    case 'style': case 'stylesheet': case 'css':
                        $ReturnValue .= '<link rel="stylesheet" type="text/css" href="' . $FullName . '">';
                        break;
                    case 'php':
                        require_once($FullName);
                }

            } else if (is_dir($FullName) && $IncludeSubFolder && !Util::startsWith($File, '.')) {

                // INCLUDE SUB FOLDERS 
                $ReturnValue .= $this->includeFiles($FileSuffix, $ImplementAs, $FullName, true);

            }
        }

        return $ReturnValue;
    }

    public function getControlClass($ControlId, $Interface, $BasePath = 'modules/') {

        /* getControlClass()________________________________________________________
        Returns class of given control id                                          */     

        $SourceFile = $this->findModuleClass($ControlId, $BasePath);
        
        if ($SourceFile != null && file_exists($SourceFile)) {
            
            $ControlClasses = Util::getClasses($SourceFile, $Interface);
            
            if ($ControlClasses != null) return $ControlClasses[0];
            else return false;
        }

        return null;
    }

    public function findModuleClass($ControlId, $BasePath = 'modules/') {

        /* findModuleClass()_________________________________________________________
        Finds where module class file is located                                    */    

        $ReturnValue = null;
        $ModuleDirectory = scandir($BasePath);
        
        foreach ($ModuleDirectory as $File) {
                
            $FullName = ($BasePath . (!Util::endsWith($BasePath, '/') ? '/' : '')  . $File);

            if ($File == strtolower($ControlId) . '.php' || $File == 'canvas.' . strtolower($ControlId) . '.php') {

                $ReturnValue = $FullName;
                break;                
            }
            else if (is_dir($FullName) && !Util::startsWith($File, '.') && $this->findModuleClass($ControlId, $FullName) != null) {

                $ReturnValue = $this->findModuleClass($ControlId, $FullName);
                break;
            }
        }

        return $ReturnValue;
          
    }
    
    public function getValue($Datapoint, $BindingProvider = null, $ForceReload = false) {

        /* getValue()_______________________________________________________________
        Gets interface value from (preloaded) data if option is set                */    

        return '';

    }

    public function getVariantValue() {

        /* getVariantValue()____________________________________________________
        Returns value for given variant or first or only available value       */  

        return Util::getVariantValue($this->Properties, $this->Variant, $this->ViewSource);
    }

    public function getFormattedValue($Datapoint, $Decimals = 0, $Suffix = '', $Prefix = '', $ForceReload = false) {

        /* getFormattedValue()______________________________________________________
        Gets interface value as formatted number                                   */    

        return $Prefix . number_format(floatval($this->getValue($Datapoint, $ForceReload)), $Decimals, ',', '.') . $Suffix;
    }


}

class Modules {

    public static $LoadedModules = array();
    
    public static function getModuleClass($ModuleName, &$FirstLoad = false) {
                
        /* getModule()_____________________________________________________________
        Returns module by name as HTML                                            */     
        
        if ($ModuleName != null && $ModuleName != '') {

            $ReturnValue = '';
            $CurrentSource = dirname(__DIR__) . '/modules/' . $ModuleName . '.php';
            
            if (file_exists($CurrentSource)) {

                $ModuleClass = Util::getClass(dirname(__DIR__) . '/modules/' . $ModuleName . '.php', 'IModule'); 
                $FirstLoad = self::includeSources($ModuleName);
                return $ModuleClass;
          
            } else {
                
                /* Module source file not present. */
                return '';
            }
        }
        else return '';
    }

    private static function includeSources($ModuleName) {

        /* includeSources()________________________________________________________
        When module is loaded for the first time sources have to be included      */     

        $SourcesLoaded = false;
        if (array_search($ModuleName, self::$LoadedModules) === false) {

            /* LOAD MODULE FOR FIRST TIME */
            require_once(dirname(__DIR__) . '/modules/' . $ModuleName . '.php');
            array_push(self::$LoadedModules, $ModuleName);
            
            $SourcesLoaded = true;
        }

        return $SourcesLoaded;
    }
}
?>