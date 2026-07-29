const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 5923;

// リクエストの中身を読めるようにする
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DB接続設定
const pool = new Pool({
  user: "user_y_nomasa",
  host: "localhost",
  database: "db_y_nomasa",
  password: "5Rw5YDaWc5jc",
  port: 5432,
});
// 顧客一覧取得
app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

// 顧客詳細取得
app.get("/customer/:customerId", async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const customerData = await pool.query(
      "SELECT * FROM customers WHERE customer_id = $1",
      [customerId]
    );

    if (customerData.rows.length === 0) {
      res.status(404).send("Customer not found");
      return;
    }

    res.send(customerData.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});


// 顧客削除
app.delete("/customer/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 顧客に紐づく案件の交渉履歴を削除
    await client.query(
      `DELETE FROM negotiations
       WHERE case_id IN (
         SELECT case_id
         FROM cases
         WHERE customer_id = $1
       )`,
      [customerId]
    );

    // 顧客に紐づく案件を削除
    await client.query(
      "DELETE FROM cases WHERE customer_id = $1",
      [customerId]
    );

    // 顧客を削除
    const deleteResult = await client.query(
      "DELETE FROM customers WHERE customer_id = $1 RETURNING *",
      [customerId]
    );

    if (deleteResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "削除対象の顧客が見つかりません。"
      });
    }

    await client.query("COMMIT");

    res.json({
      message: "顧客情報を削除しました。"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("顧客削除エラー:", err);

    res.status(500).json({
      message: "顧客情報の削除に失敗しました。",
      error: err.message
    });

  } finally {
    client.release();
  }
});

// 顧客新規追加
app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;

    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );

    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// 顧客ごとの案件一覧取得
app.get("/cases/:customerId", async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const caseData = await pool.query(
      `SELECT
         case_id,
         case_name,
         case_status,
         expected_revenue,
         representative
       FROM cases
       WHERE customer_id = $1
       ORDER BY case_id`,
      [customerId]
    );

    res.send(caseData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

// 顧客情報更新
app.post("/update-customer/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const { companyName, industry, contact, location } = req.body;

  try {
    await pool.query(
      `UPDATE customers
       SET company_name = $1,
           industry = $2,
           contact = $3,
           location = $4,
           updated_date = NOW()
       WHERE customer_id = $5`,
      [companyName, industry, contact, location, customerId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 案件情報更新
app.post("/update-case/:caseId", async (req, res) => {
  const caseId = req.params.caseId;
  const {
    caseName,
    caseStatus,
    expectedRevenue,
    representative
  } = req.body;

  try {
    await pool.query(
      `UPDATE cases
       SET case_name = $1,
           case_status = $2,
           expected_revenue = $3,
           representative = $4,
           updated_date = NOW()
       WHERE case_id = $5`,
      [
        caseName,
        caseStatus,
        expectedRevenue,
        representative,
        caseId
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 案件新規追加
app.post("/case", async (req, res) => {
  try {
    const {
      caseName,
      caseStatus,
      expectedRevenue,
      representative,
      customerId,
    } = req.body;

    const newCase = await pool.query(
      "INSERT INTO cases (case_name, case_status, expected_revenue, representative, customer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [caseName, caseStatus, expectedRevenue, representative, customerId]
    );

    res.json({ success: true, case: newCase.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// 案件詳細取得
app.get("/case/:caseId", async (req, res) => {
  const caseId = req.params.caseId;

  try {
    const caseData = await pool.query(
      "SELECT * FROM cases WHERE case_id = $1",
      [caseId]
    );

    if (caseData.rows.length === 0) {
      res.status(404).send("Case not found");
      return;
    }

    res.send(caseData.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
