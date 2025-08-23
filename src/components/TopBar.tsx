import GridControls from "./GridControls";
import BulkUrlImport from "./BulkUrlImport";

interface TopBarProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  onBulkImport: (urls: string[]) => void;
}

export default function TopBar({ rows, cols, onRowsChange, onColsChange, onBulkImport }: TopBarProps) {
  return (
    <div className="h-14 px-6 py-2 flex items-center justify-between border-b">
      <h1 className="text-xl font-bold">Garmin Multi LiveTrack</h1>
      <div className="flex items-center gap-4">
        <BulkUrlImport onImportUrls={onBulkImport} />
        <GridControls 
          rows={rows}
          cols={cols}
          onRowsChange={onRowsChange}
          onColsChange={onColsChange}
        />
      </div>
    </div>
  );
}
