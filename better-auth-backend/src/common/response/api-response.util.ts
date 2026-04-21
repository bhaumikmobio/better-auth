/**
 * Standard API envelope (aligned with `{ message, data }` already used by the frontend).
 */
export type ApiSuccessBody<T> = {
  success: true;
  message: string;
  data: T;
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
