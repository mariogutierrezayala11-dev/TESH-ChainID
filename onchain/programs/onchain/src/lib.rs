pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::{
    Initialize,
    RegisterCredential,
    VerifyCredential,
    RevokeCredential,
};

// Exportaciones necesarias para Anchor
pub use instructions::initialize::__client_accounts_initialize;
pub use instructions::register_credential::__client_accounts_register_credential;
pub use instructions::verify_credential::__client_accounts_verify_credential;
pub use instructions::revoke_credential::__client_accounts_revoke_credential;

declare_id!("55vPWYLosYovBDxJekJJBkWn56kvfHXSDADnW2Wun3W5");

#[program]
pub mod onchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn register_credential(
        ctx: Context<RegisterCredential>,
        credential_hash: [u8; 32],
    ) -> Result<()> {
        instructions::register_credential::handler(ctx, credential_hash)
    }

    pub fn verify_credential(
        ctx: Context<VerifyCredential>,
        credential_hash: [u8; 32],
    ) -> Result<()> {
        instructions::verify_credential::handler(ctx, credential_hash)
    }

    pub fn revoke_credential(
        ctx: Context<RevokeCredential>,
        credential_hash: [u8; 32],
    ) -> Result<()> {
        instructions::revoke_credential::handler(ctx, credential_hash)
    }
}
