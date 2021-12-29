<?php
/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - Media Container (for Canvas)
   
    (C) 2020 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

class MediaContainer implements ICanvasControl {

    public $ParentModule = null;
    
    public function __construct($ParentModule) {

        /* __construct()____________________________________________________________*/

        $this->ParentModule = $ParentModule;
    }

    public function parseControl($Source, $Variant = null) {

        /* getProgressBar()_________________________________________________________
        Returns standard progress bar as canvas element                            */    

        return Views::parseTemplate('canvas', 'mediacontainer/templates/mediacontainer', array(
            "style"      => 'align-self: start; ' . Util::getStdStyles($Source),
            "media"      => $this->getMedia($Source, $Variant)));
    }

    private function getMedia($Source, $Variant = null) {

        /* getMedia()_______________________________________________________________
        Returns standard progress bar as canvas element                            */
        
        $MediaType = @Util::val($Source->mediaType, 'image');
        switch (strtolower($MediaType)) {

            case 'image':
                return $this->getImage($Source, $Variant);
            case 'video':
                return $this->getVideo($Source, $Variant);
        }

        return '';
    }

    private function getImage($Source, $Variant = null) {

        /* getImage()_______________________________________________________________
        Returns image                                                              */
        
        return Views::parseTemplate('canvas', 'mediacontainer/templates/mediacontainer.image', array(
            "id"                => @Util::val($Source->id, 'media-image-' . rand(1000, 9999)),
            "style"             => @Util::val($Source->mediaStyle),
            "src"               => (isset($Source->img) ? Util::getVariantValue($Source->img, $Variant) : ''),
            "class"             => @Util::val($Source->class),
            "action"            => @Util::val($Source->action),
            "update"            => (isset($Source->binding) ? 'true' : 'false'),
            "binding"           => @Util::val($Source->binding, '', 'cc-binding="', '"'),
            "provider"          => @Util::val($Source->bindingProvider, 'cc-provider="media"', 'cc-provider="', '"'),
            "dataprovider"      => @Util::val($Source->dataProvider, '', 'cc-dataprovider="', '"')));
    }

    private function getVideo($Source, $Variant = null) {

        /* getVideo()_______________________________________________________________
        Returns video control                                                      */
        
        return Views::parseTemplate('canvas', 'mediacontainer/templates/mediacontainer.video', array(
            "id"            => @Util::val($Source->id, 'media-video-' . rand(1000, 9999)),
            "style"         => @Util::val($Source->mediaStyle),
            "src"           => (isset($Source->src) ? 'src="' . Util::getVariantValue($Source->src, $Variant) . '"' : ''),
            "class"         => @Util::val($Source->class),
            "action"        => @Util::val($Source->action),
            "update"        => (isset($Source->binding) ? 'true' : 'false'),
            "binding"       => @Util::val($Source->binding, '', 'cc-binding="', '"'),
            "provider"      => @Util::val($Source->bindingProvider, 'cc-provider="media"', 'cc-provider="', '"'),
            "dataprovider"  => @Util::val($Source->dataProvider, '', 'cc-dataprovider="', '"')));
    }
}
?>