import { Button } from "@/components/ui/button";
import { Type, Copy, Trash2 } from "lucide-react";

interface TextActionsProps {
  selectedLayerId: string | null;
  onAddText: () => void;
  onDuplicateText: () => void;
  onRemoveText: () => void;
}

export const TextActions = ({
  selectedLayerId,
  onAddText,
  onDuplicateText,
  onRemoveText,
}: TextActionsProps) => {
  return (
    <div className="space-y-4">
      <Button
        onClick={onAddText}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Type className="mr-2 h-4 w-4" />
        Add Text
      </Button>

      {selectedLayerId && (
        <div className="flex gap-2">
          <Button
            onClick={onDuplicateText}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            onClick={onRemoveText}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};