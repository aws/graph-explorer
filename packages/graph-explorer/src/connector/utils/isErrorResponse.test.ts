import isErrorResponse from './isErrorResponse';

describe('isErrorResponse', () => {
    it('should return true for error response', () => {
        const errorResponse = {
            code: 400,
            detailedMessage: 'Detailed error message',
        };

        expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it('should return false for non-error response', () => {
        const nonErrorResponse = {
            status: 200,
            message: 'OK',
        };

        expect(isErrorResponse(nonErrorResponse)).toBe(false);
    });

    it('should return false for error-like response missing code', () => {
        const errorLikeResponse = {
            detailedMessage: 'Detailed error message',
        };

        expect(isErrorResponse(errorLikeResponse)).toBe(false);
    });

    it('should return false for error-like response missing detailedMessage', () => {
        const errorLikeResponse = {
            code: 400,
        };

        expect(isErrorResponse(errorLikeResponse)).toBe(false);
    });
});
