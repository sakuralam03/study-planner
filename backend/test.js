const express = require("express");
const app = express();

app.use(express.json());

app.post("/validate-selection", (req, res) => {
  console.log("Route hit", req.body);
  res.json({ message: "Route works!", body: req.body });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
