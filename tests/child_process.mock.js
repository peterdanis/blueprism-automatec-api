// eslint-disable-next-line security/detect-child-process
const cp = require("child_process");

// Both `exec` and `execFile` methods are being used promisified, therefore the intended output must be supplied via closure
const callbackClosure = (err, intendedOutput) => (...args) => {
  // The last argument is a callback function, which is called with err and input parameters
  args.pop()(err, intendedOutput);
};

const execMockOnce = (err, intendedOutput) => {
  cp.exec.mockImplementationOnce(callbackClosure(err, intendedOutput));
};

const execFileMockOnce = (err, intendedOutput) => {
  cp.execFile.mockImplementationOnce(callbackClosure(err, intendedOutput));
};

// Add default mock implementation
cp.exec.mockImplementation(callbackClosure(null, { stdout: "test" }));
cp.execFile.mockImplementation(callbackClosure(null, { stdout: "test" }));

module.exports = {
  execFileMock: cp.execFile.mock,
  execFileMockOnce,
  execMock: cp.exec.mock,
  execMockOnce,
};
