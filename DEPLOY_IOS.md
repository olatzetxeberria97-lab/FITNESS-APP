# Despliegue de PULSE en iOS con Codemagic

Esta guía explica cómo compilar y publicar la app en la App Store usando Codemagic (https://codemagic.io).

## Requisitos previos

1. **Cuenta de Apple Developer** (99 USD/año) — necesaria para firmar y publicar.
2. **Cuenta de Codemagic** con soporte iOS (plan mac_mini_m2 o superior).
3. **Repositorio Git** con el código del proyecto (GitHub, GitLab o Bitbucket).
4. **App Store Connect** configurada con tu app registrada (ver paso 1 más abajo).

## Archivos incluidos en este repositorio

| Archivo | Función |
|---|---|
| `codemagic.yaml` | Flujo de compilación: instala dependencias, compila la web, añade iOS, inyecta versión/permisos, construye el IPA. |
| `export-options.plist` | Opciones de exportación del IPA firmado para la App Store. |
| `capacitor.config.ts` | Configuración de Capacitor: Bundle ID, nombre de la app, permisos de GPS y biometría. |
| `package.json` | Versión de la app (`1.0.0`) que se inyecta como `MARKETING_VERSION` en Xcode. |

## Paso 1: Registrar la app en App Store Connect

1. Entra en https://appstoreconnect.apple.com → "Mis Apps" → "+" → "Nueva App".
2. **Bundle ID**: `com.olatz.fitnessapp` (debe coincidir exactamente con `capacitor.config.ts`).
3. **SKU**: un identificador interno único (ej. `pulse2026`).
4. **Idioma principal**: Español (o el que prefieras).
5. Una vez creada, anota el **App ID**.

## Paso 2: Configurar variables en Codemagic

En el panel de Codemagic: **App → Environment Variables** (o usa el grupo `apple_credentials`):

| Variable | Qué es |
|---|---|
| `APP_STORE_CONNECT_ISSUER_ID` | ID del emisor de tu clave API de App Store Connect. |
| `APP_STORE_CONNECT_KEY_ID` | ID de la clave API creada en App Store Connect. |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Clave privada .p8 (contenido completo). |

Obtén las claves API en: https://appstoreconnect.apple.com/access/integrations/api

El certificado de firma y el provisioning profile se gestionan automáticamente por Codemagic cuando usas `xcode-project build-ipa` con el grupo `apple_credentials` configurado.

## Paso 3: Añadir el icono de la app (IMPORTANTE)

La carpeta `ios/` se genera automáticamente en cada build, pero **el icono de la app no se puede generar desde el código**. Tienes dos opciones:

### Opción A: Subir el icono manualmente tras el primer build
1. Lanza un primer build en Codemagic y descarga el artefacto `.xcarchive`.
2. Abre el `.xcarchive` en Xcode (en un Mac o máquina virtual).
3. En `Images.xcassets` → `AppIcon`, arrastra tu icono en los tamaños requeridos.
4. Commit los cambios a `ios/App/App/Assets.xcassets` y sube esa carpeta al repositorio.

### Opción B: Usar un script de generación de iconos
Si tienes un PNG de 1024x1024 px, puedes añadir este paso al `codemagic.yaml` antes de "Instalar Pods":

```yaml
- name: Generar icono de la app
  script: |
    # Coloca tu icono de 1024x1024 en resources/app-icon.png
    if [ -f "resources/app-icon.png" ]; then
      npx capacitor-assets generate --ios --iconPath resources/app-icon.png
    fi
```

Necesitarás instalar `@capacitor/assets` como dependencia dev: `npm i -D @capacitor/assets`.

## Paso 4: Lanzar el build

1. Conecta tu repositorio a Codemagic.
2. Codemagic detectará automáticamente el `codemagic.yaml`.
3. Verifica que las variables de entorno están configuradas.
4. Lanza el build. El flujo ejecutará:
   - `npm install` — instala dependencias
   - `npm run build` — compila la web
   - `npx cap add ios` + `npx cap sync ios` — crea el proyecto Xcode
   - Inyecta versión (`1.0.0`) y build number (fecha actual, ej. `20260926`)
   - Inyecta permisos iOS (cámara, galería, GPS, Face ID) en `Info.plist`
   - Configura la pantalla de inicio
   - `pod install` — instala dependencias nativas
   - `xcode-project build-ipa` — compila y firma el IPA
5. El IPA se sube automáticamente a TestFlight.

## Permisos iOS configurados

El `codemagic.yaml` inyecta automáticamente estos permisos en `Info.plist`:

| Permiso | Uso en la app |
|---|---|
| `NSCameraUsageDescription` | Subir fotos de entrenamientos y avatar |
| `NSPhotoLibraryUsageDescription` | Seleccionar fotos de la galería |
| `NSLocationWhenInUseUsageDescription` | GPS para registrar entrenamientos |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | GPS en segundo plano |
| `NSFaceIDUsageDescription` | Login biométrico con Face ID |

## Notas importantes

- La carpeta `ios/` **no se sube al repositorio**. Se genera en cada build.
- El `appId` en `capacitor.config.ts` es `com.olatz.fitnessapp` y debe coincidir con el Bundle ID de App Store Connect.
- El número de build se genera con la fecha actual (`YYYYMMDD`), por lo que cada día produce un build number único. Si necesitas múltiples builds en el mismo día, añade un sufijo manualmente.
- Si App Store Connect rechaza el build por "duplicate build number", simplemente vuelve a lanzar el build al día siguiente o cambia la fórmula del build number en `codemagic.yaml`.
- Para enviar a revisión de la App Store (no solo TestFlight), entra en App Store Connect → tu app → "TestFlight" → selecciona el build → "Enviar para revisión".
