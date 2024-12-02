import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create and Deal Deck to Users
  pgm.sql(`
    CREATE OR REPLACE PROCEDURE create_and_deal_deck(a_game_id INT, hand_size INT)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_user_id INT;
    BEGIN
      -- Import all cards from table CARDS into the game
      INSERT INTO game_cards (card_id, game_id) SELECT id, a_game_id FROM cards;

      -- Deal X cards to every user in the game
      FOR v_user_id IN (
        SELECT users_id FROM game_users
        WHERE game_id = a_game_id
      )
      LOOP
        UPDATE game_cards
        SET user_id = v_user_id
        WHERE game_id = a_game_id
        AND user_id IS NULL
        AND card_id IN (
          SELECT card_id FROM game_cards
          WHERE game_id = a_game_id
          AND user_id IS NULL
          ORDER BY RANDOM() LIMIT hand_size
        );
      END LOOP;
    END;
    $$;
  `);

  // Assign User's Random Seats
  pgm.sql(`
    CREATE OR REPLACE PROCEDURE randomize_seats(a_game_id INT)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_user_id INT;
      v_seat_num INT := 1;
    BEGIN
      -- Assign random seats to users
      FOR v_user_id IN (
        SELECT users_id FROM game_users
        WHERE game_id = a_game_id
        ORDER BY RANDOM()
      )
      LOOP
        UPDATE game_users
        SET seat = v_seat_num
        WHERE game_id = a_game_id
        AND users_id = v_user_id;

        v_seat_num := v_seat_num + 1;
      END LOOP;
    END;
    $$;
  `);

  // Start Game Procedure
  pgm.sql(`
    CREATE OR REPLACE PROCEDURE start_game(a_game_id INT)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_start_hand_size INT := 7;
      v_random_card_id INT;
      v_random_card_color COLORS;
      v_random_player_id INT;
    BEGIN
      -- Check if inactive game exists
      IF 0 = (
        SELECT COUNT(*) FROM games
        WHERE id = a_game_id
        AND active = false
      )
      THEN
        RAISE EXCEPTION 'Inactive Game with ID = % does not exist.', a_game_id;
      END IF;

      -- Import the deck and deal cards to all users
      CALL create_and_deal_deck(a_game_id, v_start_hand_size);

      -- Get a random card id
      SELECT
        gc.card_id, c.color
        INTO v_random_card_id, v_random_card_color
      FROM game_cards gc
      JOIN cards c ON gc.card_id = c.id
      WHERE game_id = a_game_id
      AND user_id IS NULL
      ORDER BY RANDOM() LIMIT 1;

      -- If the color came up wild, choose a random real color
      IF v_random_card_color = 'wild' THEN
        SELECT color INTO v_random_card_color
        FROM cards
        WHERE color != 'wild'
        ORDER BY RANDOM() LIMIT 1;
      END IF;

      -- Get a random user id from the game
      SELECT users_id INTO v_random_player_id
      FROM game_users
      WHERE game_id = a_game_id
      ORDER BY RANDOM() LIMIT 1;

      -- Transition game object from Lobby to Game
      UPDATE games
      SET
        current_card_id = v_random_card_id,
        current_player_id = v_random_player_id,
        active = TRUE,
        updated_at = DEFAULT,
        started_at = CURRENT_TIMESTAMP,
        active_color = v_random_card_color
      WHERE id = a_game_id;

      -- Update Top card to be in 'discarded' state
      UPDATE game_cards
      SET user_id = -1
      WHERE card_id = v_random_card_id;

      -- Initialize every player with a random seat number
      CALL randomize_seats(a_game_id);
    END;
    $$;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop Procedures
  pgm.sql("DROP PROCEDURE IF EXISTS start_game;");
  pgm.sql("DROP PROCEDURE IF EXISTS randomize_seats;");
  pgm.sql("DROP PROCEDURE IF EXISTS create_and_deal_deck;");
}
