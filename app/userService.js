spacialistApp.service('userService', ['httpPostFactory', 'httpGetFactory', '$auth', '$state', '$http', function(httpPostFactory, httpGetFactory, $auth, $state, $http) {
    var user = {};
    user.currentUser = {
        permissions: {},
        roles: {},
        user: {}
    };
    user.users = [];
    user.roles = [];
    user.can = function(to) {
        if(typeof user.currentUser == 'undefined') return false;
        if(typeof user.currentUser.permissions[to] == 'undefined') return false;
        return user.currentUser.permissions[to] == 1;
    };

    user.getUserList = function() {
        user.users.length = 0;
        httpPostFactory('api/user/get/all', new FormData(), function(response) {
            angular.forEach(response.users, function(u, key) {
                user.users.push(u);
            });
        });
    };

    user.deleteUser = function(id, $index) {
        httpGetFactory('api/user/delete/' + id, function(response) {
            user.users.splice($index, 1);
        });
    };

    user.addUser = function(name, email, password) {
        var formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        httpPostFactory('api/user/add', formData, function(response) {
            user.users.push(response.user);
        });
    };

    user.editUser = function(changes, id, $index) {
        var formData = new FormData();
        formData.append('user_id', id);
        for(var k in changes) {
            if(changes.hasOwnProperty(k)) {
                formData.append(k, changes[k]);
            }
        }
        httpPostFactory('api/user/edit', formData, function(response) {
            user.users[$index] = response.user;
        });
    };

    user.getRoles = function() {
        user.roles.length = 0;
        httpGetFactory('api/user/get/roles/all', function(response) {
            angular.forEach(response.roles, function(role, key) {
                user.roles.push(role);
            });
        });
    };

    user.getUserRoles = function(id, $index) {
        httpGetFactory('api/user/get/roles/' + id, function(response) {
            user.users[$index].roles = response.roles;
        });
    };

    user.addUserRole = function($item, user_id) {
        var formData = new FormData();
        formData.append('role_id', $item.id);
        formData.append('user_id', user_id);
        httpPostFactory('api/user/add/role', formData, function(response) {
            // TODO only remove/add role if function returns no error
        });
    };

    user.removeUserRole = function($item, user_id) {
        var formData = new FormData();
        formData.append('role_id', $item.id);
        formData.append('user_id', user_id);
        httpPostFactory('api/user/remove/role', formData, function(response) {
            // TODO only remove/add role if function returns no error
        });
    };

    user.loginUser = function(credentials) {
        $auth.login(credentials).then(function() {
            return $http.post('api/user/get');
        }, function(error) {
            console.log("error occured! " + error.data.error);
        }).then(function(response) {
            if(typeof response === 'undefined' || response.status !== 200) {
                $state.go('auth', {});
                return;
            }
            localStorage.setItem('user', JSON.stringify(response.data));
            user.currentUser = {
                user: response.data.user,
                permissions: response.data.permissions
            };
            console.log(JSON.stringify(response.data));
            $state.go('spacialist', {});
        });
    };

    user.logoutUser = function() {
        $auth.logout().then(function() {
            user.currentUser = {};
            localStorage.removeItem('user');
            user.currentUser = undefined;
            $state.go('auth', {});
        });
    };

    return user;
}]);