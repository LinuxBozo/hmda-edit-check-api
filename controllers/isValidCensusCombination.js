'use strict';

var CensusService = require('../services/CensusService');

 module.exports = function(router) {

    /**
     * @param {String} activityYear, {String} state, {String} county, {String} tract
     * @return {json}
     */
     router.get('/:activityYear/:state/:county/:tract', function(req, res) {
		 var censusparams = {};
		 censusparams.state = req.params.state;
		 censusparams.county = req.params.county;
         censusparams.tract = req.params.tract;

		 CensusService.isValidCensusCombination(req.params.activityYear,
                         censusparams, function(err, result) {
			 if (err) {
                 res.json(500, err);
             } else {
				 res.json(result);
		     }
		 });
     });
 };