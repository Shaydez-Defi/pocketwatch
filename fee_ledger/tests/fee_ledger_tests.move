#[test_only]
module yeti::fee_ledger_tests {
  use sui::test_scenario::{Self as ts};
  use yeti::fee_ledger::{
    Self,
    FeeLedger,
    SavingsBoard,
  };

  const USER: address = @0xA11CE;

  #[test]
  fun test_create_ledger_starts_empty() {
    let mut scenario = ts::begin(USER);
    {
      fee_ledger::create_ledger(scenario.ctx());
    };
    scenario.next_tx(USER);
    {
      let ledger = scenario.take_from_sender<FeeLedger>();
      assert!(fee_ledger::ledger_savings(&ledger) == 0, 0);
      assert!(fee_ledger::ledger_analyses_count(&ledger) == 0, 1);
      scenario.return_to_sender(ledger);
    };
    scenario.end();
  }

  #[test]
  fun test_save_once_updates_ledger_and_board() {
    let mut scenario = ts::begin(USER);
    {
      fee_ledger::init_for_testing(scenario.ctx());
      fee_ledger::create_ledger(scenario.ctx());
    };
    scenario.next_tx(USER);
    {
      let mut ledger = scenario.take_from_sender<FeeLedger>();
      let mut board = scenario.take_shared<SavingsBoard>();

      // $142.40 paid, $3.20 on Sui, $139.20 saved (in cents)
      fee_ledger::save_analysis(
        &mut ledger,
        &mut board,
        14240,
        320,
        13920,
        scenario.ctx(),
      );

      assert!(fee_ledger::ledger_savings(&ledger) == 13920, 0);
      assert!(fee_ledger::ledger_analyses_count(&ledger) == 1, 1);
      assert!(fee_ledger::board_total_saved(&board) == 13920, 2);
      assert!(fee_ledger::board_total_analyses(&board) == 1, 3);
      assert!(fee_ledger::board_biggest_saving(&board) == 13920, 4);

      ts::return_shared(board);
      scenario.return_to_sender(ledger);
    };
    scenario.end();
  }

  #[test]
  fun test_save_twice_sums_and_tracks_max() {
    let mut scenario = ts::begin(USER);
    {
      fee_ledger::init_for_testing(scenario.ctx());
      fee_ledger::create_ledger(scenario.ctx());
    };
    scenario.next_tx(USER);
    {
      let mut ledger = scenario.take_from_sender<FeeLedger>();
      let mut board = scenario.take_shared<SavingsBoard>();

      // First save: smaller saving.
      fee_ledger::save_analysis(&mut ledger, &mut board, 5000, 100, 4900, scenario.ctx());
      // Second save: larger saving.
      fee_ledger::save_analysis(&mut ledger, &mut board, 20000, 200, 19800, scenario.ctx());

      // Ledger holds the latest snapshot, count incremented twice.
      assert!(fee_ledger::ledger_savings(&ledger) == 19800, 0);
      assert!(fee_ledger::ledger_analyses_count(&ledger) == 2, 1);

      // Board aggregates both saves and remembers the biggest.
      assert!(fee_ledger::board_total_saved(&board) == 24700, 2);
      assert!(fee_ledger::board_total_analyses(&board) == 2, 3);
      assert!(fee_ledger::board_biggest_saving(&board) == 19800, 4);

      ts::return_shared(board);
      scenario.return_to_sender(ledger);
    };
    scenario.end();
  }

  #[test]
  fun test_board_aggregates_across_two_users() {
    let other: address = @0xB0B;
    let mut scenario = ts::begin(USER);
    {
      fee_ledger::init_for_testing(scenario.ctx());
    };

    // USER creates a ledger and saves.
    scenario.next_tx(USER);
    {
      fee_ledger::create_ledger(scenario.ctx());
    };
    scenario.next_tx(USER);
    {
      let mut ledger = scenario.take_from_sender<FeeLedger>();
      let mut board = scenario.take_shared<SavingsBoard>();
      fee_ledger::save_analysis(&mut ledger, &mut board, 10000, 100, 9900, scenario.ctx());
      ts::return_shared(board);
      scenario.return_to_sender(ledger);
    };

    // A different user creates a ledger and saves.
    scenario.next_tx(other);
    {
      fee_ledger::create_ledger(scenario.ctx());
    };
    scenario.next_tx(other);
    {
      let mut ledger = scenario.take_from_sender<FeeLedger>();
      let mut board = scenario.take_shared<SavingsBoard>();
      fee_ledger::save_analysis(&mut ledger, &mut board, 30000, 300, 29700, scenario.ctx());

      assert!(fee_ledger::board_total_saved(&board) == 39600, 0);
      assert!(fee_ledger::board_total_analyses(&board) == 2, 1);
      assert!(fee_ledger::board_biggest_saving(&board) == 29700, 2);

      ts::return_shared(board);
      scenario.return_to_sender(ledger);
    };
    scenario.end();
  }
}
