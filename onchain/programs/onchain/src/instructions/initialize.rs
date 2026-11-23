use anchor_lang::prelude::*;

use crate::{
    constants::CONFIG_SEED,
    state::IssuerConfig,
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = IssuerConfig::SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, IssuerConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.config.authority = ctx.accounts.payer.key();

    msg!("TESH ChainID initialized successfully");
    msg!("Authorized issuer: {}", ctx.accounts.payer.key());

    Ok(())
}
