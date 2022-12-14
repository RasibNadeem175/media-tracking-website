import { TRPCError } from "@trpc/server";
import { hash } from "argon2";
import { signUpSchema } from "../../common/validation/authSchemas";
import { router, publicProcedure } from '../trpc';

export const onboardingRouter = router({

  // ----------------- SIGN IN PROCEDURES ---------------------
  signup: publicProcedure.input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      const { username, email, password } = input;
      // ERROR CHECKS
      const existsEmail = await ctx.prisma.user.findFirst({
        where: { email },
      });

      if (existsEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists.",
        });
      }

      const existsUserName = await ctx.prisma.user.findFirst({
        where: { username },
      });

      if (existsUserName) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists.",
        });
      }
      // ACTUAL CODE

      const hashedPassword = await hash(password);

      const result = await ctx.prisma.user.create({
        data: { username, email, password: hashedPassword },
      });

      return {
        status: 201,
        message: "Account created successfully",
        result: result.email,
      };
    }),
});
