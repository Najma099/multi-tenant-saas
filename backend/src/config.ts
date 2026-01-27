import dotenv from 'dotenv'
import { CookieOptions } from 'express';

dotenv.config();

export const originalUrl = process.env.ORIGINAL_URL;