import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // games
  pgm.dropConstraint("games", "games_card_id_key"); 
  pgm.dropConstraint("games", "games_player_id_key"); 
  pgm.dropColumn("games", "lobby_size");
  pgm.alterColumn("games", "max_players", { default: "4" });
  pgm.renameColumn("games", "player_id", "current_player_id");
  pgm.alterColumn("games", "current_player_id", { allowNull: true });

  // Ensure the correct column name is used here
  pgm.renameColumn("games", "created_at", "created_at_timestamp");

  // game cards
  pgm.dropConstraint("game_cards", "game_cards_pkey", { ifExists: true });
  pgm.alterColumn("game_cards", "user_id", { allowNull: true });
  pgm.addConstraint("game_cards", "game_cards_pkey", {
    primaryKey: ["card_id", "game_id"],
  });

  // game user
  pgm.dropConstraint("game_users", "game_users_game_id_key"); 
  pgm.dropConstraint("game_users", "game_users_seat_key"); 
  pgm.alterColumn("game_users", "seat", { allowNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // games
  pgm.addConstraint("games", "games_card_id_key", { unique: "card_id" });
  pgm.renameColumn("games", "current_player_id", "player_id");
  pgm.alterColumn("games", "player_id", { allowNull: false });
  pgm.addConstraint("games", "games_player_id_key", { unique: "player_id" });
  pgm.addColumn("games", { lobby_size: { type: "integer", default: "1" } });
  pgm.alterColumn("games", "max_players", { default: "5" });

  // Reverting the column rename
  pgm.renameColumn("games", "created_at_timestamp", "created_at");

  // game cards
  pgm.dropConstraint("game_cards", "game_cards_pkey", { ifExists: true });
  pgm.alterColumn("game_cards", "user_id", { allowNull: false });
  pgm.addConstraint("game_cards", "game_cards_pkey", {
    primaryKey: ["card_id", "game_id", "user_id"],
  });

  // game users
  pgm.addConstraint("game_users", "game_users_game_id_key", {
    unique: "game_id",
  });
  pgm.addConstraint("game_users", "game_users_seat_key", { unique: "seat" });
  pgm.alterColumn("game_users", "seat", { allowNull: false });
}
