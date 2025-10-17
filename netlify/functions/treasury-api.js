const https = require("https");

/**
 * Parse CSV data from Treasury Direct
 * CSV Format: Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const records = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(";");
    if (fields.length < 8) continue;

    // Parse date in DD/MM/YYYY format
    const dateParts = fields[1].split("/");
    let vencimento = null;
    if (dateParts.length === 3) {
      vencimento = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // Convert to YYYY-MM-DD
    }

    const record = {
      TpTitulo: fields[0], // Tipo Titulo
      VctdTitulo: vencimento, // Data Vencimento (converted to YYYY-MM-DD)
      DtBase: fields[2], // Data Base
      TxCompra: parseFloat(fields[3]?.replace(",", ".")) || null, // Taxa Compra Manha
      TxVenda: parseFloat(fields[4]?.replace(",", ".")) || null, // Taxa Venda Manha
      PUCompra: parseFloat(fields[5]?.replace(",", ".")) || null, // PU Compra Manha
      PUVenda: parseFloat(fields[6]?.replace(",", ".")) || null, // PU Venda Manha
      PUBase: parseFloat(fields[7]?.replace(",", ".")) || null, // PU Base Manha
    };

    records.push(record);
  }

  return records;
}

async function handler(event, context) {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("🔄 Netlify Function: Starting treasury data fetch...");

    // CKAN API is deprecated, using direct CSV download instead
    const csvUrl =
      "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv";

    const data = await new Promise(function (resolve, reject) {
      const options = {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/csv,*/*",
        },
      };

      https
        .get(csvUrl, options, function (res) {
          let body = "";

          console.log(`📊 Response status: ${res.statusCode}`);

          // Handle redirects
          if (res.statusCode === 301 || res.statusCode === 302) {
            console.log(`🔀 Redirect to: ${res.headers.location}`);
            reject(new Error(`Redirect not handled: ${res.headers.location}`));
            return;
          }

          // Handle errors
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP Error: ${res.statusCode}`));
            return;
          }

          res.on("data", function (chunk) {
            body += chunk;
          });

          res.on("end", function () {
            try {
              console.log(
                `📦 Received ${body.length} bytes (${(
                  body.length /
                  1024 /
                  1024
                ).toFixed(2)} MB)`
              );

              // Parse CSV data
              const records = parseCSV(body);
              console.log(`✅ Successfully parsed ${records.length} records`);

              // Return in the same format as old CKAN API
              resolve({
                success: true,
                result: {
                  records: records,
                },
              });
            } catch (parseError) {
              console.error("❌ CSV parse error:", parseError.message);
              reject(new Error("Failed to parse CSV response"));
            }
          });
        })
        .on("error", function (err) {
          console.error("❌ HTTPS request error:", err.message);
          reject(err);
        });
    });

    console.log("✅ Returning data to client");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("❌ Error in Netlify Function:", error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch treasury data",
        message: error.message,
        details: "Check Netlify function logs for more information",
      }),
    };
  }
}

exports.handler = handler;
