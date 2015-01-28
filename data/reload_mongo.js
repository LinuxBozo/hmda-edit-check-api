'use strict';

var mongoose = require('mongoose');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');

var config;

var env = process.env.NODE_ENV
if (env == 'test') {
    config = require('../config/test.json')
} else if (env == 'sandbox') {
    config = require('../config/sandbox.json');
} else if (env == 'dev' || env == 'development') {
    config = require('../config/development.json');
} else {
    config = require('../config/config.json');
}

var uri = 'mongodb://' + config.mongoConfig.host + ':' + config.mongoConfig.port + '/' + (config.mongoConfig.database ? config.mongoConfig.database : 'hmda');
var opts = {};
if (config.mongoConfig.username) {
    opts.user = config.mongoConfig.username;
}
if (config.mongoConfig.password) {
    opts.pass = config.mongoConfig.password;
}
mongoose.connect(uri, opts);
mongoose.connection.on('error', console.error.bind(console, 'mongodb connection error:'));
mongoose.connection.once('open', function(callback) {
    console.log('dropping database..');
    mongoose.connection.db.executeDbCommand( {dropDatabase:1}, function(err, result) {
        if (err) {
            console.log(err);
            process.exit(-1);
        }
        // Kill the current connection, then re-establish it after we've dropped the db
        // so it will recreate it on connect
        mongoose.connection.close();
        mongoose.connect(uri, opts);
        mongoose.connection.on('error', console.error.bind(console, 'mongodb connection error:'));
        mongoose.connection.once('open', function(callback) {
            console.log('adding data..');

            // Load the mongoose models so they get created
            var models_path = __dirname + '/../models';
            fs.readdirSync(models_path).forEach(function (file) {
                require(models_path + '/' + file);
            });

            // Create array for storing our loading anon functions
            var asyncFunctions = [];

            // Now loop through the loaded models
            _.each(mongoose.connections[0].base.modelSchemas, function(schema, key) {
                // add an anon function to our array
                asyncFunctions.push(function (next) {
                    // Get the data from the json files for each collection
                    var filename = key.toLowerCase()+'.json';
                    var lines = fs.readFileSync(__dirname + '/'+filename,'utf8').split('\n');
                    var docs = lines.map(function(line) {
                        if (line) {
                            var data = JSON.parse(line);
                            delete data['_id'];
                            return data;
                        } else {
                            return {};
                        }
                    });
                    // Batch insert
                    mongoose.model(key).collection.insert(docs, function(err, result) {
                        if (err) {
                            console.log('ERROR: could not insert data for ' + key);
                            console.log(err);
                        } else {
                            console.log('inserted '+result.length +' records for ' + key);
                        }
                        return next();
                    });

                });
            });

            // Finally, call our array of loading functions in parallel, and exit when done
            async.parallel(asyncFunctions, function(err) {
                console.log('Done...');
                process.exit();
            });
        });
    });
});