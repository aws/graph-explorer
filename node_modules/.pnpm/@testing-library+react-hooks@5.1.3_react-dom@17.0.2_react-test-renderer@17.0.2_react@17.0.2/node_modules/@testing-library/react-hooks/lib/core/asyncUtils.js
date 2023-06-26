"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asyncUtils = asyncUtils;

var _promises = require("../helpers/promises");

var _error = require("../helpers/error");

const DEFAULT_INTERVAL = 50;
const DEFAULT_TIMEOUT = 1000;

function asyncUtils(act, addResolver) {
  const wait = async (callback, {
    interval,
    timeout
  }) => {
    const checkResult = () => {
      const callbackResult = callback();
      return callbackResult != null ? callbackResult : callbackResult === undefined;
    };

    const waitForResult = async () => {
      while (true) {
        await Promise.race([new Promise(resolve => addResolver(resolve)), interval && (0, _promises.resolveAfter)(interval)].filter(Boolean));

        if (checkResult()) {
          return;
        }
      }
    };

    let timedOut = false;

    if (!checkResult()) {
      if (timeout) {
        const timeoutPromise = () => (0, _promises.callAfter)(() => {
          timedOut = true;
        }, timeout);

        await act(() => Promise.race([waitForResult(), timeoutPromise()]));
      } else {
        await act(waitForResult);
      }
    }

    return !timedOut;
  };

  const waitFor = async (callback, {
    interval = DEFAULT_INTERVAL,
    timeout = DEFAULT_TIMEOUT
  } = {}) => {
    const safeCallback = () => {
      try {
        return callback();
      } catch (error) {
        return false;
      }
    };

    const result = await wait(safeCallback, {
      interval,
      timeout
    });

    if (!result && timeout) {
      throw new _error.TimeoutError(waitFor, timeout);
    }
  };

  const waitForValueToChange = async (selector, {
    interval = DEFAULT_INTERVAL,
    timeout = DEFAULT_TIMEOUT
  } = {}) => {
    const initialValue = selector();
    const result = await wait(() => selector() !== initialValue, {
      interval,
      timeout
    });

    if (!result && timeout) {
      throw new _error.TimeoutError(waitForValueToChange, timeout);
    }
  };

  const waitForNextUpdate = async ({
    timeout = DEFAULT_TIMEOUT
  } = {}) => {
    let updated = false;
    addResolver(() => {
      updated = true;
    });
    const result = await wait(() => updated, {
      interval: false,
      timeout
    });

    if (!result && timeout) {
      throw new _error.TimeoutError(waitForNextUpdate, timeout);
    }
  };

  return {
    waitFor,
    waitForValueToChange,
    waitForNextUpdate
  };
}