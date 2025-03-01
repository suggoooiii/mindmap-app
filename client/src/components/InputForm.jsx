import React, { useState } from "react";
import axios from "axios";

function InputForm({ onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update this URL to point to your backend server
      const response = await axios.post(
        "http://localhost:5001/api/generate-mindmap",
        {
          prompt,
        }
      );

      onGenerate(response.data);
    } catch (error) {
      console.error("Error generating mind map:", error);
      onGenerate(null); // Pass null to indicate error
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a topic to generate a mind map..."
        rows={4}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate Mind Map"}
      </button>
    </form>
  );
}

export default InputForm;
