/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true*/ /*global define */
"use strict";
/**
 E-Commerce Solutions Cloud App

 - serve downstream e-commerce services via relays to API gateway
 - collect & persist user activity information for analytics

 Method call format:
 http://<host>/cloud/<function_name>
*/

var activity = require('./util/activity');
var products = require('./api/products');
var sales = require('./api/sales');
var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

function cloudRoute() {

    var jsonParser = bodyParser.json();
    var cloud = new express.Router();
    cloud.use(cors());

    cloud.get('/products', function(req, res) {

        activity.record({
            "action": "Products list fetch"
        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            products.list(function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                res.send(data);
            });
        });
    });

    cloud.get('/products/featured', function(req, res) {

        activity.record({
            "action": "Featured products list fetch"
        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            products.featured(function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                res.send(data);
            });
        });
    });

    cloud.get('/products/:sku', function(req, res) {

        activity.record({
            "action": "Product details fetch for sku " + req.params.sku
        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            products.get(req.params.sku, function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                res.send(data);
            });
        });
    });

    cloud.post('/customers/authenticate', jsonParser, function(req, res) {

        activity.record({
            "action": "User authenticated"

        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            sales.authenticate(req.body, function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                res.send(data);
            });
        });
    });

    cloud.post('/customers/:userId/logout', function(req, res) {

        activity.record({
            "action": "User logged out"

        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            sales.removeToken(req.params.userId, function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                res.send(data);
            });
        });
    });

    cloud.get('/customers/:userId/token', function(req, res) {

        activity.record({
            "action": "User token check"

        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            sales.checkToken(req.params.userId, function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                res.send(data);
            });
        });
    });

    cloud.get('/customers/tokens/list', function(req, res) {

        sales.listTokens(req.body, function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            res.json(data);
        });
    });

    cloud.post('/customers', jsonParser, function(req, res) {

        activity.record({
            "action": "User register"

        }, function(err) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            sales.register(req.body, function(err, data) {
                if(err) {
                    res.statusCode = 500;
                    return res.end(util.inspect(err));
                }
                activity.record({
                    "action": "User authenticated after registration"

                }, function(err) {
                    if (err) {
                        res.statusCode = 500;
                        return res.end(util.inspect(err));
                    }
                    sales.authenticate(data, function(err, data) {
                        if(err) {
                            res.statusCode = 500;
                            return res.end(util.inspect(err));
                        }
                        res.send(data);
                    });
                });
            });
        });
    });

    cloud.post('/activity/list', function(req, res) {

        activity.list(req.body, function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            res.json(data);
        });
    });

    cloud.post('/activity/record', function(req, res) {

        activity.record({
            "action": "Record Activity Called"
        }, function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            res.json(data);
        });
    });

    cloud.post('/activity/reset', function(req, res) {

        activity.reset(function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end(util.inspect(err));
            }
            res.json(data);
        });
    });

    cloud.get('/routes', function(req, res) {
        res.json(cloud.stack);
    });

    return cloud;
}

module.exports = cloudRoute;