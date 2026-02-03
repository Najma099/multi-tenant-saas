import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { SignupSchema } from './schema'
import { BadRequestError } from '../../core/ApiError';
import { existsByEmail } from '../../database/repository/userRepo';
import { createTokens } from '../../core/authUtils';
import { SuccessResponse } from '../../core/ApiResponse';
import { getUserData } from '../../core/utils';
import { validateRequest } from '../../middleware/validateRequest';
import { getPrismaClient } from '../../database';
import bcryptjs from 'bcryptjs';

const router = Router();
router.post(
    '/',
    validateRequest(SignupSchema),
    asyncHandler(async (req, res) => {     
        const { name, email, password} = req.body;
        const emailExists = await existsByEmail(email);
        if(emailExists) throw new BadRequestError('Email already registered.');

        const hashedPassword = await bcryptjs.hash(password, 12);
        const prisma = getPrismaClient();
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password:hashedPassword,
            }
        });

        const tokens = await createTokens(user.id);

        new SuccessResponse('Signup successful', {
            user: getUserData(user),
            tokens,
        }).send(res);
        
    })
);

export default router;