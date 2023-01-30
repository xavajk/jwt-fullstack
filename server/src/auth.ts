import { User } from "./entity/User.js";

import pkg from 'jsonwebtoken';
const { sign } = pkg;

export const createAccessToken = (user: User) => {
    return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
}

export const createRefreshToken = (user: User) => {
    return sign(
        { userId: user.id, tokenVersion: user.tokenVersion }, 
        process.env.REFRESH_TOKEN_SECRET!, 
        { expiresIn: '7d' }
    );
}