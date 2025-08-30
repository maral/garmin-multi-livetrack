"use client";

import { useState } from "react";
import GridCell from "./GridCell";
import TopBar from "./TopBar";

interface CellData {
  url: string;
  isEditing: boolean;
}

interface DynamicGridProps {
  initialState?: {
    rows: number;
    cols: number;
    cellData: Record<string, CellData>;
  };
}

export default function DynamicGrid({ initialState }: DynamicGridProps) {
  // Initialize state with provided initial state or defaults
  const [rows, setRows] = useState(initialState?.rows || 1);
  const [cols, setCols] = useState(initialState?.cols || 1);

  // Store cell data with URLs and edit states
  const [cellData, setCellData] = useState<Record<string, CellData>>(
    initialState?.cellData || {
      "0-0": { url: "", isEditing: true },
    }
  );

  // Functions to handle grid resizing
  const handleRowsChange = (newRows: number) => {
    if (newRows < 1) return;

    if (newRows > rows) {
      // Add new cell data for new rows
      setCellData((prevData) => {
        const newData = { ...prevData };
        for (let rowIndex = rows; rowIndex < newRows; rowIndex++) {
          for (let colIndex = 0; colIndex < cols; colIndex++) {
            const key = `${rowIndex}-${colIndex}`;
            if (!newData[key]) {
              newData[key] = { url: "", isEditing: true };
            }
          }
        }
        return newData;
      });
    }
    // Note: We don't delete cell data when reducing rows to preserve data
    setRows(newRows);
  };

  const handleColsChange = (newCols: number) => {
    if (newCols < 1) return;

    if (newCols > cols) {
      // Add new cell data for new columns
      setCellData((prevData) => {
        const newData = { ...prevData };
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          for (let colIndex = cols; colIndex < newCols; colIndex++) {
            const key = `${rowIndex}-${colIndex}`;
            if (!newData[key]) {
              newData[key] = { url: "", isEditing: true };
            }
          }
        }
        return newData;
      });
    }
    // Note: We don't delete cell data when reducing columns to preserve data
    setCols(newCols);
  };

  // Calculate optimal grid dimensions for a given number of cells
  const calculateOptimalDimensions = (
    cellCount: number,
    currentRows: number,
    currentCols: number
  ) => {
    // If current grid can already fit all cells, keep it
    if (currentRows * currentCols >= cellCount) {
      return { rows: currentRows, cols: currentCols };
    }

    // Find the most balanced dimensions that can fit all cells
    // Start from the square root and work outward to find the most balanced solution

    let bestRows = currentRows;
    let bestCols = Math.ceil(cellCount / currentRows); // Ensure we can fit all cells
    let bestDiff = Math.abs(bestRows - bestCols);

    // Try all possible row values, starting from those closest to square root
    const maxDimension = cellCount;

    for (
      let testRows = Math.max(currentRows, 1);
      testRows <= maxDimension;
      testRows++
    ) {
      const testCols = Math.max(currentCols, Math.ceil(cellCount / testRows));

      if (testRows * testCols >= cellCount) {
        const dimensionDiff = Math.abs(testRows - testCols);

        // Prefer more balanced dimensions (smaller difference between rows and cols)
        if (dimensionDiff < bestDiff) {
          bestRows = testRows;
          bestCols = testCols;
          bestDiff = dimensionDiff;
        }
      }
    }

    // Also try the other direction (cols first)
    for (
      let testCols = Math.max(currentCols, 1);
      testCols <= maxDimension;
      testCols++
    ) {
      const testRows = Math.max(currentRows, Math.ceil(cellCount / testCols));

      if (testRows * testCols >= cellCount) {
        const dimensionDiff = Math.abs(testRows - testCols);

        // Prefer more balanced dimensions
        if (dimensionDiff < bestDiff) {
          bestRows = testRows;
          bestCols = testCols;
          bestDiff = dimensionDiff;
        }
      }
    }

    return { rows: bestRows, cols: bestCols };
  };

  const handleBulkImport = (urls: string[]) => {
    if (urls.length === 0) return;

    // Calculate optimal grid dimensions
    const { rows: newRows, cols: newCols } = calculateOptimalDimensions(
      urls.length,
      rows,
      cols
    );

    // Update grid dimensions first
    setRows(newRows);
    setCols(newCols);

    // Add new cell data for expanded grid if needed
    setCellData((prevData) => {
      const newData = { ...prevData };

      // Initialize any missing cells
      for (let rowIndex = 0; rowIndex < newRows; rowIndex++) {
        for (let colIndex = 0; colIndex < newCols; colIndex++) {
          const key = `${rowIndex}-${colIndex}`;
          if (!newData[key]) {
            newData[key] = { url: "", isEditing: true };
          }
        }
      }

      // Fill cells with URLs (row by row, left to right)
      let urlIndex = 0;
      for (
        let rowIndex = 0;
        rowIndex < newRows && urlIndex < urls.length;
        rowIndex++
      ) {
        for (
          let colIndex = 0;
          colIndex < newCols && urlIndex < urls.length;
          colIndex++
        ) {
          const key = `${rowIndex}-${colIndex}`;
          newData[key] = {
            url: urls[urlIndex],
            isEditing: false,
          };
          urlIndex++;
        }
      }

      return newData;
    });
  };
  const updateCellData = (
    rowIndex: number,
    colIndex: number,
    data: Partial<CellData>
  ) => {
    const key = `${rowIndex}-${colIndex}`;
    setCellData((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...data },
    }));
  };

  // Generate grid cells for rendering
  const generateGridCells = () => {
    const cells = [];
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const key = `${rowIndex}-${colIndex}`;
        const data = cellData[key] || { url: "", isEditing: true };

        cells.push(
          <GridCell
            key={key}
            rowIndex={rowIndex}
            colIndex={colIndex}
            url={data.url}
            isEditing={data.isEditing}
            onUpdateData={(newData: Partial<CellData>) =>
              updateCellData(rowIndex, colIndex, newData)
            }
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        rows={rows}
        cols={cols}
        cellData={cellData}
        onRowsChange={handleRowsChange}
        onColsChange={handleColsChange}
        onBulkImport={handleBulkImport}
      />

      {/* Dynamic grid - fills remaining space */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {generateGridCells()}
      </div>
    </div>
  );
}
