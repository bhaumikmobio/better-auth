import { HttpStatus } from '@nestjs/common';

/** Named HTTP status codes (Nest `HttpStatus`) for consistent controller usage. */
export const STATUS_CODE_SUCCESS = HttpStatus.OK;
export const STATUS_CODE_CREATED = HttpStatus.CREATED;
export const STATUS_CODE_BAD_REQUEST = HttpStatus.BAD_REQUEST;
export const STATUS_CODE_UNAUTHORIZED = HttpStatus.UNAUTHORIZED;
export const STATUS_CODE_FORBIDDEN = HttpStatus.FORBIDDEN;
export const STATUS_CODE_NOT_FOUND = HttpStatus.NOT_FOUND;
export const STATUS_CODE_INTERNAL_SERVER_STATUS =
  HttpStatus.INTERNAL_SERVER_ERROR;
