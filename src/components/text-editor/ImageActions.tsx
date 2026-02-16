import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";

interface ImageActionsProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadImage: () => void;
}

export const ImageActions = ({ onImageUpload, onDownloadImage }: ImageActionsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="image-upload" className="text-lg font-semibold text-gray-700 mb-4 flex">
          Upload Image
        </Label>
        <div className="relative">
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImageUpload}
          />
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose Image
          </Button>
        </div>
      </div>

      <Button
        onClick={onDownloadImage}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <Download className="mr-2 h-4 w-4" />
        Download Image
      </Button>
    </div>
  );
};