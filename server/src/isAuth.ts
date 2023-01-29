import { Middleware } from "type-graphql/dist/interfaces/Middleware";
import { MyContext } from "./MyContext";
import { verify } from "jsonwebtoken";

// bearer 19fn01fn91bc01n191dx1dsafagqbsfna

export const isAuth: Middleware<MyContext> = (({context}, next) => {
    const authorization = context.req.headers['authorization'];

    if (!authorization) {
        throw new Error('not authenticated');
    }

    try {
        const token = authorization.split(' ')[1];
        const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
        context.payload = payload as any;
    } catch (error) {
        console.log(error);
        throw new Error('not authenticated');
    }

    return next();
})