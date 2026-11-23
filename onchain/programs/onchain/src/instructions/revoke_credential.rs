use anchor_lang::prelude::*;

use crate::{
    constants::{CONFIG_SEED, CREDENTIAL_SEED},
    error::ChainIdError,
    state::{Credential, IssuerConfig},
};

#[derive(Accounts)]
#[instruction(credential_hash: [u8; 32])]
pub struct RevokeCredential<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ ChainIdError::Unauthorized
    )]
    pub config: Account<'info, IssuerConfig>,

    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CREDENTIAL_SEED, credential_hash.as_ref()],
        bump,
        constraint = credential.credential_hash == credential_hash
            @ ChainIdError::HashMismatch
    )]
    pub credential: Account<'info, Credential>,
}

pub fn handler(
    ctx: Context<RevokeCredential>,
    _credential_hash: [u8; 32],
) -> Result<()> {
    require!(
        !ctx.accounts.credential.revoked,
        ChainIdError::AlreadyRevoked
    );

    ctx.accounts.credential.revoked = true;
    ctx.accounts.credential.revoked_at = Clock::get()?.unix_timestamp;

    msg!("Credential revoked successfully");

    Ok(())
}
