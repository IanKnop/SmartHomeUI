<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - ioBroker API Connector
   
    (C) 2020-2022 by Ian Knop, Weiterstadt, Germany
    www.knop.family

    For further information please visit
    https://github.com/IanKnop/shc
    ========================================================= */

/* LOAD BASE LIBRARY AND ADDITIONAL LIBS*/
require_once('lib/smarthome.base.php');
Base::loadLibraries();

/* CALL TYPE */
$InterfaceRequest = isset($_GET['request']);

/* ADAPTERS */
Base::loadLibraries('adapters/', !$InterfaceRequest);

/* REQUEST PROCESSING */
if (isset($_GET['request'])) {

    /* INTERFACE REQUESTS */
    $Response = new stdClass();
    switch (strtolower($_GET['request'])) {

        case 'module':
            $ModuleClass = $_GET['class'];

            /* Load module class and create new module object */
            require_once('modules/' . strtolower($ModuleClass) . '.module.php');
            $Module = new $ModuleClass(@Util::val($_GET['source']), @Util::val($_GET['variant']));

            /* Create Response */
            $Response->code = 200;
            $Response->message = urlencode($Module->parseModule('', 'content')); 
            break;
        
        default:
            $Response->code = 500;
            $Response->message = 'INTERFACE ERROR';
    }

    echo json_encode($Response);

} else {

    /* VIEW REQUESTS */
    Base::loadScripts();
    Base::loadStyles();

    $View = new View();
    echo Views::parseTemplate('__lib', 'page.header');
    echo $View->getViewById((isset($_GET['view']) ? $_GET['view'] : 'home'), (isset($_GET['variant']) ? $_GET['variant'] : null), false, (isset($_GET['source']) ? $_GET['source'] : ''));
}

?>