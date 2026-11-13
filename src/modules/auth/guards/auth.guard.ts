import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { PUBLIC_ID_PATTERN } from '../../../common/validation/public-id';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload?.scope === 'ws') {
        throw new UnauthorizedException(
          'El ticket de WebSocket no es válido para la API REST',
        );
      }

      const publicId = payload?.sub;
      if (typeof publicId !== 'string' || !PUBLIC_ID_PATTERN.test(publicId)) {
        throw new UnauthorizedException('Token sin publicId válido');
      }

      const usuario = await this.usuariosService.buscarPorId(publicId);
      if (!usuario || !usuario.activo || !usuario.rol?.activo) {
        throw new UnauthorizedException('Usuario inactivo o rol inactivo');
      }

      // Adjuntar el payload de usuario a la petición
      request['user'] = {
        ...payload,
        internalId: usuario.id,
        internalRoleId: usuario.rolId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
