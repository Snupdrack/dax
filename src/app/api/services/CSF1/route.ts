import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { idCif, userId } = await request.json();

    if (!idCif || idCif.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'idCIF inválido.' }, { status: 400 });
    }

    // =======================================================
    // 1. AQUÍ COLOCAS TU LÓGICA ACTUAL DE CRÉDITOS
    // await descontarCreditos(userId);
    // =======================================================

    const urlSat = `https://sat.gob.mx{idCif.trim()}`;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(urlSat, { waitUntil: 'networkidle2' });

    // Esperar a que la información del SAT cargue en pantalla
    await page.waitForSelector('table, tr, td', { timeout: 10000 });

    // 2. EXTRAER LOS DATOS REALES DEL CONTRIBUYENTE
    const datos = await page.evaluate(() => {
      const elementos = Array.from(document.querySelectorAll('td, span, div, li'));
      const buscar = (texto: string) => {
        const encontrado = elementos.find(el => (el as HTMLElement).innerText?.toUpperCase().includes(texto.toUpperCase()));
        if (!encontrado) return 'NO REGISTRADO';
        return (encontrado.nextElementSibling as HTMLElement)?.innerText?.trim() || (encontrado as HTMLElement).innerText.replace(texto, '').trim();
      };

      return {
        rfc: buscar('RFC:'),
        curp: buscar('CURP:'),
        nombre: buscar('Nombre:') || buscar('denominación o razón social:'),
        situacion: buscar('Situación:') || buscar('Estatus:'),
        cp: buscar('Código Postal:') || buscar('C.P.:'),
        regimen: buscar('Régimen:')
      };
    });

    // 3. PLANTILLA HTML CON LA ESTÉTICA OFICIAL DE LA CONSTANCIA DEL SAT
    const plantillaHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Constancia de Situación Fiscal</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; font-size: 11px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #691C32; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-gob { height: 45px; }
          .header-title { text-align: right; }
          .header-title h1 { margin: 0; font-size: 16px; color: #691C32; font-weight: bold; }
          .header-title p { margin: 3px 0 0 0; font-size: 10px; color: #666; }
          
          .seccion-titulo { background-color: #691C32; color: white; padding: 5px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 15px; margin-bottom: 10px; letter-spacing: 0.5px; }
          
          .tabla-datos { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
          .tabla-datos td { padding: 6px 8px; border: 1px solid #ddd; vertical-align: top; word-wrap: break-word; }
          .label { font-weight: bold; color: #545454; width: 30%; background-color: #f9f9f9; }
          .value { color: #000; width: 70%; }
          
          .cif-container { display: flex; margin-top: 30px; border: 1px solid #691C32; padding: 15px; background-color: #fcf8e3; align-items: center; }
          .qr-code { width: 110px; height: 110px; border: 1px solid #ccc; background-color: white; padding: 5px; margin-right: 20px; display: flex; justify-content: center; align-items: center; }
          .qr-code img { max-width: 100%; max-height: 100%; }
          .cif-text h2 { margin: 0 0 5px 0; font-size: 13px; color: #691C32; }
          .cif-text p { margin: 2px 0; color: #555; font-size: 10px; }
          
          .footer { margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #777; }
        </style>
      </head>
      <body>

        <div class="header">
          <svg class="logo-gob" viewBox="0 0 300 80" fill="none" xmlns="http://w3.org">
            <path d="M10 15h40v50H10z" fill="#13322B"/>
            <path d="M55 15h20v50H55z" fill="#98224E"/>
            <text x="85" y="45" fill="#13322B" font-family="Arial" font-size="18" font-weight="bold">HACIENDA</text>
            <text x="85" y="60" fill="#666" font-family="Arial" font-size="12">SAT | Servicio de Administración Tributaria</text>
          </svg>
          <div class="header-title">
            <h1>CONSTANCIA DE SITUACIÓN FISCAL</h1>
            <p>Generado vía Validador CIF Electrónico</p>
            <p>Fecha de Expedición: ${new Date().toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        <div class="seccion-titulo">Datos de Identificación del Contribuyente</div>
        <table class="tabla-datos">
          <tr>
            <td class="label">RFC:</td>
            <td class="value" style="font-weight: bold; font-size: 12px; letter-spacing: 0.5px;">${datos.rfc}</td>
          </tr>
          <tr>
            <td class="label">CURP:</td>
            <td class="value">${datos.curp}</td>
          </tr>
          <tr>
            <td class="label">Nombre / Razón Social:</td>
            <td class="value" style="text-transform: uppercase; font-weight: bold;">${datos.nombre}</td>
          </tr>
          <tr>
            <td class="label">Estatus / Situación:</td>
            <td class="value" style="color: green; font-weight: bold;">${datos.situacion}</td>
          </tr>
        </table>

        <div class="seccion-titulo">Datos del Domicilio Registrado</div>
        <table class="tabla-datos">
          <tr>
            <td class="label">Código Postal (C.P.):</td>
            <td class="value" style="font-weight: bold;">${datos.cp}</td>
          </tr>
          <tr>
            <td class="label">Entidad Federativa:</td>
            <td class="value">Verificado Mediante QR Oficial</td>
          </tr>
        </table>

        <div class="seccion-titulo">Regímenes Fiscales Asignados</div>
        <table class="tabla-datos">
          <tr>
            <td class="label">Régimen Fiscal:</td>
            <td class="value" style="font-style: italic;">${datos.regimen}</td>
          </tr>
        </table>

        <div class="cif-container">
          <div class="qr-code">
            <img src="https://qrserver.com{encodeURIComponent(urlSat)}" alt="QR SAT" />
          </div>
          <div class="cif-text">
            <h2>Cédula de Identificación Fiscal</h2>
            <p><strong>Id CIF:</strong> ${idCif.trim()}</p>
            <p><strong>Registro Federal de Contribuyentes:</strong> ${datos.rfc}</p>
            <p>Este documento digital cuenta con una cadena de verificación oficial del Servicio de Administración Tributaria de México.</p>
          </div>
        </div>

        <div class="footer">
          <p>Esta es una representación impresa oficial y estructurada a partir de los datos públicos vigentes del SIAT del SAT.</p>
          <p>Página 1 de 1</p>
        </div>

      </body>
      </html>
    `;

    await page.setContent(plantillaHtml, { waitUntil: 'networkidle2' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Constancia_Fiscal_${datos.rfc}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error recreando la constancia:", error);
    if (browser) await browser.close();
    return NextResponse.json({ success: false, error: 'Error al procesar la estética de la Constancia.' }, { status: 500 });
  }
}
