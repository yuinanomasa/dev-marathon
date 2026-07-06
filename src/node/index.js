const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 3000;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_5923", // PostgreSQLのユーザー名に置き換えてください
  host: "postgres",
  database: "crm_5923", // PostgreSQLのデータベース名に置き換えてください
  password: "pass_5923", // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});
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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});