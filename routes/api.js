/*
 * Serve JSON to our AngularJS client
 */
var express     = require('express');
var https       = require('https');
var q           = require('q');
var api         = express.Router();
var db          = require('../config/db').connection;

api.get('/api/apparel', function(req, res) {
    db.query('SELECT style_code, weight FROM apparel', function(err, rows, fields) {
        if (err) throw err;
        res.send(rows);
    });
});

// API endpoint for /api/apparel
api.get('/api/apparel/:styleCode', function(req, res) {
    // Insert Apparel API code here

    db.query('SELECT * FROM apparel WHERE style_code = ?', [req.params.styleCode], function(err, rows, fields) {
        if (err) throw err;

        var value = {};

        value.styleCode = req.params.styleCode;
        value.colorCodes = [];
        value.sizeCodes = [];


        var sizeCodes = rows[0].size_codes.split(';');

        for (var i=0; i<sizeCodes.length; i++) {
            value.sizeCodes.push({
                code: sizeCodes[i].split(':')[0],
                value: sizeCodes[i].split(':')[1]
            });
        }

        var colorCodes = rows[0].color_codes.split(';');

        for (var i=0; i<colorCodes.length; i++) {
            value.colorCodes.push({
                code: colorCodes[i].split(':')[0],
                hex: colorCodes[i].split(':')[1],
                name: colorCodes[i].split(':')[2]
            });
        }

        res.send(value);
    });
});

// API endpoint for /api/quote
api.post('/api/quote', function(req, res) {
    // Insert Quoting API code here
    getApparelPrice(req.body.styleCode, req.body.colorCode, req.body.sizeCode, req.body.quantity, req.body.weight).then(function(price) {
        res.send(price.toString());
    });
});

// Function for making an Inventory API call
var getApparelPrice = function getPrice(style_code, color_code, size_code, quantity, weight) {
    var    apparelPriceDeferred = q.defer();
    // Format the Inventory API endpoint as explained in the documentation
    https.get('https://www.alphashirt.com/cgi-bin/online/xml/inv-request.w?sr=' + style_code +'&cc=' + color_code + '&sc=' + size_code + '&pr=y&zp=20176&userName=triggered1111&password=triggered2222', function(res) {
        res.on('data', function (data) {
            // Parse response XML data here
            var xml = data.toString();
            var item = xml.substring(xml.indexOf('<item') + '<item '.length, xml.indexOf('>', xml.indexOf('<item')));
            var needed = [
                { xml: 'price', json: 'price' },
                { xml: 'special-price', json: 'specialPrice' },
                { xml: 'special-expiry', json: 'specialExpiry' }
            ];
            var values = {};


            for (var i=0; i<needed.length; i++) {
                var value = item.substring(item.indexOf(needed[i].xml + '="') + needed[i].xml.length + 2, item.indexOf('"', item.indexOf(needed[i].xml + '="') + needed[i].xml.length + 3));
                
                if (value.indexOf('$') !== -1) {
                    value = parseFloat(value.replace('$', ''));
                } else if (value.indexOf('/')) {
                    value = Date.parse(value);
                }

                values[needed[i].json] = value;
            }


            var price = values.specialExpiry > new Date().getTime() ? values.specialPrice : values.price;

            console.log(price);

            if (weight <= 0.4) {
                if (quantity < 48) {
                    price += quantity;
                } else {
                    price += 0.75 * quantity;
                }
            } else {
                if (quantity < 48) {
                    price += 0.5 * quantity;
                } else {
                    price += 0.25 * quantity;
                }
            }
            
            console.log(price);

            price *= 1.07;

            console.log(price);

            if (price <= 800) {
                price *= 1.5;
            } else {
                price *= 1.45;
            }

            console.log(price);

            apparelPriceDeferred.resolve(Math.round(price * 100) / 100);
        });
    }).on('error', function(error) {
        // Handle EDI call errors here
        apparelPriceDeferred.reject(new Error(error));
    });

    return apparelPriceDeferred.promise;
}

module.exports = api;