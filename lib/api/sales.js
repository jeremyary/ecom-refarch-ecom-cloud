/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true*/ /*global define */
"use strict";

var request = require('request');
require('request-debug')(request);

var gatewayUrl = "http://gateway-service.ecom-services.svc.cluster.local:9091";

var fh = require('fh-mbaas-api');

var key = 'user_tokens';

exports.authenticate = function (customer, callback) {

    request.post({
            url: gatewayUrl + '/customers/authenticate',
            form: JSON.stringify(customer)
        },
        function (error, response, body) {

            if (error) {
                return callback(error, null);

            } else if (response.statusCode !== 200) {
                return callback("ERROR: bad status code " + response.statusCode, null);

            } else {
                return callback(null, body);
            }
        }
    );
};

exports.register = function (customer, callback) {

    request.post({
            url: gatewayUrl + '/customers',
            form: JSON.stringify(customer)
        },
        function (error, response, body) {

            if (error) {
                console.error("error received from sales registration call");
                return callback(error, null);

            } else if (response.statusCode !== 200) {
                return callback("ERROR: bad status code " + response.statusCode, null);

            } else {
                this.setToken(customer.id, function(err, data) {
                    if (err) {
                        console.error("unable to set customer token");
                        return callback(err, null);
                    } else {
                        return callback(null, body);
                    }
                });
            }
        }
    );
};

exports.setCacheKey = function(cacheKey){
    key = cacheKey;
};

exports.checkToken = function(userId, callback) {

    fh.cache({
        act: "load",
        key: key
    }, function(err, res) {
        if (err) {
            return callback(err, null);
        }

        var tokenList = JSON.parse(res);
        var tokenFound = tokenList && tokenList.indexOf(userId !== -1);
        return callback(null, {
            'tokenFound': tokenFound
        });
    });
};

exports.setToken = function(userId, callback) {

    fh.cache({
        act: "load",
        key: key
    }, function(err, res) {
        if (err) {
            return callback(err, null);
        }

        var tokenList = JSON.parse(res);
        if (tokenList) {
            if (tokenList.indexOf(userId) === -1) {
                tokenList.push(userId);
            }
        } else {
            tokenList = [userId];
        }

        fh.cache({
            act: "save",
            key: key,
            value: JSON.stringify(tokenList),
            expire: 30
        }, function(err, res) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, {
                'status': 'ok'
            });
        });
    });
};

exports.removeToken = function(userId, callback) {

    var status = 'token not found';

    fh.cache({
        act: "load",
        key: key
    }, function(err, res) {
        if (err) {
            return callback(err, null);
        }

        var tokenList = JSON.parse(res);
        if (tokenList && tokenList.indexOf(userId !== -1)) {
            status = 'token removed';
            tokenList.remove(function (el) { return el === userId; });
        }

        fh.cache({
            act: "save",
            key: key,
            value: JSON.stringify(tokenList),
            expire: 600
        }, function(err, res) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, {
                'status': status
            });
        });
    });
};

exports.listTokens = function(params, callback) {

    fh.cache({
        act: "load",
        key: key
    }, function(err, res) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, res);
    });
};
