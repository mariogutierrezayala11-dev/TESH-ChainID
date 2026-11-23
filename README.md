# TESH-ChainID
### Aplicación descentralizada de credenciales académicas

TESH-ChainID es un prototipo académico que utiliza tecnología blockchain para registrar, verificar y revocar credenciales académicas. Su propósito es proporcionar una capa adicional de autenticidad, integridad y trazabilidad para documentos digitales mediante Solana.

El sistema utiliza hashes criptográficos SHA-256 para identificar documentos sin almacenar el archivo PDF completo en la blockchain.

## Objetivo

Desarrollar un prototipo funcional de gestión y verificación de credenciales académicas utilizando un contrato inteligente escrito en Rust con Anchor, desplegado en Solana Devnet e integrado con una aplicación web.

## Funcionalidades implementadas

- Inicialización de la autoridad emisora.
- Conexión de wallet mediante Phantom.
- Selección de documentos PDF.
- Generación de hashes SHA-256.
- Registro de credenciales en Solana Devnet.
- Verificación de autenticidad e integridad mediante el hash.
- Revocación de credenciales.
- Identificación de credenciales revocadas.
- Validación de permisos de la autoridad emisora.

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Blockchain | Solana Devnet |
| Contrato inteligente | Rust |
| Framework blockchain | Anchor |
| Interfaz web | React |
| Lenguaje frontend | TypeScript |
| Herramienta de desarrollo | Vite |
| Comunicación con Solana | @solana/web3.js |
| Wallet | Phantom |
| Hash criptográfico | SHA-256 |
| Pruebas automatizadas | Rust y LiteSVM |

## Arquitectura general

La aplicación se compone de tres elementos principales:

1. **Frontend:** permite seleccionar documentos, conectar la wallet y ejecutar las operaciones disponibles.
2. **Programa on-chain:** valida la autoridad emisora y administra las cuentas de credenciales.
3. **Solana Devnet:** almacena los registros y procesa las transacciones.

## Flujo de funcionamiento

1. El administrador conecta su wallet Phantom.
2. Inicializa la autoridad emisora.
3. Selecciona un documento PDF.
4. La aplicación calcula su hash SHA-256.
5. El administrador registra el hash en Solana.
6. El sistema permite verificar la credencial.
7. La autoridad puede revocar una credencial.
8. Una credencial revocada deja de considerarse válida.

## Seguridad y privacidad

- Los documentos PDF completos no se almacenan en blockchain.
- Se utiliza SHA-256 para comprobar la integridad de los documentos.
- Las operaciones administrativas requieren autorización de la wallet configurada.
- Las credenciales revocadas conservan su registro y estado.
- Se recomienda utilizar exclusivamente documentos de prueba y wallets de Devnet.
- Nunca deben compartirse claves privadas ni frases semilla.

## Información del despliegue

**Red:** Solana Devnet

**Program ID:**
```text
55vPWYLosYovBDxJekJJBkWn56kvfHXSDADnW2Wun3W5
```

**Solana Explorer:**

https://explorer.solana.com/address/55vPWYLosYovBDxJekJJBkWn56kvfHXSDADnW2Wun3W5?cluster=devnet

**Transacción de registro:**

https://explorer.solana.com/tx/66q1kMTDTigjBieMDDryqve6WaGoqVXddAo4uVb2yywDysh3FJFNSGzpbc8W9geyVpqWZQFpRi3VzAq46hnARAHt?cluster=devnet

## Estructura del proyecto

```text
TESH-ChainID/
├── evidencias/
│   ├── 01-despliegue/
│   ├── 02-wallet/
│   ├── 03-inicializacion/
│   ├── 04-registro/
│   ├── 05-verificacion/
│   ├── 06-revocacion/
│   └── 07-pruebas/
├── onchain/
│   ├── programs/
│   │   └── onchain/
│   │       ├── src/
│   │       │   ├── instructions/
│   │       │   ├── constants.rs
│   │       │   ├── error.rs
│   │       │   ├── lib.rs
│   │       │   └── state.rs
│   │       └── tests/
│   │           └── chain_id_tests.rs
│   ├── app/
│   │   ├── public/
│   │   │   └── idl/
│   │   └── src/
│   ├── Anchor.toml
│   ├── Cargo.toml
│   └── Cargo.lock
├── .gitignore
└── README.md
```

## Requisitos previos

- Rust y Cargo.
- Solana CLI.
- Anchor CLI.
- Node.js y npm.
- Extensión Phantom.
- Una wallet de prueba configurada para Solana Devnet.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/mariogutierrezayala11-dev/TESH-ChainID.git
cd TESH-ChainID
```

### 2. Compilar y probar el programa

```bash
cd onchain
cargo test -p onchain
```

### 3. Instalar dependencias del frontend

```bash
cd app
npm install
```

### 4. Ejecutar la aplicación

```bash
npm run dev
```

Abrir en el navegador la dirección que indique Vite, normalmente:

```text
http://localhost:5173
```

Para utilizar las operaciones de blockchain se necesita conectar Phantom y seleccionar Solana Devnet.

**Nota:** La configuración local de Anchor debe apuntar a una wallet de Devnet propia. No se deben subir archivos de claves privadas al repositorio.

## Pruebas realizadas

Se ejecutó la prueba de integración:

```bash
cargo test -p onchain
```

Resultado obtenido:

```text
test test_tesh_chain_id_complete_flow ... ok

test result: ok. 1 passed; 0 failed
```

La prueba de integración contempla los siguientes escenarios:

1. Inicialización.
2. Registro de credencial.
3. Verificación de credencial válida.
4. Rechazo de credencial inexistente.
5. Revocación.
6. Rechazo de verificación posterior a la revocación.
7. Rechazo de una segunda revocación.

## Alcance y limitaciones del prototipo

La versión entregada implementa el núcleo de registro, verificación y revocación de credenciales.

La propuesta original contempla funcionalidades adicionales que no forman parte de esta versión, entre ellas:

- Registro independiente de perfiles de estudiantes.
- Gestión completa de la configuración institucional.
- Actualización de metadatos y control de versiones.
- Consulta de credenciales asociadas a cada estudiante.
- Portal de verificación pública mediante folio.
- Cierre de cuentas temporales.

Estas funcionalidades quedan identificadas como trabajo futuro y no se presentan como implementadas.

## Evidencias

La carpeta `evidencias/` contiene capturas del despliegue, conexión de wallet, inicialización, registro, verificación, revocación y pruebas automatizadas.

## Consideraciones

TESH-ChainID es un prototipo académico desplegado en Solana Devnet. No representa un servicio institucional en producción ni sustituye los sistemas oficiales de control escolar del TESH.

---

**TESH-ChainID | Proyecto académico**

Tecnología blockchain aplicada a la autenticidad y verificación de credenciales académicas.
