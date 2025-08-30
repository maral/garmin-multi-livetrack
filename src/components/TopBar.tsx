import Link from "next/link";
import { Home } from "lucide-react";
import GridControls from "./GridControls";
import BulkUrlImport from "./BulkUrlImport";
import ShareButton from "./ShareButton";
import MobileControlsModal from "./MobileControlsModal";
import { Button } from "./ui/button";

interface TopBarProps {
  rows: number;
  cols: number;
  cellData: Record<string, { url: string; isEditing: boolean }>;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  onBulkImport: (urls: string[]) => void;
}

export default function TopBar({
  rows,
  cols,
  cellData,
  onRowsChange,
  onColsChange,
  onBulkImport,
}: TopBarProps) {
  return (
    <div className="h-14 px-4 sm:px-6 py-2 flex items-center justify-between border-b">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold truncate">
          <span className="hidden sm:inline">Grid View</span>
          <span className="sm:hidden flex flex-col leading-tight text-sm">
            <span>Grid</span>
            <span>View</span>
          </span>
        </h1>
      </div>

      {/* Mobile + Small Screen Controls - Always show Share + Import, Menu visible sm-lg */}
      <div className="flex items-center gap-2">
        <ShareButton rows={rows} cols={cols} cellData={cellData} />
        <BulkUrlImport onImportUrls={onBulkImport} />

        {/* Grid Controls - Only on lg+ */}
        <div className="hidden lg:flex">
          <GridControls
            rows={rows}
            cols={cols}
            onRowsChange={onRowsChange}
            onColsChange={onColsChange}
          />
        </div>

        {/* Mobile Controls Modal - Hidden on lg+ */}
        <div className="lg:hidden">
          <MobileControlsModal
            rows={rows}
            cols={cols}
            cellData={cellData}
            onRowsChange={onRowsChange}
            onColsChange={onColsChange}
            onBulkImport={onBulkImport}
          />
        </div>
      </div>
    </div>
  );
}
