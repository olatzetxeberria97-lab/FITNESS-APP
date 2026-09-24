# Despliegue de PULSE en iOS con Codemagic

Esta guia explica como compilar y publicar la app en la App Store sin necesidad de un Mac, usando Codemagic (https://codemagic.io).

## Requisitos previos

1. Cuenta de Apple Developer (99 USD/anio) — necesaria para firmar y publicar en la App Store.
2. Cuenta de Codemagic (plan con soporte iOS).
3. Repositorio Git con el codigo del proyecto (GitHub, GitLab o Bitbucket).

## Archivos incluidos en este repositorio

| Archivo | Funcion |
|---|---|
| `codemagic.yaml` | Configuracion del flujo de compilacion para Codemagic. Define los pasos: instalar dependencias, compilar la web, anadir plataforma iOS, sincronizar, compilar el IPA y subir a TestFlight. |
| `export-options.plist` | Opciones de exportacion del IPA firmado para la App Store. |
| `capacitor.config.ts` | Configuracion de Capacitor con permisos de geolocalizacion para iOS. |

## Variables de entorno a configurar en Codemagic

En el panel de Codemagic, ve a **App > Environment Variables** y anade estas variables (no las pongas en el codigo):

| Variable | Que es |
|---|---|
| `APP_STORE_CONNECT_ISSUER_ID` | ID del emisor de tu clave API de App Store Connect. |
| `APP_STORE_CONNECT_KEY_ID` | ID de la clave API creada en App Store Connect. |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Clave privada .p8 (contenido completo o base64). |
| `CERTIFICATE_PRIVATE_KEY` | Clave privada del certificado de firma, codificada en base64. |

Estas se obtienen desde:
- https://appstoreconnect.apple.com/access/integrations/api (para la clave API)
- https://developer.apple.com/account/resources/certificates (para el certificado de firma)

## Pasos en Codemagic

1. Conecta tu repositorio de Git a Codemagic.
2. Codemagic detectara automaticamente el archivo `codemagic.yaml`.
3. Configura las variables de entorno en el panel de Codemagic.
4. Reemplaza `YOUR_TEAM_ID` en `export-options.plist` por tu Team ID de Apple Developer (lo encuentras en https://developer.apple.com/account).
5. Lanza el build. Codemagic ejecutara:
   - `npm ci` — instala dependencias
   - `npm run build` — compila la web
   - `npx cap add ios` — crea el proyecto Xcode
   - `npx cap sync ios` — sincroniza plugins y assets web
   - `pod install` — instala dependencias nativas de iOS
   - `xcodebuild archive` — compila el archivo .xcarchive
   - `xcodebuild -exportArchive` — genera el .ipa firmado
   - Sube el IPA a TestFlight automaticamente

## Notas importantes

- La carpeta `ios/` no se sube al repositorio. Codemagic la genera en cada build con `npx cap add ios`.
- Los permisos de geolocalizacion (NSLocationWhenInUseUsageDescription) se configuran automaticamente desde `capacitor.config.ts` al ejecutar `npx cap sync ios`.
- Si necesitas GPS en segundo plano, anade manualmente el capability "Background Modes > Location updates" en el proyecto Xcode generado, o configuralo en el `codemagic.yaml` con un script post-sync.
- El `appId` en `capacitor.config.ts` (`com.fitness.community.app`) debe coincidir con el Bundle ID configurado en App Store Connect.
