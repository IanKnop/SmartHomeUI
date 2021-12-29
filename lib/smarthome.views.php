<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - View Parsing
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class Views {

    public static function parseTemplate($ModuleId, $Id, $Args = null)
    {
        /* parseTemplate()_____________________________________________________
        Reads and parses a HTML-Templates                                     */ 

        if ($ModuleId == '__lib') $SourceFile = 'lib/assets/' . strtolower($Id) . '.html';
        else $SourceFile = 'modules/' . strtolower($ModuleId) . '.module.assets/' . strtolower($Id) . '.html';

        if (file_exists($SourceFile))
        {
            $MaxIterations = 1000; $Iterations = 0;
            $ReturnValue = Util::parseExpressions(file_get_contents($SourceFile));

            while (Util::stringContains($ReturnValue, '{{['))
            {
                $Expression = substr($ReturnValue, strpos($ReturnValue, '{{[') + 3, strpos($ReturnValue, ']}}') - strpos($ReturnValue, '{{[') - 3);
                if (Util::startsWith(strtoupper($Expression), 'TEMPLATE:'))
                {
                    // INCLUDE EXTERNAL TEMPLATE
                    $ReturnValue = str_replace('{{[' . $Expression . ']}}', self::parseTemplate($ModuleId, substr($Expression, 9), $Args), $ReturnValue);    
                }
                else if (Util::startsWith(strtoupper($Expression), 'IF:'))
                {
                    // {{[IF:VAR:RETURN_STRING]}}
                    $ArgProperty = explode(':', $Expression)[1];
                    $Value = substr($Expression, strpos($Expression, ':', strpos($Expression, $ArgProperty) - 1) + strlen($ArgProperty) + 2);

                    if (isset($Args[$ArgProperty]) && ($Args[$ArgProperty] == true || $Args[$ArgProperty] == 1 || $Args[$ArgProperty] == "1" || strtolower($Args[$ArgProperty]) == 'true')) {
                        
                        // RENAMING TAGS INSIDE OF IF-CLAUSE FROM '{[...]}' TO '{{[...]}}'
                        $ReturnValue = str_replace('{{[' . $Expression . ']}}', str_replace('{[', '{{[', str_replace(']}', ']}}', $Value)), $ReturnValue);    
                    } else {

                        // FALSE
                        $ReturnValue = str_replace('{{[' . $Expression . ']}}', '', $ReturnValue);    
                    }
                }
                else
                {
                    // SIMPLE {{[...]}}
                    $ReturnValue = str_replace('{{[' . $Expression . ']}}', (isset($Args[$Expression]) ? $Args[$Expression] : ''), $ReturnValue);    
                }

                $Iterations++;
                if ($Iterations >= $MaxIterations) break;
            }

            return $ReturnValue;
        }
        else return '';
    }
}

class View {

    public $Id = null;
    public $ViewSource = null;
    public $Variant = null;
    public $Extension = false;

    public function __construct($ViewSource = null) {

        /* __construct()____________________________________________________________*/
        if (isset($ViewSource->__external)) $ViewSource = $this->getViewSource($ViewSource->__external, true, @Util::val($ViewSource->__externalArgs, null));
        if (isset($ViewSource->__internal)) $ViewSource = $this->getViewSource($ViewSource->__internal, false, @Util::val($ViewSource->__internalArgs, null));
        
        $this->ViewSource = $ViewSource;
        
        if (isset($ViewSource->id)) $this->Id = $ViewSource->id;
    }

    public function getView($Variant = null, $Target = 'view') {
                
        /* getView()_____________________________________________________________
        Draws a view as defined in configuration file                           */     

        return Views::parseTemplate('__lib', $Target, 
                array(
                    "id"           => $this->ViewSource->id, 
                    "columns"      => 'repeat(' . floatval(Settings::get('viewGridColumns')) . ', 1fr)', 
                    "rows"         => 'repeat(' . floatval(Settings::get('viewGridRows')) . ', 1fr)', 
                    "header"       => $this->getHeader(),
                    "modules"      => $this->getModules($Variant, null, false, $Target),
                    "lock-modules" => ($Target == 'view' && Settings::has('lockModules') ? $this->getModules($Variant, Settings::get('lockModules')) : '')
                )
            );
    }

    public function getViewById($ViewId, $Variant = null, $Extension = false, $ConfigSource = '') {
        
        /* getViewById()_________________________________________________________
        Finds view by Id and returns it                                         */       

        $this->Id           = isset($this->ViewSource->id) ? $this->ViewSource->id : 'view-' . rand(1000000, 9999999);

        $this->ConfigSource = $ConfigSource;
        Settings::$ConfigSource = 'config' . ($ConfigSource != '' ? '.' . $ConfigSource : '') . '.json';

        $this->ViewSource   = $this->getViewSource($ViewId, $Extension);
        $this->Variant      = $Variant;
        $this->Extension    = $Extension;
        
        return $this->getView($Variant);
    }

    public function getViewSource($ViewId, $Extension = false, $Args = null) {

        /* getViewSource()_______________________________________________________
        Returns view source either form config or extension                     */    

        if ($Extension) $Source = file_get_contents('views/' . $ViewId . '.json');
        else {
            
            $Source = Settings::get('views')[$this->getViewIndex($ViewId)];
            
            /* LOAD EXTERNAL SOURCE IF PRESENT */
            if (isset($Source->__external)) {
            
                $ExternalSource = json_decode(file_get_contents('views/' . $Source->__external . '.json'));
                $Source = (object)array_merge((array)$Source, (array)$ExternalSource);
            }
            
            $Source = json_encode($Source);
        }

        if ($Args != null) foreach ($Args as $Key => $Var) $Source = str_replace('{{[' . $Key . ']}}', $Var, $Source); 
        return json_decode($Source);
    }

    public function getViewIndex($ViewId, $StartCount = 0) {

        /* getViewIndex()________________________________________________________
        Gets array index of view with given name                                */ 

        foreach (Settings::get('views') as $View) {
            if (strtolower($View->id) == strtolower($ViewId)) return $StartCount;
            else $StartCount++;
        }
        return 0;
    }

    /* =========================================================
        HEADER
       ========================================================= */
    
    private function getHeader() {

        /* getHeader()__________________________________________________________
        Gets header of given view as HTML                                      */     

        $ViewHeader = isset($this->ViewSource->header) ? $this->ViewSource->header : '';

        return Views::parseTemplate('__lib', 'view.header', 
        array(
            "title"       => Util::parseExpressions(Settings::get('header')), 
            "subtitle"    => Util::parseExpressions($ViewHeader), 
            "style"       => Util::getGridValues(Settings::get('headerStart'), Settings::get('headerEnd')), 
            "buttons"     => $this->getHeaderButtons()));
    }
    
    private function getHeaderButtons() {

        /* getHeaderButtons()___________________________________________________
        Returns "bar" of buttons in header area to switch views                */     

        $ReturnValue = '';
        foreach (Settings::get('views') as $View) if (isset($View->img) && $View->img != null && $View->img != '') {
            $ReturnValue .= '<div class="view-button" onmousedown="showView(\'' . $View->id . '\')"><img src="' . $View->img . '" class="view-button-icon"/></div>';
        }
        
        return $ReturnValue;
    }

    /* =========================================================
        MODULE PARSING
       ========================================================= */

    public function getModules($Variant = null, $Base = null, $SkipInitialization = false, $Target = 'view') {

        /* getModules()_________________________________________________________
        Parses all modules of given view as HTML                               */     

        $ReturnValue = '';
        if ($Base != null || ($Base == null && isset($this->ViewSource->modules))) {

            if ($Base == null) $Base = $this->ViewSource->modules;
            foreach ($Base as $ModuleSource) {
                
                $FirstLoad = false;
                if (isset($ModuleSource->module)) {

                    $ModuleClass = Modules::getModuleClass($ModuleSource->module, $FirstLoad);
                    $Module = new $ModuleClass($ModuleSource, $Variant, $this->ViewSource);

                } else if (isset($ModuleSource->img)) {
                    
                    $Module = new Module($ModuleSource, $Variant, $this->ViewSource);
                }

                if ($FirstLoad && !$SkipInitialization) $ReturnValue .= $Module->initializeModule();
                $ReturnValue .= $Module->parseModule();
            }
 
            return $ReturnValue;
        }
    }
}   
