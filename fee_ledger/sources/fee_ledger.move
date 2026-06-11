module yeti::fee_ledger {
  use sui::object::{Self, UID};
  use sui::tx_context::{Self, TxContext};
  use sui::transfer;
  use sui::event;

  /// Per-user ledger holding their latest analysis.
  public struct FeeLedger has key {
    id: UID,
    total_paid_usd: u64,
    sui_equivalent_usd: u64,
    savings_usd: u64,
    analyses_count: u64,
  }

  /// Single shared object aggregating savings across every user.
  public struct SavingsBoard has key {
    id: UID,
    total_saved_usd: u64,
    total_analyses: u64,
    biggest_saving_usd: u64,
  }

  /// Emitted on every saved analysis so off-chain clients can index activity.
  public struct AnalysisSaved has copy, drop {
    saver: address,
    total_paid_usd: u64,
    sui_equivalent_usd: u64,
    savings_usd: u64,
  }

  /// Runs once at publish: create and share the global board.
  fun init(ctx: &mut TxContext) {
    let board = SavingsBoard {
      id: object::new(ctx),
      total_saved_usd: 0,
      total_analyses: 0,
      biggest_saving_usd: 0,
    };
    transfer::share_object(board);
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

  /// Write an analysis to the user's ledger and roll it into the shared board.
  public fun save_analysis(
    ledger: &mut FeeLedger,
    board: &mut SavingsBoard,
    total_paid: u64,
    sui_equivalent: u64,
    savings: u64,
    ctx: &TxContext,
  ) {
    ledger.total_paid_usd = total_paid;
    ledger.sui_equivalent_usd = sui_equivalent;
    ledger.savings_usd = savings;
    ledger.analyses_count = ledger.analyses_count + 1;

    board.total_saved_usd = board.total_saved_usd + savings;
    board.total_analyses = board.total_analyses + 1;
    if (savings > board.biggest_saving_usd) {
      board.biggest_saving_usd = savings;
    };

    event::emit(AnalysisSaved {
      saver: tx_context::sender(ctx),
      total_paid_usd: total_paid,
      sui_equivalent_usd: sui_equivalent,
      savings_usd: savings,
    });
  }

  // --- Read-only getters (used by tests and clients) ---

  public fun board_total_saved(board: &SavingsBoard): u64 {
    board.total_saved_usd
  }

  public fun board_total_analyses(board: &SavingsBoard): u64 {
    board.total_analyses
  }

  public fun board_biggest_saving(board: &SavingsBoard): u64 {
    board.biggest_saving_usd
  }

  public fun ledger_savings(ledger: &FeeLedger): u64 {
    ledger.savings_usd
  }

  public fun ledger_analyses_count(ledger: &FeeLedger): u64 {
    ledger.analyses_count
  }

  #[test_only]
  public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
  }
}
