import { randomUUID } from "node:crypto"
import pg from "pg"

const { Pool } = pg

const schema = `
  CREATE TABLE IF NOT EXISTS equipment (
    id text PRIMARY KEY,
    position integer NOT NULL,
    data jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id text PRIMARY KEY,
    position integer NOT NULL,
    data jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id text PRIMARY KEY,
    position integer NOT NULL,
    data jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS support_team (
    id text PRIMARY KEY,
    position integer NOT NULL,
    data jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS dashboard_settings (
    key text PRIMARY KEY,
    data jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS support_requests (
    ticket_id text PRIMARY KEY,
    team text NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`

const seedRows = async (client, table, rows) => {
  for (const [position, row] of rows.entries()) {
    await client.query(
      `INSERT INTO ${table} (id, position, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [row.id, position, row],
    )
  }
}

const readRows = async (pool, table) => {
  const { rows } = await pool.query(
    `SELECT data FROM ${table} ORDER BY position`,
  )
  return rows.map(({ data }) => data)
}

export const createDatabaseStore = async ({
  dashboard,
  equipment,
  alerts,
  notifications,
  supportTeam,
}) => {
  if (!process.env.DATABASE_URL) return null

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  let client
  let transactionStarted = false

  try {
    client = await pool.connect()
    await client.query("SELECT 1")
    await client.query(schema)
    await client.query("BEGIN")
    transactionStarted = true
    await seedRows(client, "equipment", equipment)
    await seedRows(client, "alerts", alerts)
    await seedRows(client, "notifications", notifications)
    await seedRows(
      client,
      "support_team",
      supportTeam.map((member, index) => ({
        id: `support-${index + 1}`,
        ...member,
      })),
    )
    await client.query(
      "INSERT INTO dashboard_settings (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
      ["summary", dashboard.summary],
    )
    await client.query("COMMIT")
    transactionStarted = false
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK")
      } catch (rollbackError) {
        console.error(
          "Failed to roll back PostgreSQL initialization:",
          rollbackError,
        )
      }
    }
    client?.release()
    client = undefined
    await pool.end()
    throw new Error("Could not connect to or initialize PostgreSQL.", {
      cause: error,
    })
  } finally {
    client?.release()
  }

  return {
    healthCheck: async () => {
      await pool.query("SELECT 1")
    },
    getDashboard: async () => {
      const { rows } = await pool.query(
        "SELECT data FROM dashboard_settings WHERE key = $1",
        ["summary"],
      )
      if (!rows[0])
        throw new Error("Dashboard summary is missing from PostgreSQL.")

      const [equipmentRows, alertRows, notificationRows, teamRows] =
        await Promise.all([
          readRows(pool, "equipment"),
          readRows(pool, "alerts"),
          readRows(pool, "notifications"),
          readRows(pool, "support_team"),
        ])

      return {
        summary: rows[0].data,
        equipment: equipmentRows,
        alerts: alertRows,
        notifications: notificationRows,
        supportTeam: teamRows.map(({ name, role }) => ({ name, role })),
      }
    },
    getEquipment: () => readRows(pool, "equipment"),
    getEquipmentById: async (id) => {
      const { rows } = await pool.query(
        "SELECT data FROM equipment WHERE id = $1",
        [id],
      )
      return rows[0]?.data ?? null
    },
    getNotifications: () => readRows(pool, "notifications"),
    getAlerts: () => readRows(pool, "alerts"),
    createSupportRequest: async (message, team) => {
      const ticketId = `A-${randomUUID().slice(0, 8).toUpperCase()}`
      const { rows } = await pool.query(
        "INSERT INTO support_requests (ticket_id, team, message) VALUES ($1, $2, $3) RETURNING created_at",
        [ticketId, team, message],
      )
      return { ticketId, updatedAt: rows[0].created_at.toISOString() }
    },
  }
}
