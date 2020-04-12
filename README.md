# Blue Prism AutomateC API
[![Github Actions badge](https://github.com/peterdanis/blueprism-automatec-api/workflows/Tests/badge.svg?event=push)](https://github.com/peterdanis/blueprism-automatec-api/actions)
[![Maintainability](https://api.codeclimate.com/v1/badges/4a3407c9a47ad74a3411/maintainability)](https://codeclimate.com/github/peterdanis/blueprism-automatec-api/maintainability)
[![codecov](https://codecov.io/gh/peterdanis/blueprism-automatec-api/branch/master/graph/badge.svg)](https://codecov.io/gh/peterdanis/blueprism-automatec-api)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fpeterdanis%2Fblueprism-automatec-api.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fpeterdanis%2Fblueprism-automatec-api?ref=badge_shield)

Aim of this project is to provide HTTP based interface for AutomateC.exe, mainly for purpose of connecting Blue Prism to 3rd party scheduler.

The API server is meant to run on each Runtime resource. Persistance is handled by installing it as Windows service (via [WinSW](https://github.com/kohsuke/winsw)), but you are free to run it by other means.

## Routes

![image](https://user-images.githubusercontent.com/26599181/73657611-e9ce4380-4692-11ea-9791-8c9a70cb5bad.png)

### /version

> To get version of the running API server.

### /reset

> To prepare runtime resource for next bot (e.g. before Login process runs). It will kill any running bots, logout all users (RDP and local console) a stop / start Login Agent service (if used).

### /processes

> To start new process on Runtime resource. Process name and input parameters need to be passed as JSON in the request. On the other hand the response will contain unique session ID, which can be then used to query process status or to request a stop.

### /processes/{sesionId}

> To query process status (e.g. completed, terminated, stopped, etc.). Session ID can be obtained while starting the process via `/process` route.

### /processes/{sessionId}/stop

> To try to stop a running process (if use `IsStopRequested` in your BP process). Session ID can be obtained while starting the process via `/process` route.

## How to run

1. Download and extract the provided zip file on your Runtime resource machine.
2. Generate self-signed certificate via `generate_selfsigned_certificate.bat` (or provide your own) - needed for HTTPS to work
3. Change all necessary settings in `.env` file (or alternatively use environment variables)
4. Run `install.bat` to install the API server as Windows service
5. Test it out by accessing `/api-docs` route

### [Download](https://github.com/peterdanis/blueprism-automatec-api/releases/latest)

### [OpenAPI / Swagger spec file](https://github.com/peterdanis/blueprism-automatec-api/blob/master/src/utils/oas-spec.json)

---

## Contributing

Any contributions (new features, bug fixes, bug reports, ideas and others) are welcome.

### How to start / build it on your own from the source code

- Clone this repository

```bash
git git clone https://github.com/peterdanis/blueprism-automatec-api.git
cd blueprism-automatec-api
```

- Install dependencies

`npm install`

- Build it

`npm run build`

- Start it

`npm run start`

- Debug it

`npm run debug`

---

## License

MIT License

Copyright (c) 2019 Peter Daniš

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fpeterdanis%2Fblueprism-automatec-api.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fpeterdanis%2Fblueprism-automatec-api?ref=badge_large)