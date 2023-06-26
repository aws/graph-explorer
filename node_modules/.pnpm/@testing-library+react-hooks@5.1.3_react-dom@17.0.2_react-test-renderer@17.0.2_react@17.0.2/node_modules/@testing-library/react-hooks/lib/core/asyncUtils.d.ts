import { Act, AsyncUtils } from '../types';
declare function asyncUtils(act: Act, addResolver: (callback: () => void) => void): AsyncUtils;
export { asyncUtils };
