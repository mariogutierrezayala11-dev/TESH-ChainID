import { Buffer } from "buffer";
import { useState } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import "./App.css";

const PROGRAM_ID = new PublicKey(
  "55vPWYLosYovBDxJekJJBkWn56kvfHXSDADnW2Wun3W5"
);

const RPC = "https://api.devnet.solana.com";
const connection = new Connection(RPC, "confirmed");

const DISC = {
  initialize: [175, 175, 109, 31, 13, 152, 155, 237],
  register: [1, 125, 182, 19, 180, 151, 48, 231],
  revoke: [38, 123, 95, 95, 223, 158, 169, 87],
  verify: [139, 189, 60, 127, 32, 241, 162, 134],
};

type WalletProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
};

declare global {
  interface Window {
    solana?: WalletProvider;
  }
}

function getPdas(hash?: Uint8Array) {
  const [config] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("config")],
    PROGRAM_ID
  );

  const credential = hash
    ? PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("credential"), hash],
        PROGRAM_ID
      )[0]
    : null;

  return { config, credential };
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("El hash debe contener exactamente 64 caracteres hexadecimales.");
  }

  return new Uint8Array(
    hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashFile(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return new Uint8Array(digest);
}

function makeInstruction(
  discriminator: number[],
  accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
  hash?: Uint8Array
) {
  const data = new Uint8Array([
    ...discriminator,
    ...(hash ? Array.from(hash) : []),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: accounts,
    data: Buffer.from(data),
  });
}

export default function App() {
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [lookupHash, setLookupHash] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [credentialInfo, setCredentialInfo] = useState("");

  const shortWallet = wallet
    ? `${wallet.toBase58().slice(0, 6)}...${wallet.toBase58().slice(-6)}`
    : "";

  async function connectWallet() {
    try {
      if (!window.solana?.isPhantom) {
        throw new Error("Instala Phantom Wallet para continuar.");
      }

      const response = await window.solana.connect();
      setWallet(response.publicKey);
      setStatus("Wallet conectada correctamente.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo conectar la wallet.");
    }
  }

  async function disconnectWallet() {
    await window.solana?.disconnect();
    setWallet(null);
    setStatus("Wallet desconectada.");
  }

  async function sendInstruction(ix: TransactionInstruction) {
    if (!wallet || !window.solana) {
      throw new Error("Primero conecta Phantom.");
    }

    const transaction = new Transaction().add(ix);
    const latest = await connection.getLatestBlockhash("confirmed");

    transaction.feePayer = wallet;
    transaction.recentBlockhash = latest.blockhash;

    const result = await window.solana.signAndSendTransaction(transaction);

    const confirmation = await connection.confirmTransaction(
      {
        signature: result.signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("La transacción fue rechazada por Solana.");
    }

    return result.signature;
  }

  async function initializeIssuer() {
    setBusy(true);
    setStatus("");

    try {
      if (!wallet) throw new Error("Conecta Phantom primero.");

      const { config } = getPdas();
      const existing = await connection.getAccountInfo(config);

      if (existing) {
        setStatus("La autoridad emisora ya está inicializada.");
        return;
      }

      const ix = makeInstruction(DISC.initialize, [
        { pubkey: wallet, isSigner: true, isWritable: true },
        { pubkey: config, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const signature = await sendInstruction(ix);
      setStatus(`Emisor inicializado. Transacción: ${signature}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error al inicializar.");
    } finally {
      setBusy(false);
    }
  }

  async function registerCredential() {
    setBusy(true);
    setStatus("");

    try {
      if (!wallet) throw new Error("Conecta Phantom primero.");
      if (!file) throw new Error("Selecciona un archivo de certificado.");

      const digest = await hashFile(file);
      const hashHex = bytesToHex(digest);
      const { config, credential } = getPdas(digest);

      if (!credential) throw new Error("No se pudo generar la PDA.");

      const ix = makeInstruction(
        DISC.register,
        [
          { pubkey: config, isSigner: false, isWritable: false },
          { pubkey: wallet, isSigner: true, isWritable: true },
          { pubkey: credential, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        digest
      );

      const signature = await sendInstruction(ix);
      setHash(hashHex);
      setLookupHash(hashHex);
      setStatus(`Certificado registrado. Transacción: ${signature}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error al registrar.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCredential() {
    setBusy(true);
    setStatus("");
    setCredentialInfo("");

    try {
      const digest = hexToBytes(lookupHash);
      const { credential } = getPdas(digest);

      if (!credential) throw new Error("No se pudo generar la PDA.");

      const account = await connection.getAccountInfo(credential);

      if (!account) {
        setCredentialInfo("No se encontró una credencial registrada.");
        return;
      }

      const data = account.data;

      if (data.length < 89) {
        throw new Error("Los datos de la cuenta están incompletos.");
      }

      const storedHash = bytesToHex(data.slice(8, 40));
      if (storedHash !== lookupHash.toLowerCase()) {
        throw new Error("El hash de la cuenta no coincide.");
      }

      const issuer = new PublicKey(data.slice(40, 72)).toBase58();
      const revoked = data[80] === 1;
      const issuedAt = Number(
        new DataView(data.buffer, data.byteOffset + 72, 8).getBigInt64(0, true)
      );

      setCredentialInfo(
        `Emisor: ${issuer}\nFecha de emisión: ${new Date(issuedAt * 1000).toLocaleString()}\nEstado: ${revoked ? "REVOCADO" : "REGISTRADO"}`
      );

      if (revoked) {
        setStatus("La credencial existe, pero fue revocada.");
        return;
      }

      const ix = makeInstruction(DISC.verify, [
        { pubkey: credential, isSigner: false, isWritable: false },
      ], digest);

      const signature = await sendInstruction(ix);
      setStatus(`Credencial auténtica y válida. Transacción: ${signature}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error al verificar.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeCredential() {
    setBusy(true);
    setStatus("");

    try {
      if (!wallet) throw new Error("Conecta la wallet de la autoridad emisora.");

      const digest = hexToBytes(lookupHash);
      const { config, credential } = getPdas(digest);

      if (!credential) throw new Error("No se pudo generar la PDA.");

      const ix = makeInstruction(
        DISC.revoke,
        [
          { pubkey: config, isSigner: false, isWritable: false },
          { pubkey: wallet, isSigner: true, isWritable: false },
          { pubkey: credential, isSigner: false, isWritable: true },
        ],
        digest
      );

      const signature = await sendInstruction(ix);
      setStatus(`Credencial revocada. Transacción: ${signature}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error al revocar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <div>
            <h1>TESH-ChainID</h1>
            <span>Identidad académica verificable</span>
          </div>
        </div>
        <span className="network">● SOLANA DEVNET</span>
      </header>

      <section className="hero">
        <span className="eyebrow">BLOCKCHAIN · CERTIFICADOS ACADÉMICOS</span>
        <h2>Confianza académica, <span>verificada en blockchain.</span></h2>
        <p>
          Registra, consulta y verifica la autenticidad de certificados
          mediante hashes SHA-256 y Solana.
        </p>
        <button
          className="wallet-button"
          onClick={wallet ? disconnectWallet : connectWallet}
        >
          {wallet ? `Conectada: ${shortWallet} · Desconectar` : "Conectar Phantom"}
        </button>
      </section>

      <section className="cards">
        <article className="card">
          <div className="number">01</div>
          <h3>Inicializar emisor</h3>
          <p>Registra la autoridad que podrá emitir y revocar credenciales.</p>
          <button disabled={!wallet || busy} onClick={initializeIssuer}>
            Inicializar autoridad
          </button>
        </article>

        <article className="card">
          <div className="number">02</div>
          <h3>Registrar certificado</h3>
          <p>Selecciona un documento para calcular su hash SHA-256.</p>
          <label className="file-input">
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? file.name : "Seleccionar documento"}
          </label>
          <button disabled={!wallet || !file || busy} onClick={registerCredential}>
            Registrar en blockchain
          </button>
          {hash && <small>SHA-256: {hash}</small>}
        </article>

        <article className="card">
          <div className="number">03</div>
          <h3>Verificar certificado</h3>
          <p>Consulta la autenticidad de un certificado usando su hash.</p>
          <input
            className="hash-input"
            value={lookupHash}
            onChange={(event) => setLookupHash(event.target.value)}
            placeholder="Hash SHA-256 de 64 caracteres"
          />
          <button disabled={busy || !lookupHash} onClick={verifyCredential}>
            Verificar certificado
          </button>
          <button
            className="danger"
            disabled={!wallet || busy || !lookupHash}
            onClick={revokeCredential}
          >
            Revocar certificado
          </button>
        </article>
      </section>

      <section className="result">
        <h3>Resultado de operaciones</h3>
        {busy && <p>Procesando transacción...</p>}
        {credentialInfo && <pre>{credentialInfo}</pre>}
        {status && <p className="status">{status}</p>}
      </section>

      <footer>
        <p>TESH-ChainID · Proyecto académico · Solana Devnet</p>
        <p>Programa: {PROGRAM_ID.toBase58()}</p>
      </footer>
    </main>
  );
}

