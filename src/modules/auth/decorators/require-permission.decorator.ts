import { SetMetadata } from '@nestjs/common';

export const PERMISSION_ROUTE_KEY = 'permission_route';
export const ADMINISTRATOR_ONLY_KEY = 'administrator_only';
export const SKIP_PERMISSION_KEY = 'skip_permission';

export const RequirePermission = (ruta: string) =>
  SetMetadata(PERMISSION_ROUTE_KEY, ruta);

export const RequireAdministrator = () =>
  SetMetadata(ADMINISTRATOR_ONLY_KEY, true);

export const SkipPermission = () => SetMetadata(SKIP_PERMISSION_KEY, true);
