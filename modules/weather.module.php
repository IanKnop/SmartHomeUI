<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - DasWetter Modul (ioBroker) 
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class Weather extends Module implements IModule {

    const ICON_PORT = '8081';

    const MAX_TEMPERATURE = 'daswetter.0.NextDays.Location_1.Day_1.Maximale_Temperatur_value';
    const MIN_TEMPERATURE = 'daswetter.0.NextDays.Location_1.Day_1.Minimale_Temperatur_value';
    const DAY_NAME = 'daswetter.0.NextDays.Location_1.Day_1.Tag_value';
    const ICON_URL = 'daswetter.0.NextDays.Location_1.Day_1.iconURL';
    const WEATHER_TEXT = 'daswetter.0.NextDays.Location_1.Day_1.Wetter_Symbol_value';
    const WIND_TEXT = 'daswetter.0.NextDays.Location_1.Day_1.Wind_value';

    public function parseModule($Content = '', $Target = 'view.module') {

        /* parseModule()____________________________________________________________
        Returns weather module content as HTML                                     */     

        if (isset($this->Source->showWeatherTitle) && $this->Source->showWeatherTitle == false) $ShowTitle = false;
        else $ShowTitle = true;

        $Content .= Views::parseTemplate('weather', 'templates/widget', array(
                        "id"            => @Util::val($this->Id, rand(1000000, 9999999)),
                        "provider"      => @Util::val($this->Properties->bindingProvider, '', 'cc-provider="', '" '),
                        "max_temp"      => @Util::val($this->Properties->max_temp, ''),
                        "min_temp"      => @Util::val($this->Properties->min_temp, ''),
                        "day"           => @Util::val($this->Properties->day, ''),
                        "text"          => @Util::val($this->Properties->weather_text, ''),
                        "wind"          => @Util::val($this->Properties->wind_text, ''),
                        "showTitle"     => $ShowTitle,
                        "icon_style"    => (isset($this->Source->iconstyle) ? $this->Source->iconstyle : ''),
                        "temp_style"    => (isset($this->Source->tempstyle) ? $this->Source->tempstyle : ''),
                        "mintemp_style" => (isset($this->Source->mintempstyle) ? $this->Source->mintempstyle : ''),
                        "icon_url"      => @Util::val($this->Properties->icon_url, ''),
                        "icon_prefix"   => @Util::val($this->Properties->icon_url_prefix, ''),
                        "icon_suffix"   => @Util::val($this->Properties->icon_url_suffix, '')
                    ));

        return (strtolower($Target) == 'content' ? $Content : parent::parseModule($Content));
    }
}



?>
