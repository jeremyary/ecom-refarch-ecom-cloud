/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true*/ /*global define */
"use strict";

var request = require('request');
require('request-debug')(request);

var gatewayUrl = "http://gateway-service.ecom-services.svc.cluster.local:9091";

var fh = require('fh-mbaas-api');

var key = 'user_tokens';

exports.authenticate = function (customer, callback) {

    console.log("authenticating user..." + JSON.stringify(customer));
    request.post({
            url: gatewayUrl + '/customers/authenticate',
            form: JSON.stringify(customer)
        },
        function (err, response, body) {

            if (err) {
                console.error("error occurred while authenticating user: " + err);
                return callback(err, null);

            } else if (response.statusCode !== 200) {
                console.error("bad status code from authenticate " + response.statusCode);
                return callback("ERROR: bad status code " + response.statusCode, null);

            } else {
                console.log("json of customer: " + customer);
                console.log("string of customer: " + JSON.stringify(customer));
                customer = JSON.parse(customer);
                console.log("authentication successful, setting token for " + customer.id);
                exports.setToken(customer.id, function(err, data) {
                    if (err) {
                        console.error("unable to set customer token");
                        return callback(err, null);
                    } else {
                        console.log("token set, returning " + JSON.stringify(body));
                        return callback(null, body);
                    }
                });
            }
        }
    );
};

exports.register = function (customer, callback) {

    request.post({
            url: gatewayUrl + '/customers',
            form: JSON.stringify(customer)
        },
        function (err, response, body) {

            if (err) {
                console.error("error received from sales registration call: " + err);
                return callback(err, null);

            } else if (response.statusCode !== 200) {
                console.error("bad status code from registration " + response.statusCode);
                return callback("ERROR: bad status code " + response.statusCode, null);

            } else {
                console.log("registration successful, setting token for " + customer.id);
                exports.setToken(customer.id, function(err, data) {
                    if (err) {
                        console.error("unable to set customer token " + err);
                        return callback(err, null);
                    } else {
                        console.log("token set, returning " + JSON.stringify(body));
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

    console.log("checking token...");
    fh.cache({
        act: "load",
        key: key
    }, function(err, res) {
        if (err) {
            console.error("error checking token ", err);
            return callback(err, null);
        }

        console.log("tokenList found: " + res);
        var tokenList = JSON.parse(res);
        var tokenFound = tokenList && tokenList.indexOf(userId !== -1);
        console.log("token for " + userId + " detected? " + tokenFound);
        return callback(null, {
            'tokenFound': tokenFound
        });
    });
};

exports.setToken = function(userId, callback) {

    console.log("attempting to set token for userId " + userId);
    fh.cache({
        act: "load",
        key: key
    }, function(err, res) {
        if (err) {
            console.log("error1 " + err);
            return callback(err, null);
        }

        var tokenList = JSON.parse(res);
        console.log("tokenlist set to " + res);
        if (tokenList) {
            console.log("tokenlist found");
            if (tokenList.indexOf(userId) === -1) {
                tokenList.push(userId);
            }
        } else {
            console.log("tokenlist not found, creating it with " + userId);
            tokenList = [userId];
        }

        console.log("saving tokenList " + JSON.stringify(tokenList));
        fh.cache({
            act: "save",
            key: key,
            value: JSON.stringify(tokenList),
            expire: 30
        }, function(err, res) {
            if (err) {
                console.error("error saving token list", err);
                return callback(err, null);
            }
            console.log("tokenList saved");
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
