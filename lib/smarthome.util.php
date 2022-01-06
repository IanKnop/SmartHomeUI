<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Utilities
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class Util
{

    public static function val($Input = null, $Alt = '', $Prefix = '', $Suffix = '', $AltPrefix = '', $AltSuffix = '')
    {

        /* val()______________________________________________________________
        Returns set value or alternative                                     */

        if (isset($Input) && $Input != null) {

            if (is_object($Input) || is_array($Input) || is_bool($Input)) return $Input;
            else if ($Input != '') return $Prefix . $Input . $Suffix;
        }

        return $AltPrefix . $Alt . $AltSuffix;
    }

    public static function attr($Input, $Name)
    {

        /* attr()_____________________________________________________________
        Returns HTML attribute if not empty                                  */

        if (isset($Input) && $Input != '') return @Util::val($Input, '', $Name . '="', '" ');
        else return '';
    }

    public static function attrs($SourceObject, $InputArray)
    {

        /* attrs()_____________________________________________________________
        Returns multiple HTML attributes                                      */

        $ReturnValue = '';
        foreach ($InputArray as $Source => $Target) {

            if (isset($SourceObject->{$Source})) $ReturnValue .= self::attr($SourceObject->{$Source}, $Target);
            else $ReturnValue .= '';
        }

        return $ReturnValue;
    }

    public static function startsWith($Haystack, $Needle)
    {
        /* startsWith()_______________________________________________________
        Checks if string starts with needle                                  */

        return (substr($Haystack, 0, strlen($Needle)) === $Needle);
    }

    public static function endsWith($Haystack, $Needle)
    {
        /* endsWith()_________________________________________________________
        Checks if string ends with needle                                    */

        return (substr($Haystack, -strlen($Needle)) === $Needle);
    }

    public static function stringContains($Haystack, $Needle)
    {
        /* stringContains()___________________________________________________
        Checks if string contains needle                                     */

        return (strpos($Haystack, $Needle) > -1);
    }

    public static function parseExpressions($Subject)
    {

        /* parseExpressions()___________________________________________________
        Parses text with standard expressions (i.e. date, time)                */

        $Subject = str_replace('{{[CURRENT_DATE_LONG]}}', '<div id="date_long_label_' . rand(1000000, 9999999) . '" cc-update="true" cc-provider="cc-internal" cc-binding="CURRENT_DATE_LONG">' . self::getDay(date('N')) . ', ' . date('j') . '. ' . self::getMonth(date('m')) . ' ' . date('Y') . '</div>', $Subject);
        $Subject = str_replace('{{[CURRENT_TIME]}}', '<div id="time_label_' . rand(1000000, 9999999) . '" cc-update="true" cc-provider="cc-internal" cc-binding="CURRENT_TIME">'  . date('H') . ':' . date('i') . '</div>', $Subject);
        return $Subject;
    }

    public static function parseValue($Source, $Decimals = null)
    {

        /* parseValue()_________________________________________________________
        Parses value and sets number format                                    */

        global $Adapter;

        $ReturnValue = (isset($Source) ? $Adapter->getValue($Source) : 0);
        if ($Decimals != null) $ReturnValue = number_format(floatval($ReturnValue), $Decimals, ',', '.');

        return $ReturnValue;
    }

    public static function getGridValues($Start, $End = null)
    {

        /* getGridValues()_____________________________________________________
        Returns CSS grid specification                                        */

        if ($End == null) $End = $Start;

        $ReturnValue = 'grid-row-start: ' . explode(';', $Start)[0] . '; grid-row-end: ' . (self::toNumeric(explode(';', $End)[0]) + 1) . '; ' .
            'grid-column-start: ' . explode(';', $Start)[1] . '; grid-column-end: ' . (self::toNumeric(explode(';', $End)[1]) + 1) . '; ';

        return $ReturnValue;
    }

    public static function getVariantValue($Object, $Variant = null, $ViewSource = null)
    {

        /* getVariantValue()____________________________________________________
        Returns value for given variant or first or only available value       */

        if ($Variant == null) {

            if (!is_object($Object)) return $Object;
            else {

                if (isset($Object->__external)) return json_decode(file_get_contents('config/' . $Object->__external . '.json'));
                else {

                    $FirstVariant = self::getFirstVariant($Object, (isset($ViewSource->variants) ? $ViewSource->variants : null));

                    if (isset($FirstVariant->__external)) return json_decode(file_get_contents('config/' . $FirstVariant->__external . '.json'));
                    else if ($FirstVariant == null) return $Object;
                    else return $FirstVariant;
                }
            }
        } else {

            if (isset($Object->{$Variant})) {
                if (isset($Object->{$Variant}->__external)) {
                    return json_decode(file_get_contents('config/' . $Object->{$Variant}->__external . '.json'));
                } else return $Object->{$Variant};
            } else {

                if (isset($Object->__external)) return json_decode(file_get_contents('config/' . $Object->__external . '.json'));
                else return $Object;
            }
        }
    }

    public static function getFirstVariant($Object, $AcceptList = null)
    {

        /* getFirstVariant()____________________________________________________
        Returns first variant of object property list                          */

        if ($AcceptList != null) {
            foreach ($AcceptList as $Variant) {
                if (isset($Object->{$Variant})) return $Object->{$Variant};
            }
        }

        /* If not found by Accept List, get first variant in order */
        if (isset($Object->hasVariants) && $Object->hasVariants)
            foreach ((array)$Object as $Key => $Value) if ($Key != 'hasVariants') return $Object->{$Key};

        /* No vairants found, return Object */
        return $Object;
    }

    public static function hasTags($SourceString)
    {
        /* hasTags()__________________________________________________________
        Checks if source string has tags                                     */

        return is_int(strpos($SourceString, "{{["));
    }

    public static function getTag($SourceString)
    {
        /* getTag()__________________________________________________________
        Gets complex value information from tag info                        */

        if (strpos($SourceString, "{{[") == -1) return $SourceString;
        else return substr($SourceString, strpos($SourceString, "{{["), strpos($SourceString, "]}}") - strpos($SourceString, "{{[") + 3);
    }

    public static function getMonth($Int)
    {

        /* getMonth()___________________________________________________________
        Gets name of given month in German                                     */

        switch ($Int) {

            case 1:
                return 'Januar';
            case 2:
                return 'Februar';
            case 3:
                return 'März';
            case 4:
                return 'April';
            case 5:
                return 'Mai';
            case 6:
                return 'Juni';
            case 7:
                return 'Juli';
            case 8:
                return 'August';
            case 9:
                return 'September';
            case 10:
                return 'Oktober';
            case 11:
                return 'November';
            case 12:
                return 'Dezember';
        }
    }

    public static function getDay($Int)
    {

        /* getDay()_____________________________________________________________
        Gets name of given day in German                                       */

        switch ($Int) {

            case 1:
                return 'Montag';
            case 2:
                return 'Dienstag';
            case 3:
                return 'Mittwoch';
            case 4:
                return 'Donnerstag';
            case 5:
                return 'Freitag';
            case 6:
                return 'Samstag';
            case 7:
                return 'Sonntag';
        }
    }

    public static function toNumeric($String)
    {

        return floatval(preg_replace("/[^0-9]/", "", $String));
    }

    public static function getValueByScope($ValueCollection, $Scope, $ReturnScopeless = true)
    {

        /* getValueByScope()__________________________________________________
        Returns value of key/value-list representing scope                   */

        if ($ValueCollection == null) return '';
        else if (is_string($ValueCollection)) return ($ReturnScopeless ? $ValueCollection : '');
        else if (isset($ValueCollection->{$Scope})) return $ValueCollection->{$Scope};
        else return '';
    }

    public static function getStdStylesByScope($Style, $Scope, $ReturnScopeless = true)
    {

        /* getStdStylesByScope()______________________________________________
        Returns styles with additional scope dimension                       */

        if (is_string($Style) && $ReturnScopeless) return $Style;
        else if (!is_string($Style) && isset($Style->{$Scope})) return self::getStdStyles(self::getValueByScope($Style, $Scope, $ReturnScopeless));
        else if (!is_string($Style) && isset($Style->style)) return self::getStdStylesByScope($Style->style, $Scope, $ReturnScopeless);
        else return '';
    }

    public static function getStdStyles($Style)
    {

        /* getStdStyles()_____________________________________________________
        Returns style string based on object with position and size          */

        if (is_string($Style)) {

            // IF STYLE IS SIMPLE STRING IT RETURNS COMPLETE STRING
            return $Style;

        } else {

            if (isset($Style->style) && !is_string($Style->style) && $Style->style != null) return self::getStdStyles($Style->style);
            else if (isset($Style->styles) && !is_string($Style->styles) && $Style->styles != null) return self::getStdStyles($Style->styles);
            else {

                return (isset($Style->height)   ? 'height: ' . $Style->height . '; ' : '')  .
                       (isset($Style->width)    ? 'width: ' . $Style->width . '; ' : '')  .
                       (isset($Style->top)      ? 'top: ' . $Style->top . '; ' : '') .
                       (isset($Style->bottom)   ? 'bottom: ' . $Style->bottom . '; ' : '') .
                       (isset($Style->right)    ? 'right: ' . $Style->right . '; ' : '') .
                       (isset($Style->left)     ? 'left: ' . $Style->left . '; ' : '') .
                       (isset($Style->align) && strtolower($Style->align) == 'left' ? 'left: 0; ' : '') .
                       (isset($Style->align) && strtolower($Style->align) == 'right' ? 'right: 0; ' : '') .
                       (isset($Style->style)    ? $Style->style . '; ' : '') .
                       (isset($Style->styles)   ? $Style->styles . '; ' : '');
            }
        }
    }

    public static function oppositeSide($Side)
    {

        /* oppositeSide()_____________________________________________________
        Returns opposide side's name of given side                           */

        switch (strtolower($Side)) {

            case 'top':
                return 'bottom';
            case 'bottom':
                return 'top';
            case 'left':
                return 'right';
            case 'right':
                return 'left';
        }

        return false;
    }

    public static function getClass($File, $Implements = '')
    {
        /* getClass()_________________________________________________________
        Returns first class name of getClasses function return list          */

        return self::getClasses($File, $Implements)[0]['Class'];
    }

    public static function getClasses($File, $Implements = '')
    {
        /* getClasses()_______________________________________________________
        Returns classes of source file (optional with specific implement)    */

        $ReturnValue = array();
        if (file_exists($File)) {
            $LastIndex = 0;
            $ReadLines = file_get_contents($File);

            while (strpos($ReadLines, 'class', $LastIndex) > 0) {
                $Class = self::findClass($ReadLines, $LastIndex);
                if ($Implements == '' || (isset($Class['Implements']) && $Class['Implements'] == $Implements)) array_push($ReturnValue, $Class);
            }
        }

        return $ReturnValue;
    }

    public static function findClass($Source, &$StartIndex = 0, $Terminators = array(' ', '\n', '\r', '%0D', '\r\n'))
    {
        /* findKeyword()_________________________________________________________
        Finds keyword in string and returns following expression                */

        $ReturnValue = array();
        $CurrentRead = '';
        $ReadsExpression = false;
        $FindImplements = false;
        $SkipExtends = false;

        for ($Index = strpos($Source, 'class', $StartIndex) + 5; $Index < strlen($Source); $Index++) {
            $StartIndex = $Index;

            if (sizeof($ReturnValue) == 2) break;
            else if (!$ReadsExpression && (!in_array($Source[$Index], $Terminators) && !in_array(urlencode($Source[$Index]), $Terminators))) $ReadsExpression = true;
            else if ($ReadsExpression && (in_array($Source[$Index], $Terminators) || in_array(urlencode($Source[$Index]), $Terminators))) {
                // COMPUTE READ WORD
                if (sizeof($ReturnValue) == 0) $ReturnValue['Class'] = $CurrentRead;
                else if (sizeof($ReturnValue) == 1 && $CurrentRead == 'implements') $FindImplements = true;
                else if (sizeof($ReturnValue) == 1 && $CurrentRead == 'extends') $SkipExtends = true;
                else if (sizeof($ReturnValue) > 0 && $FindImplements) $ReturnValue['Implements'] = $CurrentRead;
                else if (sizeof($ReturnValue) > 0 && !$FindImplements && !$SkipExtends) break;

                $ReadsExpression = false;
                $CurrentRead = '';
            }

            if ($ReadsExpression) $CurrentRead .= $Source[$Index];
        }

        return $ReturnValue;
    }

    public static function getSVGWidth($SVGSource)
    {

        /* getSVGWidth()____________________________________________________________
        Gets width of svg viewbox                                                  */

        if (isset($SVGSource->attributes()->viewBox)) return explode(' ', $SVGSource->attributes()->viewBox)[2];
        else return false;
    }

    public static function getSVGHeight($SVGSource)
    {

        /* getSVGHeight()___________________________________________________________
        Gets height of svg viewbox                                                 */

        if (isset($SVGSource->attributes()->viewBox)) return explode(' ', $SVGSource->attributes()->viewBox)[3];
        else return false;
    }

    public static function httpGetRequest($Url, $Fields, $Headers = null)
    {
        /* httpGetRequest()___________________________________________________
        Sends HTTP GET request to url and receives response                  */

        return self::httpPostRequest($Url, $Fields, $Headers, true);
    }

    public static function httpPostRequest($Url, $Fields, $Headers = null, $AsGetRequest = false)
    {
        /* httpPostRequest()__________________________________________________
        Sends HTTP POST request to url and receives response                 */

        if ($Fields != null) $FieldsString = http_build_query($Fields);
        $CurlRequest = curl_init();

        if ($AsGetRequest && $Fields != null) $Url .= '?' . $FieldsString;
        else if ($Fields != null) {
            curl_setopt($CurlRequest, CURLOPT_POST, count((array)$Fields));
            curl_setopt($CurlRequest, CURLOPT_POSTFIELDS, $FieldsString);
        }

        if ($Headers != null) curl_setopt($CurlRequest, CURLOPT_HTTPHEADER, $Headers);
        curl_setopt($CurlRequest, CURLOPT_URL, $Url);
        curl_setopt($CurlRequest, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($CurlRequest, CURLOPT_RETURNTRANSFER, true);

        return curl_exec($CurlRequest);
    }
}

class ImageUtil
{

    public static function getImage($VariantValue)
    {

        /* getImage()_______________________________________________________________
        Loads SVG image source and returns css background-image styles             */

        if (isset($VariantValue->img)) return simplexml_load_file($VariantValue->img);
        else return null;
    }

    public static function getBackgroundImage($ModuleImage, $Variant, $BackColor = null)
    {

        /* getImage()__________________________________________________________
        Returns HTML image tag for simple image integration                   */

        $SourceImage = null;
        if (isset($ModuleImage->hasVariants) && $ModuleImage->hasVariants == true) {

            if ($Variant != null) $SourceImage = $ModuleImage->{$Variant};
            else $SourceImage = Util::getFirstVariant($ModuleImage);
        } else if (isset($ModuleImage) && isset($ModuleImage->src)) $SourceImage = $ModuleImage;

        if ($SourceImage == null) return '';
        else return ('background-image: url(' . Util::val($SourceImage->src) . ')' . ($BackColor != null ? ', ' . $BackColor . '; ' : '; ') . (isset($SourceImage->position) ? 'background-position: ' . $SourceImage->position : 'background-position: center') . '; ' . (isset($SourceImage->repeat) ? 'background-repeat: ' . $SourceImage->repeat : 'background-repeat: no-repeat') . '; ' . (isset($SourceImage->size) ? 'background-size: ' . $SourceImage->size : '') . '; ' . (isset($SourceImage->styles) ? $SourceImage->styles . ';' : ''));
    }

    public static function analyzeImage($ImageSource, &$ImageWidth, &$ImageHeight)
    {

        /* analyzeImage()___________________________________________________________
        Tries to read from image file and return dimensions                        */

        if (!isset($ImageSource->img) || $ImageSource->img == null || $ImageSource->img == '') return false;
        else if (strtolower(substr($ImageSource->img, strlen($ImageSource->img) - 3)) == 'svg') {

            /* SVG-Images */
            $Source = self::getImage($ImageSource);
            $ImageWidth = number_format(Util::getSVGWidth($Source) / 100, 1);
            $ImageHeight = number_format(Util::getSVGHeight($Source) / 100, 1);

            return true;
        } else {

            $ImageInfo = getimagesize($ImageSource->img);
            $ImageWidth = number_format($ImageInfo[0] / 100, 1);
            $ImageHeight = number_format($ImageInfo[1] / 100, 1);

            return true;
        }
    }
}
