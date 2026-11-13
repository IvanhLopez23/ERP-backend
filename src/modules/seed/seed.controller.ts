import {
  Controller,
  Get,
  Headers,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';
import { DesarrolloSeedService } from './desarrollo.seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly desarrolloSeedService: DesarrolloSeedService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Ejecutar seed de datos iniciales',
    description:
      'Endpoint que se ejecuta al iniciar el proyecto para cargar los datos por defecto necesarios para arrancar la aplicación (roles, usuarios, pantallas y permisos).',
  })
  @ApiResponse({ status: 200, description: 'Seed ejecutado correctamente.' })
  executeSeed() {
    return this.seedService.executeSeed();
  }

  @Post('desarrollo')
  @ApiOperation({
    summary: 'Levantar ambiente de desarrollo',
    description:
      'Inicializa un ambiente de desarrollo completo: datos base de inicio.ts, catálogos con al menos un registro por defecto y registros demo operativos. Solo disponible en ambiente de desarrollo y requiere la clave de desarrollo en el header x-development-seed-key.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ambiente de desarrollo inicializado.',
  })
  @ApiResponse({
    status: 403,
    description: 'No permitido en producción o clave inválida.',
  })
  executeDesarrollo(@Headers('x-development-seed-key') seedKey: string) {
    this.validarAmbienteDesarrollo(seedKey);
    return this.desarrolloSeedService.executeDesarrolloSeed();
  }

  private validarAmbienteDesarrollo(seedKey: string) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      throw new ForbiddenException(
        'El seed de desarrollo no está permitido en producción.',
      );
    }

    const expectedKey = this.configService.get<string>(
      'DEVELOPMENT_SEED_KEY',
      'dev-seed-2026',
    );
    if (seedKey !== expectedKey) {
      throw new ForbiddenException(
        'Clave de desarrollo inválida en el header x-development-seed-key.',
      );
    }
  }
}
