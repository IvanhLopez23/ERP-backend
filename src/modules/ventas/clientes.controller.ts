import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Put,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ClienteResponseDto } from './dto/cliente.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Ventas - Clientes')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/ventas/clientes')
@Controller('ventas/clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiCreateDoc(ClienteResponseDto, 'cliente')
  crear(@Body() dto: CreateClienteDto) {
    return this.clientesService.crearCliente(dto);
  }

  @Get()
  @ApiGetDoc(ClienteResponseDto, 'clientes')
  buscar() {
    return this.clientesService.buscarClientes();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(ClienteResponseDto, 'clientes')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.clientesService.paginarClientes(paginacionDto);
  }

  @Get('tipo')
  @ApiGetDoc(ClienteResponseDto, 'clientes')
  buscarPorTipo(@Query('tipo') tipo: string) {
    return this.clientesService.buscarClientesPorTipo(tipo);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(ClienteResponseDto, 'cliente')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.clientesService.buscarClientePorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('cliente')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.actualizarCliente(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('cliente')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.clientesService.activarDesactivarCliente(publicId);
  }
}
