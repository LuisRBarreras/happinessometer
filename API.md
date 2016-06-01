# Happinessometer API (Version 1)

Current URIs:

| Http Method | URI | Description | Needs Token |
| ----------- | --- | ----------- | ----------- |
| POST | /v1/authenticate | Authenticate the user | No |
| POST | /v1/admin/companies | Creates a new Company | No (it should) |
| GET | /v1/admin/companies/{domain} | Gets the information of a Company with specified {domain} | No (it should) |
| POST | /v1/users/me/moods | Set mood for the authenticated user | Yes |
| GET | /v1/users/me/companies/moods | Get all moods of the Company of the authenticated user | Yes |
| GET | /v1/users/me | Get the profile info of the authenticated user | Yes |
| POST | /v1/pendingusers | Request a new user into the app | No |
| GET | /v1/users/me/companies/users | Gets all users within the Company of the authenticated user | Yes |
| GET | /v1/pendingusers/{code} | Gets the info of the Pending user | No |
| POST | /v1/pendingusers/{code}/actions/verify | Creates and activate the user from the pending user request | No |
| GET | /v1/users/status/{email} | Gets the info of the Pending User/User | No (it should?) |
| GET | /v1/users/me/companies/reports/quantity | Gets the quantity mood report for the Company of the authenticated user | Yes |

## Possible URIs for new version (Work in Progress)

* POST /v1/authenticate - to login
* DELETE /v1/authenticate - to logout

* GET /v1/admin/companies - to get all companies
* POST /v1/admin/companies - add a new company
* PUT /v1/admin/companies - update a company
* DELETE /v1/admin/companies/{domain} - deletes a company

* POST /v1/admin/companies/{domain}/actions/enable
* POST /v1/admoin/companies/{domain}/actions/disable

* GET /v1/admin/companies/{domain}/moods
* GET /v1/admin/companies/{domain}/users

* /v1/admin/companies/{domain}/pendingusers
* /v1/admin/companies/{domain}/groups
* /v1/admin/companies/{domain}/groups/{groupName}
* /v1/admin/companies/{domain}/groups/{groupName}/moods
* /v1/admin/companies/{domain}/groups/{groupName}/users
* /v1/admin/companies/{domain}/reports
* /v1/admin/companies/{domain}/reports/moodaverage
* /v1/admin/companies/{domain}/reports/hashtag
* /v1/admin/companies/{domain}/reports/etc
* /v1/admin/users
* /v1/admin/users/{email}
* /v1/admin/users/{email}/companies
* /v1/admin/users/{email}/moods
* /v1/admin/users/{email}/groups
* /v1/admin/users/{email}/roles
* /v1/admin/users/{email}/actions/enable
* /v1/admin/users/{email}/actions/disable

Using user session:

* /v1/users/me
* /v1/users/me/moods
* /v1/users/me/roles
* /v1/users/me/companies
* /v1/users/me/companies/{domain}/moods
