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

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
