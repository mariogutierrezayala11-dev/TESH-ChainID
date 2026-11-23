
use litesvm::LiteSVM;
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;
use std::str::FromStr;

const PROGRAM_ID: &str = "55vPWYLosYovBDxJekJJBkWn56kvfHXSDADnW2Wun3W5";
const SYSTEM_PROGRAM_ID: &str = "11111111111111111111111111111111";

const INITIALIZE: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];
const REGISTER: [u8; 8] = [1, 125, 182, 19, 180, 151, 48, 231];
const REVOKE: [u8; 8] = [38, 123, 95, 95, 223, 158, 169, 87];
const VERIFY: [u8; 8] = [139, 189, 60, 127, 32, 241, 162, 134];

fn send(
    svm: &mut LiteSVM,
    payer: &Keypair,
    instruction: Instruction,
) -> litesvm::types::TransactionResult {
    let message = Message::new(
        &[instruction],
        Some(&payer.pubkey()),
    );

    let transaction = Transaction::new(
        &[payer],
        message,
        svm.latest_blockhash(),
    );

    svm.send_transaction(transaction)
}

fn instruction_data(discriminator: [u8; 8], hash: Option<[u8; 32]>) -> Vec<u8> {
    let mut data = discriminator.to_vec();

    if let Some(hash) = hash {
        data.extend_from_slice(&hash);
    }

    data
}

#[test]
fn test_tesh_chain_id_complete_flow() {
    let program_id = Address::from_str(PROGRAM_ID).unwrap();
    let system_program = Address::from_str(SYSTEM_PROGRAM_ID).unwrap();

    let mut svm = LiteSVM::new();

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/onchain.so"),
    )
    .unwrap();

    let authority = Keypair::new();

    svm.airdrop(&authority.pubkey(), 5_000_000_000)
        .unwrap();

    let (config, _) =
        Address::find_program_address(&[b"config"], &program_id);

    // 1. Inicializar el programa.
    let initialize_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(config, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction_data(INITIALIZE, None),
    };

    send(&mut svm, &authority, initialize_ix).unwrap();
    println!("OK: inicialización");

    // 2. Registrar una credencial.
    let credential_hash = [7u8; 32];

    let (credential, _) = Address::find_program_address(
        &[b"credential", &credential_hash],
        &program_id,
    );

    let register_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new_readonly(config, false),
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(credential, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction_data(REGISTER, Some(credential_hash)),
    };

    send(&mut svm, &authority, register_ix).unwrap();
    println!("OK: registro de credencial");

    // 3. Verificar la credencial válida.
    let verify_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new_readonly(credential, false),
        ],
        data: instruction_data(VERIFY, Some(credential_hash)),
    };

    send(&mut svm, &authority, verify_ix.clone()).unwrap();
    println!("OK: verificación de credencial válida");

    // 4. Rechazar una credencial inexistente.
    let unknown_hash = [9u8; 32];

    let (unknown_credential, _) = Address::find_program_address(
        &[b"credential", &unknown_hash],
        &program_id,
    );

    let unknown_verify_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new_readonly(unknown_credential, false),
        ],
        data: instruction_data(VERIFY, Some(unknown_hash)),
    };

    assert!(
        send(&mut svm, &authority, unknown_verify_ix).is_err()
    );
    println!("OK: rechazo de credencial inexistente");

    // 5. Revocar la credencial.
    let revoke_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new_readonly(config, false),
            AccountMeta::new_readonly(authority.pubkey(), true),
            AccountMeta::new(credential, false),
        ],
        data: instruction_data(REVOKE, Some(credential_hash)),
    };

    send(&mut svm, &authority, revoke_ix.clone()).unwrap();
    println!("OK: revocación de credencial");

    // 6. Rechazar la verificación de una credencial revocada.
    assert!(
        send(&mut svm, &authority, verify_ix).is_err()
    );
    println!("OK: rechazo de credencial revocada");

    // 7. Rechazar una segunda revocación.
    assert!(
        send(&mut svm, &authority, revoke_ix).is_err()
    );
    println!("OK: rechazo de segunda revocación");

    println!("TESH-ChainID: pruebas funcionales completadas");
}
