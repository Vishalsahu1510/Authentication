import axios from 'axios';

/**
 * Verifies reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token from frontend
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
export const verifyRecaptcha = async (token) => {
    if (!token) {
        return { success: false, error: 'No reCAPTCHA token provided' };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.error('RECAPTCHA_SECRET_KEY is not set in environment variables');
        return { success: false, error: 'reCAPTCHA configuration error' };
    }

    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: secretKey,
                    response: token,
                },
            }
        );

        const data = response.data;

        if (data.success) {
            return { success: true, score: data.score };
        } else {
            return {
                success: false,
                error: data['error-codes']?.join(', ') || 'reCAPTCHA verification failed'
            };
        }
    } catch (error) {
        console.error('reCAPTCHA verification error:', error.message);
        return { success: false, error: 'reCAPTCHA verification request failed' };
    }
};
