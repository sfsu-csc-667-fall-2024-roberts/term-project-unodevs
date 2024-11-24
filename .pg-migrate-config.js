module.exports = {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://noahhai:Acmc2201291!@localhost:5432/mydatabase',
    migrationsTable: 'pgmigrations',
    schema: 'public',
    dir: 'migrations',
  };
  