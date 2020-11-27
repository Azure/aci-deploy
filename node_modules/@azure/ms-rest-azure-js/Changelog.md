# Changelog
## 2.0.1 - 2019-07-30
- In `getOperationResponse()` if the `resource` is of type `string` and we get an error while performing `JSON.parse()` then instead of letting the error be thrown we set the `resource` as-is as the `response.parsedBody`

## 2.0.0 - 2019-07-15
- Bumping the version to `2.0.0` since the underlying dependency `@azure/ms-rest-js` has moved to `2.x.x` range.
  - `@azure/ms-rest-js@2.x.x` is using `node-fetch` instead of `axios` as the http client for node.js scenario.
  - We have made some bug fixes to handling cookie parsing errors in the `2.0.3` version
  - This helps us in making it easier to update the autorest generated TypeScript sdk packages on an on-demand basis and keeping sdks from unnecessarily getting runtime updates when they are eventually going to get updated to use the new `@azure/core-*` runtime packages in couple of weeks from now.

## 1.3.8 - 2019-06-06
- Fixed tests to pass when -preview suffix set in version.

## 1.3.7 - 2019-06-04
- Updated `@azure/ms-rest-js` to `^1.8.10`

## 1.3.6 - 2019-06-03
- Fixed a bug where we were throwing an Error if the final GET on the resource while polling a long running DELETE operation would return a 404. [#azure-sdk-for-js/issues/2842](https://github.com/Azure/azure-sdk-for-js/issues/2842)
- Fixed vulnerabilities by updating package version of `nyc`.

## 1.3.5 - 2019-05-17
- Added missing exports to the package.

## 1.3.4 - 2019-05-13
- Updated version of the package to fix auto publishing script in CI.

## 1.3.3 - 2019-04-05
- Updated dependency `@azure/ms-rest-js`.

## 1.3.2 - 2019-01-28
- Fixed User-Agent tests

## 1.3.1 - 2019-01-07
- Fixed LRO RestErrors parsing
- Added JSON parsing error handling

## 1.3.0 - 2019-01-07
- Removed final GET on POST 202 long running operations

## 1.2.4 - 2018-12-20
- Updated checks in CI

## 1.2.3 - 2018-12-20
- Added checks to run before publishing

## 1.2.2 - 2018-12-19
- More test updates.

## 1.2.1 - 2018-12-17
- Enable test coverage in CI.

## 1.2.0 - 2018-12-04
- Update dependency `@azure/ms-rest-js`.

## 1.1.2 - 2018-11-28
- Fixed event-stream vulnerability

## 1.1.1 - 2018-11-13

- Improve debugging by adding rollup-plugin-sourcemaps

## 1.1.0 - 2018/11/09

- Renamed NPM package to @azure/ms-rest-azure-js and updated renamed dependencies

## 1.0.0 - 2018/10/04

- Moved to rollup for bundling
- Moved browser bundle from ./msRestAzureBundle.js to ./dist/msRestAzure.js (same bundle for nodejs and browser)

## 0.2.8 - 2017/04/02

- Updated ms-rest-js to 0.2.8
- Added CognitiveServicesCredentials

## 0.2.1 - 2017/10/25

- Updating the minimum version of dependency "ms-rest-js": "^0.2.3". This brings in the change (removal of "bodyAsStream" property) done to HttpOperationResponse class

## 0.2.0 - 2017/10/11

- Updating the minimum version of dependency "ms-rest-js": "^0.2.1". This also gets a strict dependency to "moment" version 2.18.1 as 2.19.0 has bugs.

## 0.1.0 - 2017/09/16

- Initial version of the isomorphic azure runtime along with type definitions that works in the browser as well as the node.js environment
  - Supports polling for long running operations
  - Provides definition of CloudError