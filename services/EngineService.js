'use strict';

var engine = require('hmda-rule-engine');
engine.setAPIURL('http://localhost:' + (process.env.PORT || '8000'));

module.exports = {
    runLar: function(activityYear, lar, callback) {
        engine.runLar(activityYear, lar)
        .then(function(result) {
            callback(null, result);
        })
        .catch(function(err) {
            callback(err.message, null);
        });
    },
    runLarType: function(activityYear, editType, lar, callback) {
        engine.runLarType(activityYear, editType, lar)
        .then(function(result) {
            callback(null, result);
        })
        .catch(function(err) {
            callback(err.message, null);
        });
    }
};