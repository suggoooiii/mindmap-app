import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function MindMap({ data }) {
  const svgRef = useRef();
  const [nodeColor, setNodeColor] = useState("#1f77b4"); // Default root node color

  useEffect(() => {
    if (!data) return;

    // SVG dimensions
    const width = 800;
    const height = 800;
    const radius = width / 2;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Add zoom and pan functionality
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 2]) // Limit zoom scale
      .on("zoom", (e) => svg.attr("transform", e.transform));
    d3.select(svgRef.current).call(zoom);

    // Create radial tree layout
    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([2 * Math.PI, radius]);
    treeLayout(root);

    // Convert to radial coordinates
    root.descendants().forEach((d) => {
      const angle = d.x * (180 / Math.PI);
      const radial = d.y;
      d.x = radial * Math.cos((angle - 90) * (Math.PI / 180));
      d.y = radial * Math.sin((angle - 90) * (Math.PI / 180));
    });

    // Draw links
    const linkGenerator = d3
      .linkRadial()
      .angle((d) => d.x)
      .radius((d) => d.y);

    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    // Draw nodes
    const nodes = svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .on("click", (e, d) => toggleChildren(d));

    nodes
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) =>
        d.depth === 0 ? nodeColor : d3.interpolateBlues(1 - d.depth / 5)
      )
      .style("filter", "drop-shadow(2px 2px 3px rgba(0,0,0,0.3))");

    // Add text with wrapping
    nodes
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d.children ? -12 : 12))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .style("font-size", "12px")
      .text((d) => d.data.name)
      .call(wrapText, 100); // Wrap text within 100px

    // Add tooltips
    nodes
      .on("mouseover", (e, d) => {
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY + 10}px`)
          .text(d.data.name);
      })
      .on("mouseout", () => d3.select("#tooltip").style("display", "none"));

    // Function to toggle children (expand/collapse)
    function toggleChildren(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(); // Re-render the tree
    }

    // Function to update the tree after toggling
    function update() {
      treeLayout(root);
      root.descendants().forEach((d) => {
        const angle = d.x * (180 / Math.PI);
        const radial = d.y;
        d.x = radial * Math.cos((angle - 90) * (Math.PI / 180));
        d.y = radial * Math.sin((angle - 90) * (Math.PI / 180));
      });

      // Update links
      svg.selectAll(".link").data(root.links()).attr("d", linkGenerator);

      // Update nodes
      const nodeUpdate = svg
        .selectAll(".node")
        .data(root.descendants(), (d) => d.id || (d.id = ++i));

      const nodeEnter = nodeUpdate
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
        .on("click", (e, d) => toggleChildren(d));

      nodeEnter
        .append("circle")
        .attr("r", 10)
        .attr("fill", (d) =>
          d.depth === 0 ? nodeColor : d3.interpolateBlues(1 - d.depth / 5)
        )
        .style("filter", "drop-shadow(2px 2px 3px rgba(0,0,0,0.3))");

      nodeEnter
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d.children ? -12 : 12))
        .attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .style("font-size", "12px")
        .text((d) => d.data.name)
        .call(wrapText, 100);

      nodeUpdate.exit().remove();
    }

    // Text wrapping function
    function wrapText(text, width) {
      text.each(function () {
        const textElement = d3.select(this),
          words = textElement.text().split(/\s+/).reverse(),
          lineHeight = 1.1,
          y = textElement.attr("y"),
          dy = parseFloat(textElement.attr("dy"));
        let line = [],
          lineNumber = 0,
          tspan = textElement
            .text(null)
            .append("tspan")
            .attr("x", textElement.attr("x"))
            .attr("dy", dy);

        while (words.length > 0) {
          const word = words.pop();
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = textElement
              .append("tspan")
              .attr("x", textElement.attr("x"))
              .attr("dy", lineHeight + "em")
              .text(word);
            lineNumber++;
          }
        }
      });
    }
  }, [data, nodeColor]);

  return (
    <div>
      {/* Customization Panel */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Root Node Color:
          <input
            type="color"
            value={nodeColor}
            onChange={(e) => setNodeColor(e.target.value)}
          />
        </label>
      </div>
      {/* SVG Container */}
      <svg ref={svgRef}></svg>
      {/* Tooltip */}
      <div
        id="tooltip"
        style={{
          position: "absolute",
          display: "none",
          background: "#fff",
          padding: "5px",
          border: "1px solid #ccc",
          borderRadius: "3px",
          boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
        }}
      ></div>
    </div>
  );
}

export default MindMap;
