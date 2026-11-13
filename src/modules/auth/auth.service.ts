import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { verifyPassword } from 'src/common/helpers/crypto.helper';
import { BitacoraAccesosService } from 'src/modules/bitacora-accesos/bitacora-accesos.service';
import { UsuariosService } from 'src/modules/usuarios/usuarios.service';
import { MailService } from 'src/core/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly bitacoraAccesosService: BitacoraAccesosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { nombreUsuario, contrasena } = loginDto;

    const usuario =
      await this.usuariosService.buscarPorNombreUsuario(nombreUsuario);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('El usuario se encuentra inactivo');
    }

    const contrasenaValida = await verifyPassword(
      contrasena,
      usuario.contrasena,
    );
    if (!contrasenaValida) {
      await this.bitacoraAccesosService.crear({
        usuarioId: usuario.id,
        descripcion: 'Credenciales incorrectas',
        acceso: false,
      });
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    await this.bitacoraAccesosService.crear({
      usuarioId: usuario.id,
      descripcion: 'Autorizado',
      acceso: true,
    });

    return this.generateTokens(usuario);
  }

  async generateTokens(usuario: any) {
    if (typeof usuario.publicId !== 'string') {
      throw new UnauthorizedException('El usuario no tiene un publicId válido');
    }
    if (typeof usuario.rol?.publicId !== 'string') {
      throw new UnauthorizedException(
        'El usuario no tiene un rol público válido',
      );
    }

    const payload = {
      sub: usuario.publicId,
      rolId: usuario.rol.publicId,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
    };

    const token = this.jwtService.sign(payload);

    const refreshPayload = { sub: usuario.publicId };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
        '7d') as any,
    });

    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');

    const expiresInStr =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpirationDate(expiresInStr);

    const tokenRecord = this.refreshTokenRepository.create({
      token: hashedToken,
      usuarioId: usuario.id,
      expiresAt,
    });
    await this.refreshTokenRepository.save(tokenRecord);

    return {
      token,
      refreshToken,
      ...(await this.usuariosService.buscarPermisos(usuario.id)),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const hashedToken = createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: hashedToken, revoked: false },
      });

      if (!storedToken) {
        throw new UnauthorizedException(
          'Token de refresco inválido o revocado',
        );
      }

      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Token de refresco expirado');
      }

      const usuario = await this.usuariosService.buscarPorIdInterno(
        storedToken.usuarioId,
      );
      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException('Usuario inactivo o no encontrado');
      }

      storedToken.revoked = true;
      await this.refreshTokenRepository.save(storedToken);

      return this.generateTokens(usuario);
    } catch (error) {
      throw new UnauthorizedException(
        'Token de refresco inválido, revocado o expirado',
      );
    }
  }

  async revocarRefreshTokens(usuarioId: number) {
    await this.refreshTokenRepository.update(
      { usuarioId, revoked: false },
      { revoked: true },
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { correo } = forgotPasswordDto;

    // Buscar usuario por correo (sin revelar si existe)
    const usuario = await this.usuariosService.buscarPorCorreo(correo);

    if (!usuario) {
      return {
        message:
          'Si el correo está registrado, recibirás un token de recuperación.',
      };
    }

    // Invalidar tokens anteriores del mismo usuario
    await this.passwordResetTokenRepository.update(
      { usuarioId: usuario.id, used: false },
      { used: true },
    );

    // Generar token aleatorio seguro
    const resetToken = randomBytes(32).toString('hex');

    // Hashear para almacenamiento
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');

    // Calcular expiración
    const expiresInStr =
      this.configService.get<string>('PASSWORD_RESET_EXPIRES_IN') || '1h';
    const expiresAt = this.calculateExpirationDate(expiresInStr);

    // Guardar en BD
    const tokenRecord = this.passwordResetTokenRepository.create({
      token: hashedToken,
      usuarioId: usuario.id,
      expiresAt,
    });
    await this.passwordResetTokenRepository.save(tokenRecord);

    // Enviar correo con el token
    await this.mailService.sendPasswordResetEmail(
      usuario.correo,
      resetToken,
      usuario.nombreUsuario,
    );

    return {
      message:
        'Si el correo está registrado, recibirás un token de recuperación.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, nuevaContrasena } = resetPasswordDto;

    const hashedToken = createHash('sha256').update(token).digest('hex');

    const storedToken = await this.passwordResetTokenRepository.findOne({
      where: { token: hashedToken, used: false },
    });

    if (!storedToken) {
      throw new BadRequestException(
        'Token de recuperación inválido o ya utilizado',
      );
    }

    if (new Date() > storedToken.expiresAt) {
      throw new BadRequestException('Token de recuperación expirado');
    }

    // Actualizar contraseña (el método interno hashea automáticamente)
    const usuario = await this.usuariosService.buscarPorIdInterno(
      storedToken.usuarioId,
    );
    if (!usuario) throw new BadRequestException('Usuario no encontrado');
    await this.usuariosService.actualizarContrasena(usuario.publicId, {
      contrasena: nuevaContrasena,
    });

    // Marcar token como usado
    storedToken.used = true;
    await this.passwordResetTokenRepository.save(storedToken);

    // Revocar todos los refresh tokens del usuario
    await this.revocarRefreshTokens(storedToken.usuarioId);

    return {
      message: 'Contraseña actualizada correctamente.',
    };
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const value = parseInt(expiresIn, 10);
    const unit = expiresIn.replace(value.toString(), '').trim().toLowerCase();

    const date = new Date();
    switch (unit) {
      case 'd':
      case 'days':
      case 'day':
        date.setDate(date.getDate() + value);
        break;
      case 'h':
      case 'hours':
      case 'hour':
        date.setHours(date.getHours() + value);
        break;
      case 'm':
      case 'minutes':
      case 'minute':
        date.setMinutes(date.getMinutes() + value);
        break;
      case 's':
      case 'seconds':
      case 'second':
        date.setSeconds(date.getSeconds() + value);
        break;
      default:
        date.setDate(date.getDate() + 7);
    }
    return date;
  }
}
