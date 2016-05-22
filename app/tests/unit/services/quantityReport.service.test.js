'use strict';

const
    quantityReportService = require('../../../services/quantityReport.service')();

describe.only('QuantityReportService', () => {

    it('#_buildMoods when different moods', () => {
        let moods = quantityReportService._buildMoods([{
            _id: 1,
            value: {
                normal: 2,
                sadness: 1
            }
        }, {
            _id: 2,
            value: {
                normal: 1,
                sadness: 0
            }
        }]);

        moods.normal.should.be.equal(2);
        moods.sadness.should.be.equal(0);
    });

    it('#_buildMoods when same totals in different moods', () => {
        let moods = quantityReportService._buildMoods([{
            _id: 1,
            value: {
                normal: 1,
                sadness: 1
            }
        }]);

        moods.normal.should.be.equal(1);
        moods.sadness.should.be.equal(0);
    });

    it('#_buildMoods when no moods', () => {
        let moods = quantityReportService._buildMoods([{
            _id: 1,
            value: {
                normal: 0
            }
        }]);

        moods.normal.should.be.equal(0);
    });
});