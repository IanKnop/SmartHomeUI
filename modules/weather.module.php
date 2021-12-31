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

        $Content .= Views::parseTemplate('weather', 'templates/widget', array(
                        "id"            => @Util::val($this->Id, rand(1000000, 9999999)),
                        "provider"      => @Util::val($this->VariantProperties->bindingProvider, '', 'cc-provider="', '" '),
                        "max_temp"      => @Util::val($this->VariantProperties->max_temp, ''),
                        "min_temp"      => @Util::val($this->VariantProperties->min_temp, ''),
                        "day"           => @Util::val($this->VariantProperties->day, ''),
                        "text"          => @Util::val($this->VariantProperties->weather_text, ''),
                        "wind"          => @Util::val($this->VariantProperties->wind_text, ''),
                        "showTitle"     => (!isset($this->VariantProperties->showWeatherTitle) || $this->VariantProperties->showWeatherTitle == true),
                        "icon_style"    => @Util::val($this->VariantProperties->iconstyle, ''),
                        "temp_style"    => @Util::val($this->VariantProperties->tempstyle, ''),
                        "mintemp_style" => @Util::val($this->VariantProperties->mintempstyle, ''),
                        "icon_url"      => @Util::val($this->VariantProperties->icon_url, ''),
                        "icon_prefix"   => @Util::val($this->VariantProperties->icon_url_prefix, ''),
                        "icon_suffix"   => @Util::val($this->VariantProperties->icon_url_suffix, '')
                    ));

        return (strtolower($Target) == 'content' ? $Content : parent::parseModule($Content));
    }
}



?>
