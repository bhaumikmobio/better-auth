/**
 * Standard API envelope (aligned with `{ message, data }` already used by the frontend).
 */
export type ApiSuccessBody<T> = {
  success: true;
  message: string;
  data: T;
};

export type MessageDataResponse<T> = {
  message: string;
  data: T;
};

export type MessageOnlyResponse = {
  message: string;
};

export function successResponse<T>(
  message: string,
  data: T,
): ApiSuccessBody<T> {
  return {
    success: true,
    message,
    data,
  };
}

export const messageDataResponse = <T>(
  message: string,
  data: T,
): MessageDataResponse<T> => ({
  message,
  data,
});

export const messageOnlyResponse = (message: string): MessageOnlyResponse => ({
  message,
});
