import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener tokens JWT' })
  @ApiResponse({
    status: 201,
    description:
      'Login exitoso, devuelve el access token, el refresh token y los datos del usuario.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas o usuario inactivo.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refrescar el access token usando un refresh token',
  })
  @ApiResponse({
    status: 201,
    description: 'Refresco exitoso, devuelve un nuevo par de tokens.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de refresco inválido, expirado o revocado.',
  })
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar token de recuperación de contraseña' })
  @ApiResponse({
    status: 201,
    description: 'Si el correo existe, devuelve un token de recuperación.',
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer la contraseña usando un token de recuperación',
  })
  @ApiResponse({
    status: 201,
    description: 'Contraseña actualizada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado o ya utilizado.',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('perfil')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiBearerAuthDoc()
  @ApiErrorResponses(401, 403, 500)
  @ApiOperation({
    summary: 'Obtener información del usuario autenticado actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna los datos decodificados del token JWT.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado (token inválido o no suministrado).',
  })
  obtenerPerfil(@GetUser() user: any) {
    return user;
  }
}
