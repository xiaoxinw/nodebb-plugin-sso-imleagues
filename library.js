(function(module) {
	"use strict";


	var User = module.parent.require('./user'),
		meta = module.parent.require('./meta'),
		db = module.parent.require('../src/database'),
		passport = module.parent.require('passport'),
        passportIMleagues=require('passport-oauth').OAuth2Strategy,
		fs = module.parent.require('fs'),
		path = module.parent.require('path'),
		nconf = module.parent.require('nconf'),
		winston = module.parent.require('winston'),
		async = module.parent.require('async'),

		constants = Object.freeze({
			name: 'imleagues',
            'admin': {
                'route': '/plugins/sso-imleagues',
                'icon': 'fa-check-square'
            }
		})

    var IMLeagues={};

    IMLeagues.init = function(data, callback) {
        function render(req, res, next) {
            res.render('admin/plugins/sso-imleagues', {});
        }

        data.router.get('/admin/plugins/sso-imleagues', data.middleware.admin.buildHeader, render);
        data.router.get('/api/admin/plugins/sso-imleagues', render);

        callback();
    }
    IMLeagues.getStrategy = function(strategies, callback) {
        meta.settings.get('sso-imleagues', function(err, settings) {
            if (!err && settings['id'] && settings['secret'] && settings['apiserver']) {
                var userRoute=settings['apiserver'] + '/me';

                passportIMleagues.Strategy.prototype.userProfile = function(accessToken, done) {
                    this._oauth2.get(userRoute, accessToken, function(err, body, res) {
                        if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

                        try {
                            var json = JSON.parse(body);
                            IMLeagues.parseUserReturn(json, function(err, profile) {
                                if (err) return done(err);
                                profile.provider = constants.name;
                                done(null, profile);
                            });
                        } catch(e) {
                            done(e);
                        }
                    });
                };

                passport.use(constants.name, new passportIMleagues({
                    clientID: settings['id'],
                    clientSecret: settings['secret'],
                    tokenURL: settings['apiserver'] + '/OAuth/Token.ashx',
                    authorizationURL: settings['apiserver'] + '/OAuth/Authorize.aspx',
                    callbackURL: nconf.get('url') + '/auth/imleagues/callback',
                }, function(accessToken, refreshToken, profile, done) {
                    IMLeagues.login(profile.id, profile.displayName, profile.emails[0].value, profile.photos, function(err, user) {
                        if (err) {
                            return done(err);
                        }
                        done(null, user);
                    });
                }));

                strategies.push({
                    name: 'imleagues',
                    url: '/auth/imleagues',
                    callbackURL: '/auth/imleagues/callback',
                    icon: 'fa-check-square',
                    scope: 'iml.user'
                });
            }

            callback(null, strategies);
        });
    };

    IMLeagues.parseUserReturn = function(data, callback) {
        var profile = {};
        profile.id = data.id;
        profile.displayName = data.last_name;
        profile.emails = [{ value: data.email }];
        profile.photos=data.avatar_url;

        callback(null, profile);
    }

    IMLeagues.login = function(implusid, handle, email, picture, callback) {
        IMLeagues.getUidByIMLeaguesId(implusid, function(err, uid) {
            if(err) {
                return callback(err);
            }

            if (uid !== null) {
                // Existing User
                callback(null, {
                    uid: uid
                });
            } else {
                // New User
                var success = function(uid) {
                    User.setUserField(uid, constants.name + 'Id:uid', implusid);
                    db.setObjectField(constants.name + 'Id:uid', implusid, uid);

                    // Save their photo, if present
                    if (picture) {
                        User.setUserField(uid, 'uploadedpicture', picture);
                        User.setUserField(uid, 'picture', picture);
                    }

                    callback(null, {
                        uid: uid
                    });
                };

                User.getUidByEmail(email, function(err, uid) {
                    if(err) {
                        return callback(err);
                    }

                    if (!uid) {
                        User.create({username: handle, email: email}, function(err, uid) {
                            if(err) {
                                return callback(err);
                            }

                            success(uid);
                        });
                    } else {
                        success(uid); // Existing account -- merge
                    }
                });
            }
        });
    };

    IMLeagues.getUidByIMLeaguesId = function(implusid, callback) {
        db.getObjectField(constants.name + 'Id:uid', implusid, function(err, uid) {
            if (err) {
                return callback(err);
            }
            callback(null, uid);
        });
    };

    IMLeagues.addMenuItem = function(custom_header, callback) {
        custom_header.authentication.push({
            "route": constants.admin.route,
            "icon": constants.admin.icon,
            "name": constants.name
        });

        callback(null, custom_header);
    }


    IMLeagues.deleteUserData = function(uid, callback) {
		async.waterfall([
			async.apply(User.getUserField, uid, constants.name + 'Id'),
			function(oAuthIdToDelete, next) {
				db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next);
			}
		], function(err) {
			if (err) {
				winston.error('[sso-imleagues] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = IMLeagues;
}(module));