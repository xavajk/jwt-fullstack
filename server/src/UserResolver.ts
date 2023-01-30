import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware, Int } from 'type-graphql';
import { createAccessToken, createRefreshToken } from './auth.js'
import { MyContext } from './MyContext.js';
import { User } from './entity/User.js';
import { isAuth } from './isAuth.js';
import * as argon2 from "argon2";
import { sendRefreshToken } from './sendRefreshToken.js';
import { AppDataSource } from './data-source.js';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return 'hi!';
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    bye(@Ctx() {payload}: MyContext) {
        console.log(payload);
        return `your user id is: ${payload!.userId}`;
    }
    
    @Query(() => [User])
    users() {
        return User.find();
    }

    @Mutation(() => Boolean)
    async revokeRefreshTokensForUser(
        @Arg('userId', () => Int) userId: number
    ) {
        await AppDataSource
            .getRepository(User)
            .increment({ id: userId }, 'tokenVersion', 1);

        return true;
    }

    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string,
        @Ctx() {res}: MyContext
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: {email} });
        if (!user) {
            throw new Error('could not find user');
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            throw new Error('invalid password');
        }

        // login successful
        sendRefreshToken(res, createRefreshToken(user));

        return {
            accessToken: createAccessToken(user)
        };
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string,
    ) {
        const hashedPassword = await argon2.hash(password);

        try {
            await User.insert({
                email,
                password: hashedPassword
            });
        } catch (err) {
            console.log(err);
            return false;
        }

        return true;
    }
}