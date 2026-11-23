use anchor_lang::prelude::*;

use crate::{
    constants::CREDENTIAL_SEED,
    error::ChainIdError,
    state::Credential,
};

#[derive(Accounts)]
#[instruction(credential_hash: [u8; 32])]
pub struct VerifyCredential<'info> {
    #[account(
        seeds = [CREDENTIAL_SEED, credential_hash.as_ref()],
        bump,
        constraint = credential.credential_hash == credential_hash
            @ ChainIdError::HashMismatch
    )]
    pub credential: Account<'info, Credential>,
}

pub fn handler(
    ctx: Context<VerifyCredential>,
    _credential_hash: [u8; 32],
) -> Result<()> {
    require!(
        !ctx.accounts.credential.revoked,
        ChainIdError::AlreadyRevoked
    );

    msg!("Credential is authentic and valid");
    msg!("Issuer: {}", ctx.accounts.credential.issuer);

    Ok(())
}
