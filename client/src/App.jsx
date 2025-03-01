import { useState } from "react";
import InputForm from "./components/InputForm";
import MindMap from "./components/MindMap";
import "./app.css";

function App() {
  const [mindMapData, setMindMapData] = useState(null);
  const [error, setError] = useState(null);

  // Sample test data for quick testing without API calls
  const testData = {
    name: "Test Topic",
    children: [
      {
        name: "Subtopic 1",
        children: [{ name: "Detail 1.1" }, { name: "Detail 1.2" }],
      },
      {
        name: "Subtopic 2",
        children: [{ name: "Detail 2.1" }, { name: "Detail 2.2" }],
      },
    ],
  };

  const handleGenerate = (data) => {
    if (!data) {
      setError("Failed to generate mind map");
      return;
    }
    setMindMapData(data);
    setError(null);
    console.log("Mind map data received:", JSON.stringify(data, null, 2));
  };

  // Function to load test data
  const loadTestData = () => {
    setMindMapData(testData);
    setError(null);
  };

  return (
    <div className="App">
      <h1>MindMap App</h1>
      <InputForm onGenerate={handleGenerate} />

      {/* Debug/Test Controls */}
      <div className="debug-controls">
        <button onClick={loadTestData}>Load Test Data</button>
        <button onClick={() => console.log(mindMapData)}>
          Log Current Data
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {mindMapData && <MindMap data={mindMapData} />}
    </div>
  );
}

export default App;
