import { BadRequestException } from '@nestjs/common';
import {
  detectarFormato,
  parsearCsv,
  parsearEstadoCuenta,
  parsearMonto,
  parsearOfx,
} from './estados-cuenta.parser';

describe('estados-cuenta.parser', () => {
  it('parsea CSV con delimitador punto y coma y montos europeos', () => {
    const csv = [
      'fecha;descripcion;referencia;cargo;abono;saldo',
      '2026-11-10;Cliente Demo;REF1;1.500,00;;2.000,00',
      '11/11/2026;Pago proveedor;REF2;;250,50;1.749,50',
    ].join('\n');

    const resultado = parsearCsv(csv);

    expect(resultado.errores).toHaveLength(0);
    expect(resultado.movimientos).toEqual([
      {
        fecha: '2026-11-10',
        descripcion: 'Cliente Demo',
        referencia: 'REF1',
        cargo: 1500,
        abono: 0,
        saldo: 2000,
      },
      {
        fecha: '2026-11-11',
        descripcion: 'Pago proveedor',
        referencia: 'REF2',
        cargo: 0,
        abono: 250.5,
        saldo: 1749.5,
      },
    ]);
  });

  it('interpreta el signo de una columna monto', () => {
    const csv = [
      'fecha,descripcion,monto',
      '2026-11-10,Cobro,100.00',
      '2026-11-11,Pago,-50.00',
    ].join('\n');

    const resultado = parsearCsv(csv);

    expect(resultado.errores).toHaveLength(0);
    expect(resultado.movimientos[0].cargo).toBe(100);
    expect(resultado.movimientos[1].abono).toBe(50);
  });

  it('rechaza un CSV sin columnas obligatorias', () => {
    expect(() => parsearCsv('foo,bar\n1,2')).toThrow(BadRequestException);
  });

  it('parsea transacciones OFX', () => {
    const ofx = `
      OFXHEADER:100
      <OFX>
      <BANKTRANLIST>
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20261110120000
      <TRNAMT>1500.00
      <FITID>ABC123
      <NAME>Cliente Demo
      <MEMO>Pago factura
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20261111120000
      <TRNAMT>-250.50
      <FITID>XYZ999
      <NAME>Proveedor
      </STMTTRN>
      </BANKTRANLIST>
      </OFX>`;

    const resultado = parsearOfx(ofx);

    expect(resultado.errores).toHaveLength(0);
    expect(resultado.movimientos).toEqual([
      {
        fecha: '2026-11-10',
        descripcion: 'Cliente Demo - Pago factura',
        referencia: 'ABC123',
        cargo: 1500,
        abono: 0,
        saldo: null,
      },
      {
        fecha: '2026-11-11',
        descripcion: 'Proveedor',
        referencia: 'XYZ999',
        cargo: 0,
        abono: 250.5,
        saldo: null,
      },
    ]);
  });

  it('detecta el formato por extensión o contenido', () => {
    expect(detectarFormato('estado.ofx', '')).toBe('ofx');
    expect(detectarFormato('estado.csv', 'fecha,descripcion,monto')).toBe(
      'csv',
    );
    expect(detectarFormato(undefined, 'OFXHEADER:100')).toBe('ofx');
  });

  it('parsea montos con símbolos y paréntesis', () => {
    expect(parsearMonto('$1,234.56')).toBe(1234.56);
    expect(parsearMonto('(250.00)')).toBe(-250);
    expect(parsearMonto('1.234,56')).toBe(1234.56);
  });

  it('parsea el estado de cuenta completo desde un buffer', () => {
    const buffer = Buffer.from(
      'fecha,descripcion,monto\n2026-11-10,Cobro,100\n',
    );
    const resultado = parsearEstadoCuenta(buffer, 'csv');
    expect(resultado.movimientos).toHaveLength(1);
  });
});
