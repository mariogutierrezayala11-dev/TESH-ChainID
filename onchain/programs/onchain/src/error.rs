use anchor_lang::prelude::*;

#[error_code]
pub enum ChainIdError {
    #[msg("Unauthorized operation")]
    Unauthorized,

    #[msg("Invalid credential hash")]
    InvalidHash,

    #[msg("Credential has already been revoked")]
    AlreadyRevoked,

    #[msg("Credential hash does not match")]
    HashMismatch,
}
