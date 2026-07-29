import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { GuardarProductoDto } from './dto/guardar-producto.dto';
import { Producto } from './producto.entity';
import { ProductosService } from './productos.service';

/**
 * Rutas REST del catálogo.
 *
 * Todas están protegidas: el `ApiKeyGuard` está registrado de forma global en
 * `AppModule`, así que una petición sin cabecera `x-api-key` válida recibe 401
 * antes de llegar a cualquiera de estos métodos.
 *
 * El controlador solo traduce HTTP a llamadas del servicio; no contiene lógica.
 */
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Post()
  crear(@Body() datos: GuardarProductoDto): Producto {
    return this.productos.crear(datos);
  }

  @Get()
  listar(): Producto[] {
    return this.productos.listar();
  }

  // `ParseUUIDPipe` descarta con 400 los ids mal formados antes de tocar el
  // almacenamiento, de modo que un 404 siempre significa "no existe" y no
  // "escribiste mal el identificador".
  @Get(':id')
  obtener(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Producto {
    return this.productos.obtener(id);
  }

  @Put(':id')
  reemplazar(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() datos: GuardarProductoDto,
  ): Producto {
    return this.productos.reemplazar(id, datos);
  }

  // 204 No Content es la respuesta idiomática de un DELETE que no devuelve cuerpo.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): void {
    this.productos.eliminar(id);
  }
}
