const authMode = (process.env.DB_AUTH_MODE || "sql").toLowerCase();
const isWindowsAuth = authMode === "windows";
const sql = isWindowsAuth ? require("mssql/msnodesqlv8") : require("mssql");

const dbConfig = isWindowsAuth
  ? {
      connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_DATABASE};Trusted_Connection=Yes;TrustServerCertificate=Yes;`,
      options: {
        trustedConnection: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    }
  : {
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 1433),
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

let poolPromise;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        console.log("Connected to SQL Server.");
        return pool;
      })
      .catch((error) => {
        poolPromise = null;
        console.error("SQL Server connection failed:", error.message);
        throw error;
      });
  }
  return poolPromise;
};

module.exports = {
  sql,
  getPool,
};
