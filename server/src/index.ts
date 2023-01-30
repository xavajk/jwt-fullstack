import "dotenv/config"
import "reflect-metadata"

import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import { verify } from "jsonwebtoken";
import { buildSchema } from 'type-graphql';
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';

import pkg from 'body-parser';
const { json } = pkg;

import { User } from "./entity/User.js";
import { UserResolver } from "./UserResolver.js";
import { AppDataSource } from "./data-source.js";
import { createAccessToken, createRefreshToken } from "./auth.js";
import { sendRefreshToken } from "./sendRefreshToken.js";

AppDataSource.initialize().then(async () => {
    const app = express();
    app.use(cookieParser())
    app.get('/', (_req, res) => res.send("Hello, world!"));
    app.post('/refresh_token', async (req, res) => {
        // read the cookie (refresh token)
        const token = req.cookies.jid;
        if (!token) {
            return res.send({ ok: false, accessToken: '' })
        }
        
        // make sure token is valid
        let payload: any = null;
        try {
            payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
        } catch (error) {
            console.log(error);
            return res.send({ ok: false, accessToken: '' })
        }

        // token is valid -> send access token
        const user = await User.findOne({ where: payload.userId });
        if (!user) {
            return res.send({ ok: false, accessToken: '' })
        } else if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ ok: false, accessToken: '' })
        }
        
        sendRefreshToken(res, createRefreshToken(user));

        return res.send({ ok: true, accessToken: createAccessToken(user) });
    });
    
    const server = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver]
        }),
    });
    await server.start();
    
    app.use('/graphql', cors<cors.CorsRequest>(), json(), expressMiddleware(server, {
        context: async ({ req, res }) => ({ req, res })
    }));
    app.listen(4000, () => console.log('express server started'));
}).catch(error => console.log(error))
