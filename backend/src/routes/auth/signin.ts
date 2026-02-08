import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { SigninSchema } from './schema'
import { BadRequestError } from '../../core/ApiError';
import { findByEmail } from '../../database/repository/user.repo';
import { createTokens, isPasswordCorrect } from '../../core/authUtils';
import { SuccessResponse } from '../../core/ApiResponse';
import { getUserData } from '../../core/utils';
import { validateRequest } from '../../middleware/validateRequest'

const router = Router();
router.post(
    '/',
    validateRequest(SigninSchema),
    asyncHandler(async (req, res) => {     
       const { email, password} = req.body;
       const user = await findByEmail(email);
       if(!user) throw new BadRequestError('User not registered.');

        const isValid = await isPasswordCorrect(password, user.password);
        if(!isValid) throw new BadRequestError('Invalid credential.');

        const tokens = await createTokens(user.id);
        const userData = getUserData(user);
        new SuccessResponse('Login success.', {
            user: userData,
            tokens: tokens,
        }).send(res);
    })
)

export default router;