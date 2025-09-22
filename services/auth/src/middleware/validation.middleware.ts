import { body } from 'express-validator';

export const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Username must be between 1 and 100 characters')
        .trim()
        .escape(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Password must be between 1 and 100 characters')
];

export const refreshTokenValidation = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
        .isString()
        .withMessage('Refresh token must be a string')
        .trim()
];

export const logoutValidation = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
        .isString()
        .withMessage('Refresh token must be a string')
        .trim()
];