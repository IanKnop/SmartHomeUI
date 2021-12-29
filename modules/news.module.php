<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Tagesschau (Germany) News
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class News extends Module implements IModule {

    public $SourceUri = 'https://www.tagesschau.de/xml/rss2_https/';
    
    public function parseModule($Content = '', $Target = 'view.module') {

        /* parseModule()____________________________________________________________
        Returns news module content as HTML                                        */     

        $Source = simplexml_load_file($this->SourceUri); 
        $Newsfeed = '';
        
        foreach ($Source->channel->item as $Item) 
        {
            $Newsfeed .= Views::parseTemplate('news', 'templates/news', 
                            array(
                                "title"     => $Item->title, 
                                "teaser"    => substr($Item->description, 0, $this->getSentenceLength($Item->description)), 
                                "link"      => 'openNews(\'' . $Item->link . '\');'));
        }


        $Window = ''; /*new View($Control->view);
        $Properties['windows'] = $Window->getView(@Util::val($Control->view->variant, null), 'window');*/

        $Content .= Views::parseTemplate('news', 'templates/feed', 
            array(
                "window"    => $Window,
                "newsfeed"  => $Newsfeed));


        return (strtolower($Target) == 'content' ? $Content : parent::parseModule($Content));
    }

    function getSentenceLength($Input) 
    {
        /* getSentenceLength()______________________________________________________
        Shortens strings after first sentence                                      */    

        $SearchString = $Input;
        for ($Number = 1; $Number < 10; $Number++) $SearchString = str_replace($Number . '.', $Number . 'x', $SearchString);

        $SearchString = str_replace('!', '.', str_replace('?', '.', $SearchString));
        return (strpos($SearchString, '. ') > -1 ? strpos($SearchString, '. ') + 1 : strlen($Input));
    }
}



?>