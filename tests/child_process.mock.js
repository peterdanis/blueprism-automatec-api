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

const execMockDefault = (err, intendedOutput) => {
  cp.exec.mockImplementation(callbackClosure(err, intendedOutput));
};

const execFileMockDefault = (err, intendedOutput) => {
  cp.execFile.mockImplementation(callbackClosure(err, intendedOutput));
};

module.exports = {
  execFileMock: cp.execFile,
  execFileMockDefault,
  execFileMockOnce,
  execMock: cp.exec,
  execMockDefault,
  execMockOnce,
};
