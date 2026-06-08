import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message: string;
}

/**
 * Wraps every successful response in the `{ data, message }` shape so the
 * frontend always reads from the same envelope. A handler may return either a
 * raw payload or an already-shaped `{ data, message }` object.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'message' in payload
        ) {
          return payload as ApiResponse<T>;
        }
        return { data: payload as T, message: 'Success' };
      }),
    );
  }
}
