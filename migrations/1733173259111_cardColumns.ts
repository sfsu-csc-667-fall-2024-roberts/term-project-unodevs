import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Rename "card_id" column to "current_card_id"
  pgm.renameColumn("games", "card_id", "current_card_id");
  
  // Allow "current_card_id" to be nullable
  pgm.alterColumn("games", "current_card_id", { notNull: false });

  // Add "active_color" column with type "colors" and allowNull
  pgm.addColumn("games", {
    active_color: { type: "colors", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Rename "current_card_id" column back to "card_id"
  pgm.renameColumn("games", "current_card_id", "card_id");

  // Make "card_id" not nullable
  pgm.alterColumn("games", "card_id", { notNull: true });

  // Drop the "active_color" column
  pgm.dropColumn("games", "active_color");
}
