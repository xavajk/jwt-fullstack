import "dotenv/config"
import "reflect-metadata"

import cors from 'cors';
import express from 'express'
import { buildSchema } from 'type-graphql'
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';

import pkg from 'body-parser';
const { json } = pkg;

import { UserResolver } from "./UserResolver.js";
import { AppDataSource } from "./data-source.js";

AppDataSource.initialize().then(async () => {
    const app = express();
    app.get('/', (_req, res) => res.send("Hello, world!"));

    app.post('/refresh_token', (req) => {
        console.log(req.headers)
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
