// eslint-disable-next-line security/detect-child-process
const cp = require("child_process");

const exec = (err, input) => (...args) => {
  args.pop()(err, input);
};

const execFile = (err, input) => (...args) => {
  args.pop()(err, input);
};

const execMockOnce = (err, input) => {
  cp.exec.mockImplementationOnce(exec(err, input));
};

const execFileMockOnce = (err, input) => {
  cp.execFile.mockImplementationOnce(execFile(err, input));
};

cp.exec.mockImplementation(exec(null, {}));
cp.execFile.mockImplementation(execFile(null, {}));

module.exports = {
  execFileMockOnce,
  execMockOnce,
};
