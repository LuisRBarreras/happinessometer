'use strict';

const 
    _ = require('lodash'),
    moment = require('moment');

const
    logger = require('./logger');

class DateUtils {
    static createDateRangeCriteriaIfAny(dateRange) {
        let criteria = {};
        if (dateRange.to && dateRange.from) {
            criteria = {
                '$gte': moment(dateRange.from).utc().startOf('day').toDate(),
                '$lte': moment(dateRange.to).utc().endOf('day').toDate()
            }

            logger.debug('Quering from date: ' +
                moment(dateRange.from).utc().startOf('day').format('YYYY MM DD HH:mm') +
                ', ' +
                'to date: ' +
                moment(dateRange.to).utc().endOf('day').format('YYYY MM DD HH:mm'));
        }
        return criteria;
    }
}