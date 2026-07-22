"use strict";

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const FIFTH_FLOOR_FALLBACK = require("./fifth-floor-offices.json");

/**
 * Wipe-and-replace seeder for floor/office data sourced from a CSV.
 *
 * Behaviour:
 *   1. Unpin every display (set `floor_id = NULL`) so the FK to `floors`
 *      is safe to delete against.
 *   2. `DELETE FROM offices`.
 *   3. `DELETE FROM floors`.
 *   4. Parse CSV rows, normalize known formatting drift, validate uniqueness.
 *   5. Insert floors then offices with bilingual fields.
 *
 * CSV format expected (header):
 * floor_id,name,name_am,room_number,department,department_am,
 * contact_person,contact_person_am,description,description_am,
 * display_order,services,services_am
 *
 * Note: some rows in the current source file contain an extra empty column
 * before `contact_person` (14 columns total). This importer auto-normalizes
 * that shape to the expected 13-column layout.
 */

const CSV_FILE = process.env.SIGNAGE_SEED_CSV || "deepseek_csv_20260720_dc80a7.txt";
const candidatePaths = [
  path.resolve(__dirname, CSV_FILE),
  path.resolve(__dirname, "../", CSV_FILE),
  path.resolve(__dirname, "../../", CSV_FILE),
];
const CSV_PATH = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];

const FLOOR_MAP = {
  ground_floor: {
    floor_number: 0,
    name: "Ground Floor",
    name_am: "የመሬት ወለል",
  },
  "1st_floor": {
    floor_number: 1,
    name: "1st Floor",
    name_am: "1ኛ ፎቅ",
  },
  "2nd_floor": {
    floor_number: 2,
    name: "2nd Floor",
    name_am: "2ኛ ፎቅ",
  },
  "3rd_floor": {
    floor_number: 3,
    name: "3rd Floor",
    name_am: "3ኛ ፎቅ",
  },
  "4th_floor": {
    floor_number: 4,
    name: "4th Floor",
    name_am: "4ኛ ፎቅ",
  },
  "5th_floor": {
    floor_number: 5,
    name: "5th Floor",
    name_am: "5ኛ ፎቅ",
  },
};

function clean(value) {
  const v = (value || "").trim();
  return v.length ? v : null;
}

function parseArrayCell(raw) {
  const cell = (raw || "").trim();
  if (!cell) return [];

  if (cell.startsWith("[") && cell.endsWith("]")) {
    try {
      const parsed = JSON.parse(cell);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch (err) {
      // Fallback to delimited parsing.
    }
  }

  const separator = cell.includes("|") ? "|" : ";";
  return cell
    .split(separator)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseCsvRows() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(
      `Seed CSV not found at ${CSV_PATH}. Set SIGNAGE_SEED_CSV to override.`
    );
  }

  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(`Seed CSV ${CSV_PATH} has no data rows.`);
  }

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const cols = lines[i].split(",");

    // Known source drift: some lines have an extra blank column inserted
    // before contact_person, turning 13 columns into 14.
    if (cols.length === 14 && !cols[6]) {
      cols.splice(6, 1);
    }

    if (cols.length !== 13) {
      throw new Error(
        `Invalid column count at line ${lineNumber}: expected 13, got ${cols.length}`
      );
    }

    const row = {
      __line: lineNumber,
      floor_token: clean(cols[0]),
      name: clean(cols[1]),
      name_am: clean(cols[2]),
      room_number: clean(cols[3]),
      department: clean(cols[4]),
      department_am: clean(cols[5]),
      contact_person: clean(cols[6]),
      contact_person_am: clean(cols[7]),
      description: clean(cols[8]),
      description_am: clean(cols[9]),
      display_order: Number.parseInt((cols[10] || "").trim(), 10),
      services: parseArrayCell(cols[11]),
      services_am: parseArrayCell(cols[12]),
    };

    if (!row.floor_token || !row.name || !row.name_am || !row.room_number) {
      throw new Error(
        `Missing required field(s) at line ${lineNumber} (floor_id, name, name_am, room_number are required).`
      );
    }

    if (!Number.isInteger(row.display_order)) {
      throw new Error(`Invalid display_order at line ${lineNumber}: '${cols[10]}'`);
    }

    if (row.services_am.length && row.services.length !== row.services_am.length) {
      throw new Error(
        `services/services_am length mismatch at line ${lineNumber}: ${row.services.length} vs ${row.services_am.length}`
      );
    }

    data.push(row);
  }

  return data;
}

function validateRows(rows) {
  const unknownFloors = [...new Set(rows.map((r) => r.floor_token))].filter(
    (token) => !FLOOR_MAP[token]
  );
  if (unknownFloors.length) {
    throw new Error(
      `Unknown floor_id token(s) in CSV: ${unknownFloors.join(", ")}. Update FLOOR_MAP in this seeder.`
    );
  }

  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.floor_token}|${row.room_number}`;
    const arr = grouped.get(key) || [];
    arr.push(row);
    grouped.set(key, arr);
  }

  const duplicateGroups = [];
  for (const [key, list] of grouped.entries()) {
    if (list.length > 1) {
      duplicateGroups.push({
        key,
        rows: list,
      });
    }
  }

  if (!duplicateGroups.length) {
    return {
      keptRows: rows,
      skippedDetails: [],
    };
  }

  const duplicatedKeys = new Set(duplicateGroups.map((g) => g.key));
  const keptRows = rows.filter(
    (r) => !duplicatedKeys.has(`${r.floor_token}|${r.room_number}`)
  );

  const skippedDetails = duplicateGroups.map((g) =>
    `${g.key} (lines: ${g.rows.map((r) => r.__line).join(", ")})`
  );

  return {
    keptRows,
    skippedDetails,
  };
}

module.exports = {
  async up(queryInterface) {
    const parsedRows = parseCsvRows();
    const { keptRows, skippedDetails } = validateRows(parsedRows);

    let rows = keptRows;
    const hasFifthFloorRows = rows.some((r) => r.floor_token === "5th_floor");
    if (!hasFifthFloorRows) {
      rows = [...rows, ...FIFTH_FLOOR_FALLBACK];
      console.warn(
        `No 5th-floor offices in CSV; appended ${FIFTH_FLOOR_FALLBACK.length} fallback rows from Core department data.`
      );
    }

    if (rows.length === 0) {
      throw new Error(
        "All CSV rows were dropped due to duplicate (floor_id, room_number) conflicts."
      );
    }

    if (skippedDetails.length) {
      console.warn(
        `Skipping duplicate office rows: ${skippedDetails.join("; ")}`
      );
    }

    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Break the FK from displays → floors so we can wipe floors.
      await queryInterface.sequelize.query(
        "UPDATE displays SET floor_id = NULL, updated_at = NOW()",
        { transaction: t }
      );

      // 2. Wipe existing offices + floors. Sequenced so the floors delete
      //    isn't blocked by any office FKs even without cascade.
      await queryInterface.sequelize.query("DELETE FROM offices", {
        transaction: t,
      });
      await queryInterface.sequelize.query("DELETE FROM floors", {
        transaction: t,
      });

      // 3. Insert all configured floors (including floors with no offices yet).
      const floorIdByToken = new Map();
      const allTokens = Object.keys(FLOOR_MAP).sort(
        (a, b) => FLOOR_MAP[a].floor_number - FLOOR_MAP[b].floor_number
      );
      for (const token of allTokens) {
        const meta = FLOOR_MAP[token];
        const floorId = uuidv4();
        floorIdByToken.set(token, floorId);
        await queryInterface.sequelize.query(
          `INSERT INTO floors
             (floor_id, floor_number, name, name_am, is_active, map_image_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, TRUE, NULL, NOW(), NOW())`,
          {
            bind: [floorId, meta.floor_number, meta.name, meta.name_am],
            transaction: t,
          }
        );
      }

      // 4. Insert offices from CSV.
      for (const row of rows) {
        await queryInterface.sequelize.query(
          `INSERT INTO offices (
             office_id, floor_id, room_number, display_order,
             name, name_am,
             department, department_am,
             contact_person, contact_person_am,
             description, description_am,
             services, services_am,
             created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4,
             $5, $6,
             $7, $8,
             $9, $10,
             $11, $12,
             $13::text[], $14::text[],
             NOW(), NOW()
           )`,
          {
            bind: [
              uuidv4(),
              floorIdByToken.get(row.floor_token),
              row.room_number,
              row.display_order,
              row.name,
              row.name_am,
              row.department,
              row.department_am,
              row.contact_person,
              row.contact_person_am,
              row.description,
              row.description_am,
              row.services,
              row.services_am,
            ],
            transaction: t,
          }
        );
      }

      await t.commit();
      console.log(`CSV office seed complete: ${allTokens.length} floors + ${rows.length} offices.`);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    // Best-effort cleanup so seed can be re-run.
    await queryInterface.sequelize.query("DELETE FROM offices");
    await queryInterface.sequelize.query("DELETE FROM floors");
  },
};
