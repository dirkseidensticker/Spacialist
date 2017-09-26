spacialistApp.controller('headerCtrl', ['$scope', 'langService', 'userService', 'mainService', '$state', '$translate', function($scope, langService, userService, mainService, $state, $translate) {
    var vm = this;
    vm.state = $state;
    vm.currentLanguage = {};
    vm.isLangSet = langService.isLangSet;
    $scope.concepts = vm.concepts;
    $scope.getLabelValue = function(label, type) {
        if(vm.concepts[label]) {
            return vm.concepts[label].label;
        }
        var transLabel = $translate.instant(vm.getLabelPrefix(type) + label);
        if(transLabel) {
            return transLabel.toString();
        }
        return label;
    };

    vm.getLabelPrefix = function(type) {
        if(type == 'file') return  'files.properties.file.';
        if(type == 'bibliography') return 'literature.bibtex.';
    };

    vm.onSearchSelect = function($item, $model, $label) {
        switch($model.type) {
            case 'context':
                $state.go('root.spacialist.data', {id: $model.id});
                break;
            case 'layer':
                $state.go('root.editor.layer.edit', {id: $model.id});
                break;
            case 'file':
                $state.go('root.spacialist.file', {id: $model.id, tab: 'files'});
                break;
            case 'user':
                $state.go('root.user.edit', {id: $model.id});
                break;
            case 'bibliography':
                $state.go('root.bibliography.edit', {id: $model.id});
        }
    };

    vm.toggleEditMode = function() {
        vm.editMode.enabled = !vm.editMode.enabled;
    };

    vm.initLanguage = function() {
        var initKey;
        if(vm.userConfig) {
            var langPref = vm.userConfig['prefs.gui-language'];
            if(langPref) initKey = langPref.value;
        }
        langService.setInitLanguage(vm.currentLanguage, initKey);
    };

    vm.switchLanguage = function(langKey) {
        langService.switchLanguage(vm.currentLanguage, langKey, vm.concepts);
        vm.currentLanguage.flagCode = langKey;
    };

    vm.logoutUser = function() {
        userService.logoutUser();
    };

    vm.globalSearch = function(term) {
        return mainService.globalSearch(term);
    };

    vm.initLanguage();
}]);
