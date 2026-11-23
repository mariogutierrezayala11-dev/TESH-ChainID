use anchor_lang::prelude::*;

use crate::{
    constants::{CONFIG_SEED, CREDENTIAL_SEED},
    error::ChainIdError,
    state::{Credential, IssuerConfig},
};

#[derive(Accounts)]
#[instruction(credential_hash: [u8; 32])]
pub struct RegisterCredential<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ ChainIdError::Unauthorized
    )]
    pub config: Account<'info, IssuerConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Credential::SPACE,
        seeds = [CREDENTIAL_SEED, credential_hash.as_ref()],
        bump
    )]
    pub credential: Account<'info, Credential>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterCredential>,
    credential_hash: [u8; 32],
) -> Result<()> {
    require!(
        credential_hash != [0u8; 32],
        ChainIdError::InvalidHash
    );

    let credential = &mut ctx.accounts.credential;

    credential.credential_hash = credential_hash;
    credential.issuer = ctx.accounts.authority.key();
    credential.issued_at = Clock::get()?.unix_timestamp;
    credential.revoked = false;
    credential.revoked_at = 0;

    msg!("Credential registered successfully");
    msg!("Issuer: {}", credential.issuer);

    Ok(())
}
