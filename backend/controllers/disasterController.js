const { getPool, sql } = require("../config/database");

const allowedSeverities = ["Critical", "High", "Medium", "Low"];
const allowedStatuses = ["Active", "Resolved", "Monitoring", "Closed"];

const parseDisasterPayload = (body) => {
  const payload = {
    DisasterName: (body.DisasterName || "").trim(),
    DisasterType: (body.DisasterType || "").trim(),
    Description: body.Description ? String(body.Description).trim() : null,
    Severity: (body.Severity || "").trim(),
    Status: (body.Status || "").trim(),
    StartDate: body.StartDate,
    EndDate: body.EndDate || null,
    AffectedPeople: body.AffectedPeople ?? 0,
  };

  const errors = [];
  if (!payload.DisasterName) errors.push("Disaster name is required.");
  if (!payload.DisasterType) errors.push("Disaster type is required.");
  if (!payload.Severity) errors.push("Severity is required.");
  if (!payload.Status) errors.push("Status is required.");
  if (!payload.StartDate) errors.push("Start date is required.");
  if (
    payload.Severity &&
    !allowedSeverities.some(
      (item) => item.toLowerCase() === payload.Severity.toLowerCase()
    )
  ) {
    errors.push("Invalid severity value.");
  }
  if (
    payload.Status &&
    !allowedStatuses.some(
      (item) => item.toLowerCase() === payload.Status.toLowerCase()
    )
  ) {
    errors.push("Invalid status value.");
  }
  if (Number.isNaN(Date.parse(payload.StartDate))) {
    errors.push("Invalid start date.");
  }
  if (payload.EndDate && Number.isNaN(Date.parse(payload.EndDate))) {
    errors.push("Invalid end date.");
  }
  const affected = Number(payload.AffectedPeople);
  if (!Number.isInteger(affected) || affected < 0) {
    errors.push("Affected people must be a non-negative integer.");
  }
  payload.AffectedPeople = affected;
  return { payload, errors };
};

const listDisasters = async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      `SELECT DisasterID, DisasterName, DisasterType, Description, Severity, Status,
              StartDate, EndDate, AffectedPeople, CreatedAt
       FROM Disasters
       ORDER BY CreatedAt DESC`
    );
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("List disasters error:", error);
    return res.status(500).json({ message: "Unable to load disasters." });
  }
};

const searchDisasters = async (req, res) => {
  const search = (req.query.query || "").trim();
  try {
    const pool = await getPool();
    if (!search) {
      const fallback = await pool.request().query(
        `SELECT DisasterID, DisasterName, DisasterType, Description, Severity, Status,
                StartDate, EndDate, AffectedPeople, CreatedAt
         FROM Disasters
         ORDER BY CreatedAt DESC`
      );
      return res.status(200).json(fallback.recordset);
    }
    const result = await pool
      .request()
      .input("search", sql.VarChar(100), search)
      .query(
        `SELECT DisasterID, DisasterName, DisasterType, Description, Severity, Status,
                StartDate, EndDate, AffectedPeople, CreatedAt
         FROM Disasters
         WHERE DisasterName LIKE '%' + @search + '%'
            OR DisasterType LIKE '%' + @search + '%'
            OR Status LIKE '%' + @search + '%'
            OR Severity LIKE '%' + @search + '%'
         ORDER BY CreatedAt DESC`
      );
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Search disasters error:", error);
    return res.status(500).json({ message: "Unable to search disasters." });
  }
};

const getDisasterById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid disaster ID." });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Disasters WHERE DisasterID = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Disaster not found." });
    }
    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Get disaster by ID error:", error);
    return res.status(500).json({ message: "Unable to load disaster." });
  }
};

const createDisaster = async (req, res) => {
  const { payload, errors } = parseDisasterPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0] });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("DisasterName", sql.VarChar(100), payload.DisasterName)
      .input("DisasterType", sql.VarChar(50), payload.DisasterType)
      .input("Description", sql.VarChar(500), payload.Description)
      .input("Severity", sql.VarChar(20), payload.Severity)
      .input("Status", sql.VarChar(30), payload.Status)
      .input("StartDate", sql.DateTime, new Date(payload.StartDate))
      .input("EndDate", sql.DateTime, payload.EndDate ? new Date(payload.EndDate) : null)
      .input("AffectedPeople", sql.Int, payload.AffectedPeople)
      .query(
        `INSERT INTO Disasters
           (DisasterName, DisasterType, Description, Severity, Status, StartDate, EndDate, AffectedPeople)
         VALUES
           (@DisasterName, @DisasterType, @Description, @Severity, @Status, @StartDate, @EndDate, @AffectedPeople)`
      );
    return res.status(201).json({ message: "Disaster created successfully." });
  } catch (error) {
    console.error("Create disaster error:", error);
    return res.status(500).json({ message: "Failed to create disaster." });
  }
};

const updateDisaster = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid disaster ID." });
  }
  const { payload, errors } = parseDisasterPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0] });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("DisasterID", sql.Int, id)
      .input("DisasterName", sql.VarChar(100), payload.DisasterName)
      .input("DisasterType", sql.VarChar(50), payload.DisasterType)
      .input("Description", sql.VarChar(500), payload.Description)
      .input("Severity", sql.VarChar(20), payload.Severity)
      .input("Status", sql.VarChar(30), payload.Status)
      .input("StartDate", sql.DateTime, new Date(payload.StartDate))
      .input("EndDate", sql.DateTime, payload.EndDate ? new Date(payload.EndDate) : null)
      .input("AffectedPeople", sql.Int, payload.AffectedPeople)
      .query(
        `UPDATE Disasters
         SET DisasterName = @DisasterName,
             DisasterType = @DisasterType,
             Description = @Description,
             Severity = @Severity,
             Status = @Status,
             StartDate = @StartDate,
             EndDate = @EndDate,
             AffectedPeople = @AffectedPeople
         WHERE DisasterID = @DisasterID`
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Disaster not found." });
    }
    return res.status(200).json({ message: "Disaster updated successfully." });
  } catch (error) {
    console.error("Update disaster error:", error);
    return res.status(500).json({ message: "Failed to update disaster." });
  }
};

const deleteDisaster = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid disaster ID." });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("DisasterID", sql.Int, id)
      .query("DELETE FROM Disasters WHERE DisasterID = @DisasterID");
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Disaster not found." });
    }
    return res.status(200).json({ message: "Disaster deleted successfully." });
  } catch (error) {
    console.error("Delete disaster error:", error);
    return res.status(500).json({ message: "Failed to delete disaster." });
  }
};

const getDashboardStats = async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      `SELECT
         (SELECT COUNT(*) FROM Disasters) AS TotalDisasters,
         (SELECT COUNT(*) FROM Disasters WHERE Status = 'Active') AS ActiveDisasters,
         (SELECT COUNT(*) FROM Disasters WHERE Severity IN ('Critical','High')) AS HighSeverityDisasters`
    );
    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ message: "Unable to load dashboard stats." });
  }
};

module.exports = {
  listDisasters,
  searchDisasters,
  getDisasterById,
  createDisaster,
  updateDisaster,
  deleteDisaster,
  getDashboardStats,
};

