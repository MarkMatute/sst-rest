import { ZodError } from "zod";

export const errorHandler = (error: unknown) => {
  console.log(error, 'error');
  const isZodError = error instanceof ZodError;

  if (isZodError) {
    return {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Invalid input",
        errors: error.issues.map(({ message, ...e }) => ({
          code: "ValidationError",
          title: message,
          meta: e,
        })),
      }),
    };
  }

  return {
    statusCode: 500,
    body: "Something went wrong.",
  };
};
