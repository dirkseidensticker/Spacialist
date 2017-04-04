spacialistApp.service('imageService', ['$rootScope', 'httpPostFactory', 'httpGetFactory', 'modalService', 'snackbarService', 'searchService', 'Upload', '$timeout', function($rootScope, httpPostFactory, httpGetFactory, modalService, snackbarService, searchService, Upload, $timeout) {
    var images = {
        all: [],
        linked: [],
        upload: {}
    };

    init();

    images.availableTags = [];

    var lastTimeImageChecked = 0;

    images.openImageModal = function(img) {
        modalOptions = {};
        // modalOptions.markers = angular.extend({}, scopeService.markers);
        modalOptions.img = angular.extend({}, img);
        modalOptions.linkImage = images.linkImage;
        modalOptions.unlinkImage = images.unlinkImage;
        modalOptions.setImagePropertyEdit = setImagePropertyEdit;
        modalOptions.storeImagePropertyEdit = storeImagePropertyEdit;
        modalOptions.cancelImagePropertyEdit = cancelImagePropertyEdit;
        // modalOptions.isEmpty = $scope.isEmpty;
        // modalOptions.modalNav = angular.extend({}, $scope.modalNav);
        modalService.showModal({}, modalOptions);
    };

    function setImagePropertyEdit(editArray, index, initValue) {
        editArray[index] = {
            text: initValue || 'Hallooooo',
            editMode: true
        };
    }

    function storeImagePropertyEdit(editArray, index, refArray) {
        console.log(refArray[index]);
        refArray[index] = editArray[index].text;
        console.log(refArray[index]);
        editArray[index].text = '';
        editArray[index].editMode = false;
    }

    function cancelImagePropertyEdit(editArray, index) {
        editArray[index].text = '';
        editArray[index].editMode = false;
    }

    images.getImagesForContext = function(id) {
        if(!id) return;
        $rootScope.$emit('image:delete:linked');
        images.linked = [];
        images.getLinkedImages(id);
    };

    images.getLinkedImages = function(id) {
        if(!id) return;
        images.linked = filterLinkedImages(id);
    };

    images.loadImages = function(len, type) {
        var src = images[type];
        if(len == src.length) return src;
        var loaded = src.slice(0, len + 10);
        return loaded;
    };

    images.hasMoreImages = function(len, type) {
        var src = images[type];
        return src.length - len;
    };

    /**
     * Upload the image files `files` to the server, one by one and store their paths in the database.
     */
    images.uploadImages = function(files, invalidFiles) {
        images.upload.files = files;
        images.upload.errFiles = invalidFiles;
        images.upload.finished = 0;
        images.upload.toFinish = (typeof files === 'undefined') ? 0 : files.length;
        angular.forEach(files, function(file) {
            file.upload = Upload.upload({
                url: 'api/image/upload',
                data: { file: file }
            });
            file.upload.then(function(response) {
                $timeout(function() {
                    var data = response.data;
                    data.linked = [];
                    if (typeof images.all === 'undefined') images.all = [];
                    images.all.push(data);
                    images.upload.finished++;
                    if (images.upload.finished == images.upload.toFinish) {
                        $timeout(function() {
                            images.upload.files.length = 0;
                        }, 1000);
                        var content = $translate.instant('snackbar.image-upload.success', {
                            cnt: images.upload.finished
                        });
                        snackbarService.addAutocloseSnack(content, 'success');
                    }
                });
            }, function(response) {
                if(response.status > 0) {
                    file.errorMsg = response.status + ': ' + response.data;
                }
            }, function(evt) {
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        });
    };

    /**
     * Link the image with ID `imgId` to the context with the id `contextId`
     */
    images.linkImage = function(imgId, contextId) {
        var formData = new FormData();
        formData.append('imgId', imgId);
        formData.append('ctxId', contextId);
        httpPostFactory('api/image/link', formData, function(response) {
            var content = $translate.instant('snackbar.image-linked.success');
            snackbarService.addAutocloseSnack(content, 'success');
            images.getImagesForContext(contextId);
        });
    };

    images.unlinkImage = function(imgId, contextId) {
        var formData = new FormData();
        formData.append('imgId', imgId);
        formData.append('ctxId', contextId);
        httpPostFactory('api/image/unlink', formData, function(response) {
            var content = $translate.instant('snackbar.image-unlinked.success');
            snackbarService.addAutocloseSnack(content, 'success');
            images.getImagesForContext(contextId);
        });
    };

    images.deleteImage = function(img) {
        httpGetFactory('api/image/delete/' + img.id, function(response) {
            if(!response.error) {
                var content = $translate.instant('snackbar.image-deleted.success');
                snackbarService.addAutocloseSnack(content, 'success');
                var i = images.all.indexOf(img);
                if(i > -1) images.all.splice(i, 1);
            }
        });
    };

    images.getAllImages = function(forceUpdate) {
        forceUpdate = forceUpdate || false;
        var currentTime = (new Date()).getTime();
        //only fetch images again if it is a force update or last time checked is > 60s
        if(!forceUpdate && currentTime - lastTimeImageChecked <= 60000) {
            return;
        } else {
            lastTimeImageChecked = currentTime;
            httpGetFactory('api/image/getAll', function(response) {
                var oneUpdated = false;
                var allCopy = images.all.slice();
                for(var i=0; i<response.length; i++) {
                    var newImg = response[i];
                    var alreadyLinked = false;
                    for(var j=0; j<allCopy.length; j++) {
                        var one = allCopy[j];
                        if(newImg.id == one.id) {
                            if(!angular.equals(newImg, one)) {
                                oneUpdated = true;
                                updateTags(newImg);
                                images.all[j] = newImg;
                            }
                            alreadyLinked = true;
                            break;
                        }
                    }
                    if(!alreadyLinked) {
                        oneUpdated = true;
                        updateTags(newImg);
                        images.all.push(newImg);
                    }
                }
                if(oneUpdated) {
                    $rootScope.$emit('image:updated:all');
                }
            });
        }
    };

    images.addTag = function(img, tag) {
        var formData = new FormData();
        formData.append('photo_id', img.id);
        formData.append('tag_id', tag.id);
        httpPostFactory('api/image/tags/add', formData, function(response) {
            if(response.error) {
                // TODO remove from img.tags
                return;
            }
        });
    };

    images.removeTag = function(img, tag) {
        var formData = new FormData();
        formData.append('photo_id', img.id);
        formData.append('tag_id', tag.id);
        httpPostFactory('api/image/tags/remove', formData, function(response) {
            if(response.error) {
                // TODO add back to img.tags
                return;
            }
        });
    };

    function init() {
        getAvailableTags();
    }

    function getAvailableTags() {
        httpGetFactory('api/image/tags/get', function(response) {
            if(response.error) {
                return;
            }
            angular.forEach(response.tags, function(tag) {
                images.availableTags.push(tag);
                searchService.availableSearchTerms.push(tag);
            });
        });
    }

    function updateTags(img) {
        for(var i=0; i<img.tags.length; i++) {
            var tag = img.tags[i];
            var found = false;
            for(var j=0; j<images.availableTags.length; j++) {
                var aTag = images.availableTags[j];
                if(tag.id == aTag.id) {
                    found = true;
                    img.tags[i] = images.availableTags[j];
                }
            }
            if(!found) {
                delete img.tags[i];
            }
        }
    }

    function filterLinkedImages(id) {
        return images.all.filter(function(img) {
            for(var i=0; i<img.linked_images.length; i++) {
                if(img.linked_images[i].context_id == id) {
                    return true;
                }
            }
            return false;
        });
    }

    return images;
}]);
