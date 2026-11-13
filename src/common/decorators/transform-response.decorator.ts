import { Type } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const TRANSFORM_RESPONSE_META = 'transform_response_meta';

export type TransformResponseType = 'data' | 'paged' | 'created' | 'message';

export interface TransformResponseMeta {
  type: TransformResponseType;
  dto?: Type<unknown>;
  message?: string;
  idKey?: string;
}

/**
 * Envuelve el valor retornado por el controlador en una estructura uniforme:
 *  - 'data'   -> { data }
 *  - 'paged'  -> { total, data } (el controlador retorna { total, data })
 *  - 'created'-> { message, data: { idKey: valor } }
 *  - 'message'-> { message }
 */
export function TransformResponse(meta: TransformResponseMeta) {
  return SetMetadata(TRANSFORM_RESPONSE_META, meta);
}

export function TransformData(dto?: Type<unknown>) {
  return TransformResponse({ type: 'data', dto });
}

export function TransformPaged(dto?: Type<unknown>) {
  return TransformResponse({ type: 'paged', dto });
}

export function TransformCreated(idKey: string = 'id', dto?: Type<unknown>) {
  return TransformResponse({ type: 'created', idKey, dto });
}

export function TransformMessage(message?: string) {
  return TransformResponse({ type: 'message', message });
}
