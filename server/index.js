require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in environment variables");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post("/api/generate-mindmap", async (req, res) => {
  const { prompt } = req.body;
  try {
    // Define the mind map schema
    const mindMapSchema = {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        children: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              children: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    children: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          name: { type: "STRING" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      required: ["name", "children"],
    };

    // Create enhanced prompt with instructions for hierarchy
    const enhancedPrompt = `Create a hierarchical mind map about: ${prompt}. 
    Return it as a JSON object with a root node named after the main topic, and children nodes for subtopics.
    The structure should be: {name: "root topic", children: [{name: "subtopic", children: [{name: "detail"}]}]}
    Use at least 2-3 levels of hierarchy to organize the information.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
        responseSchema: mindMapSchema,
      },
    });

    // Extract the JSON directly from the response
    const mindMapData = JSON.parse(result.response.text());
    res.json(mindMapData);
  } catch (error) {
    console.error("Error generating mind map:", error);
    res
      .status(500)
      .json({ error: "Failed to generate mind map", details: error.message });
  }
});

// Try to start the server with error handling
const server = app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${PORT} is already in use`);

      // Try to use an alternative port
      const altPort = parseInt(PORT) + 1;
      console.log(`Attempting to use port ${altPort} instead...`);

      app
        .listen(altPort, () => {
          console.log(`Server is now running on port ${altPort}`);
        })
        .on("error", (err) => {
          console.error("Failed to start server on alternative port:", err);
          process.exit(1);
        });
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
