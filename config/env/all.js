'use strict';

module.exports = {
    app: {
        title: 'Happinessometer - Service',
        description: 'Happinessometer Service',
        keywords: 'happinessometer, service',
        pendingUser: {
            validUntilDays: process.env.PENDING_USER_VALID_UNTIL_DAYS
        }
    },
    db: {
        uri: process.env.MONGODB_URI,
        options: {
            user: '',
            pass: '',
            server: {
                socketOptions: {
                    keepAlive: true
                }
            }
        }
    },
    secretKey: process.env.SECRET_KEY,
    email: {
        from: 'hello@happinessometer.com',
        name: 'Happinessometer Service'
    },
    port: process.env.PORT || 3000,
    token: process.env.SLACK_TOKEN,
    sessionName: 'connect.sid',
    log: {
        // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        format: 'combined',
        // Stream defaults to process.stdout
        // Uncomment to enable logging to a log on the file system
        options: {
            //stream: 'access.log'
        }
    }
};
