spacialistApp.service('langService', ['$translate', function($translate) {
    var lang = {};

    lang.availableLanguages = {
        de: {
            label: 'Deutsch',
            flagCode: 'de'
        },
        en_UK: {
            label: 'English (UK)',
            flagCode: 'gb'
        },
        en_US: {
            label: 'English (US)',
            flagCode: 'us'
        },
        fr: {
            label: 'Français',
            flagCode: 'fr'
        },
        it: {
            label: 'Italiano',
            flagCode: 'it'
        },
        es: {
            label: 'Español',
            flagCode: 'es'
        }
    };

    setInitLanguage();

    function setInitLanguage() {
        updateLanguage($translate.resolveClientLocale());
    }

    function updateLanguage(langKey) {
        if(typeof langKey == 'undefined') lang.currentLanguage = undefined;
        else lang.currentLanguage = lang.availableLanguages[langKey];
    }

    lang.switchLang = function(key) {
        var langPromise = $translate.use(key);
        if(typeof langPromise == 'object') {
            langPromise.then(function() { updateLanguage(key); });
        } else {
            updateLanguage(langPromise);
        }
    };

    /*
     * checks if the current language equals the param lang.
     * Current language is in xx_XX format, but param lang can be xx as well
     */
    lang.isLangSet = function(lang) {
        if(typeof lang.currentLanguage == 'undefined') return false;
        if(typeof lang == 'undefined') return false;
        return lang.currentLanguage == lang.availableLanguages[lang];
    };

    return lang;
}]);