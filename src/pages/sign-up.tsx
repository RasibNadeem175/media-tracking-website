import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signUpSchema, ISignUp } from "../common/validation/authSchemas";
import { trpc } from "../common/trpc";
import { useState } from "react";

const SignUp: NextPage = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("")
  const { handleSubmit, control, reset, formState:{ errors } } = useForm<ISignUp>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  const { mutateAsync } = trpc.signup.useMutation();

  // Tell React to cache your function between re-renders...
  const onSubmit = useCallback(
    async (data: ISignUp) => {
      try {
        const result = await mutateAsync(data); //the sign up mutation that happens on submit
        if (result.status === 201) {
          reset();
          router.push("/");
        }
      } catch (err: any) {
        setErrorMessage(err.message)
        console.error(err);
      }
    },
    [mutateAsync, router, reset] // ...so as long as these dependencies don't change...
  );

  return ( //TODO: remove Tailwind css and add your own
    <div>
      <Head>
        <title>Next App - Register</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="d-flex justify-content-center mt-5">
      <div className="card">
        
        <form       //...Form will receive the same props and can skip re-rendering 
          className="card-body"
          onSubmit={handleSubmit(onSubmit)}
        >
        <div className="card-body">
          <h2 className="card-title">Create an account!</h2>
          <div className="form-outline mb-2">
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="Type your username..."
                  className="form-control"
                  {...field}
                />
              )}
            />
          </div>


          <div className="form-outline mb-2">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    type="email"
                    placeholder="Type your email..."
                    className="form-control"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      setErrorMessage('')
                    }}
                  />
                )}
              />
          </div>

              <div className="errorMessages">{errors.email?.message}</div> {/* error message from use form*/}
              
            <div className="form-outline mb-2">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <input
                    type="password"
                    placeholder="Type your password..."
                    className="form-control"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      setErrorMessage('')
                    }}
                  />
                )}
              />
              </div>

              <div className="errorMessages">{errors.password?.message?.replace("String", "password")}</div>

              <p className="errorMessages">{errorMessage ? errorMessage + 'Please try again' : '' } </p>

              <div className="d-flex justify-content-center">
                <button className="btn btn-primary btn-block mb-2" type="submit">
                  Sign Up
                </button>
              </div>
              <div>Already a member? <Link href="/" className="link">Login</Link></div>
            </div>
        </form>
        </div>
      </div>

      <style jsx>
        {
          `
          .errorMessages {
            color: red;
            font-size: 12px
          }
          `
        }
      </style>
    </div>
  );
};

export default SignUp;
