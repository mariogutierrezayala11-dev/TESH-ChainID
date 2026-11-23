use anchor_lang::prelude::*;

#[account]
pub struct IssuerConfig {
    pub authority: Pubkey,
}

impl IssuerConfig {
    pub const SPACE: usize = 8 + 32;
}

#[account]
pub struct Credential {
    pub credential_hash: [u8; 32],
    pub issuer: Pubkey,
    pub issued_at: i64,
    pub revoked: bool,
    pub revoked_at: i64,
}

impl Credential {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1 + 8;
}
