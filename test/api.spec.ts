import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { CABECERA_API_KEY } from '../src/auth/api-key.service';

/**
 * Suite de la API.
 *
 * Son tres pruebas, deliberadamente pocas y de alcance amplio: cada una levanta la
 * aplicación completa —guard global, validación y controladores— y la ejercita
 * sobre HTTP real. Con esa forma, tres casos cubren lo que importa comprobar:
 *
 *   1. Que el CRUD hace su trabajo de principio a fin.
 *   2. Que las rutas están protegidas y la de salud no.
 *   3. Que la validación de entrada rechaza lo que debe.
 *
 * Se prefieren pruebas de extremo a extremo antes que unitarias porque el riesgo
 * real de este servicio no está en la lógica de un método aislado, sino en cómo
 * encajan las piezas: que el guard se aplique de verdad a todas las rutas, que el
 * pipe de validación esté activo, que los códigos de estado sean los correctos.
 */
describe('API de catálogo', () => {
  const API_KEY = 'clave-de-pruebas-2f7a91c4';
  const auth = { [CABECERA_API_KEY]: API_KEY };

  let app: INestApplication<App>;

  beforeAll(async () => {
    // La configuración se lee de process.env al construir el módulo.
    process.env.API_KEY = API_KEY;
    process.env.NODE_ENV = 'test';
    process.env.VERSION = 'pruebas';

    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = modulo.createNestApplication();
    // Se replica la configuración de main.ts para probar el mismo comportamiento
    // que tendrá el servicio desplegado.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('ejecuta el ciclo CRUD completo sobre un producto', async () => {
    const http = () => request(app.getHttpServer());

    // --- POST: crear ---
    const creado = await http()
      .post('/productos')
      .set(auth)
      .send({ sku: 'TEC-001', nombre: 'Teclado mecánico', precio: 899.5, stock: 12 })
      .expect(201);

    const { id } = creado.body;
    expect(creado.body).toMatchObject({ sku: 'TEC-001', precio: 899.5, stock: 12 });
    expect(creado.body.creadoEn).toBe(creado.body.actualizadoEn);

    // --- GET (todos) ---
    const listado = await http().get('/productos').set(auth).expect(200);
    expect(listado.body).toEqual([expect.objectContaining({ id })]);

    // --- GET (uno) ---
    const uno = await http().get(`/productos/${id}`).set(auth).expect(200);
    expect(uno.body.nombre).toBe('Teclado mecánico');

    // --- PUT: reemplazo completo ---
    const actualizado = await http()
      .put(`/productos/${id}`)
      .set(auth)
      .send({ sku: 'TEC-002', nombre: 'Teclado inalámbrico', precio: 1250, stock: 4 })
      .expect(200);

    expect(actualizado.body).toMatchObject({
      id, // el identificador se conserva
      sku: 'TEC-002',
      nombre: 'Teclado inalámbrico',
      stock: 4,
    });
    expect(actualizado.body.creadoEn).toBe(creado.body.creadoEn); // el alta no cambia

    // --- Regla de negocio: el SKU es único ---
    await http()
      .post('/productos')
      .set(auth)
      .send({ sku: 'TEC-002', nombre: 'Duplicado', precio: 10, stock: 1 })
      .expect(409);

    // --- DELETE ---
    await http().delete(`/productos/${id}`).set(auth).expect(204);
    await http().get(`/productos/${id}`).set(auth).expect(404);
    await http().get('/productos').set(auth).expect(200).expect([]);
  });

  it('protege el catálogo y deja públicas las rutas de información', async () => {
    const http = () => request(app.getHttpServer());

    // Sin cabecera.
    await http().get('/productos').expect(401);
    // Con una clave incorrecta de la misma longitud, para que el rechazo no
    // dependa de comparar longitudes.
    await http().get('/productos').set(CABECERA_API_KEY, 'x'.repeat(API_KEY.length)).expect(401);
    // La escritura también está cerrada, no solo la lectura.
    await http()
      .post('/productos')
      .send({ sku: 'ABC-123', nombre: 'Intruso', precio: 1, stock: 1 })
      .expect(401);

    // La salud responde sin credenciales: la consultan el balanceador y el pipeline.
    const salud = await http().get('/salud').expect(200);
    expect(salud.body).toMatchObject({ estado: 'ok', version: 'pruebas' });

    // La portada también, y anuncia la versión desplegada y las rutas.
    const portada = await http().get('/').expect(200);
    expect(portada.body).toMatchObject({
      servicio: 'catalogo-api',
      version: 'pruebas',
      rutas: { salud: '/salud', productos: '/productos' },
    });
  });

  it('rechaza cuerpos e identificadores que no cumplen las reglas', async () => {
    const http = () => request(app.getHttpServer());
    const valido = { sku: 'ABC-123', nombre: 'Producto', precio: 10, stock: 1 };

    // Falta un campo obligatorio: PUT y POST exigen el recurso completo.
    await http().post('/productos').set(auth).send({ nombre: 'Sin sku' }).expect(400);
    // Formato de SKU incorrecto (minúsculas).
    await http()
      .post('/productos')
      .set(auth)
      .send({ ...valido, sku: 'abc-123' })
      .expect(400);
    // Valores fuera de rango.
    await http()
      .post('/productos')
      .set(auth)
      .send({ ...valido, precio: -1 })
      .expect(400);
    await http()
      .post('/productos')
      .set(auth)
      .send({ ...valido, stock: 1.5 })
      .expect(400);
    // Propiedad no declarada en el DTO.
    await http()
      .post('/productos')
      .set(auth)
      .send({ ...valido, descuento: 50 })
      .expect(400);
    // Identificador con formato no UUID.
    await http().get('/productos/no-es-un-uuid').set(auth).expect(400);
  });
});
