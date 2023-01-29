import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware } from 'type-graphql';
import { createAccessToken, createRefreshToken } from './auth.js'
import { MyContext } from './MyContext.js';
import { User } from './entity/User.js';
import { isAuth } from './isAuth.js';
import * as argon2 from "argon2";

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
        res.cookie('jid', createRefreshToken(user), { httpOnly: true });

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