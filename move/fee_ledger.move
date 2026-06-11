module yeti::fee_ledger {
  use sui::object::{Self, UID};
  use sui::tx_context::{Self, TxContext};
  use sui::transfer;

  public struct FeeLedger has key {
    id: UID,
    total_paid_usd: u64,
    sui_equivalent_usd: u64,
    savings_usd: u64,
    analyses_count: u64,
  }

  public fun create_ledger(ctx: &mut TxContext) {
    let ledger = FeeLedger {
      id: object::new(ctx),
      total_paid_usd: 0,
      sui_equivalent_usd: 0,
      savings_usd: 0,
      analyses_count: 0,
    };
    transfer::transfer(ledger, tx_context::sender(ctx));
  }

  public fun save_analysis(
    ledger: &mut FeeLedger,
    total_paid: u64,
    sui_equivalent: u64,
    savings: u64,
  ) {
    ledger.total_paid_usd = total_paid;
    ledger.sui_equivalent_usd = sui_equivalent;
    ledger.savings_usd = savings;
    ledger.analyses_count = ledger.analyses_count + 1;
  }
}