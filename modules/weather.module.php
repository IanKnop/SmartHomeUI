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
                        "showTitle"     => (isset($this->Source->showWeatherTitle) ? boolval($this->Source->showWeatherTitle) : true),            
                        "max_temp"      => @Util::val($this->VariantProperties->maxTempBinding, ''),
                        "min_temp"      => @Util::val($this->VariantProperties->minTempBinding, ''),
                        "day"           => @Util::val($this->VariantProperties->currentDayBinding, ''),
                        "weather"       => @Util::val($this->VariantProperties->weatherBinding, ''),
                        "wind"          => @Util::val($this->VariantProperties->windBinding, ''),
                        "temp_style"    => @Util::val($this->Source->tempStyle, ''),
                        "icon_style"    => @Util::val($this->Source->iconStyle, ''),
                        "mintemp_style" => @Util::val($this->Source->minTempStyle, ''),
                        "icon_url"      => @Util::val($this->VariantProperties->iconUrlBinding, ''),
                        "icon_prefix"   => @Util::val($this->VariantProperties->iconUrlPrefix, ''),
                        "icon_suffix"   => @Util::val($this->VariantProperties->iconUrlSuffix, '')
                    ));

        return (strtolower($Target) == 'content' ? $Content : parent::parseModule($Content));
    }
}



?>
