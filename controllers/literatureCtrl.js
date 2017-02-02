spacialistApp.controller('literatureCtrl', function($rootScope, $scope, scopeService, modalFactory, httpGetFactory, httpPostFactory) {
    $scope.literatureOptions = {};
    $scope.literatureOptions.availableTypes = [
        {
            name: 'article',
            id: 0,
            mandatoryFields: [
                'author', 'title', 'journal', 'year'
            ],
            optionalFields: [
                'volume', 'number', 'pages'
            ]
        }, {
            name: 'book',
            id: 1,
            mandatoryFields: [
                'author', 'title', 'publisher', 'year'
            ],
            optionalFields: [
                'editor', 'volume', 'number', 'address'
            ]
        }, {
            name: 'incollection',
            id: 2,
            mandatoryFields: [
                'author', 'title', 'booktitle', 'publisher', 'year'
            ],
            optionalFields: [
                'editor', 'volume', 'number', 'pages', 'address'
            ]
        }, {
            name: 'misc',
            id: 3,
            mandatoryFields: [
            ],
            optionalFields: [
                'author', 'title', 'howpublished', 'year'
            ]
        }
    ];

    $scope.can = scopeService.can;
    $scope.literature = scopeService.literature;

    $scope.deleteLiteratureEntry = function(id, index) {
        httpGetFactory('api/literature/delete/' + id, function(response) {
            $scope.literature.splice(index, 1);
        });
    };

    $scope.openAddLiteratureDialog = function() {
        modalFactory.addLiteratureModal(addLiterature, $scope.literatureOptions.availableTypes);
    };

    var addLiterature = function(fields, type) {
        if(typeof type == 'undefined') return;
        if(typeof fields == 'undefined') return;
        var mandatorySet = true;
        for(var i=0; i<type.mandatoryFields.length; i++) {
            var m = type.mandatoryFields[i];
            if(typeof fields[m] == 'undefined') {
                mandatorySet = false;
                break;
            }
            if(fields[m].length === 0) {
                mandatorySet = false;
                break;
            }
        }
        if(!mandatorySet) {
            alert('Not all mandatory fields are set!');
            return;
        }
        var formData = new FormData();
        for(var field in fields) {
            formData.append(field, fields[field]);
        }
        formData.append('type', type.name);
        httpPostFactory('api/literature/add', formData, function(lit) {
            if(lit.error) {
                alert(lit.error);
            } else {
                $scope.literature.push(lit.literature[0]);
                var container = document.getElementById('literature-container');
                container.scrollTop = container.scrollTopMax;
            }
        });
    };
});
