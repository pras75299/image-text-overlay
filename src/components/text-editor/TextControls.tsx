import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TextControlsProps {
  fontSize: number;
  setFontSize: (value: number) => void;
  fontWeight: number;
  setFontWeight: (value: number) => void;
  textColor: string;
  setTextColor: (value: string) => void;
  opacity: number;
  setOpacity: (value: number) => void;
  rotation: number;
  setRotation: (value: number) => void;
  horizontalTilt: number;
  setHorizontalTilt: (value: number) => void;
  verticalTilt: number;
  setVerticalTilt: (value: number) => void;
  positionX: number;
  setPositionX: (value: number) => void;
  positionY: number;
  setPositionY: (value: number) => void;
  fontFamily: string;
  setFontFamily: (value: string) => void;
  textContent: string;
  setTextContent: (value: string) => void;
}

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Verdana",
  "Georgia",
  "Courier New",
];

export const TextControls = ({
  fontSize,
  setFontSize,
  fontWeight,
  setFontWeight,
  textColor,
  setTextColor,
  opacity,
  setOpacity,
  rotation,
  setRotation,
  horizontalTilt,
  setHorizontalTilt,
  verticalTilt,
  setVerticalTilt,
  positionX,
  setPositionX,
  positionY,
  setPositionY,
  fontFamily,
  setFontFamily,
  textContent,
  setTextContent,
}: TextControlsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">
          Text Content
        </Label>
        <Input
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="mt-1"
          placeholder="Enter text"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Font Family</Label>
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label
          htmlFor="text-color"
          className="text-sm font-medium text-gray-700"
        >
          Text Color
        </Label>
        <Input
          id="text-color"
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="h-10 p-1 w-full mt-1 border rounded-md"
        />
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-700">Position X</Label>
        <Slider
          value={[positionX]}
          onValueChange={(value) => setPositionX(value[0])}
          // Adjust max value considering text width
          max={700} // Reduced from 800 to keep text visible
          min={100} // Increased from 0 to keep text visible
          step={1}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Position Y</Label>
        <Slider
          value={[positionY]}
          onValueChange={(value) => setPositionY(value[0])}
          // Adjust max value considering text height
          max={500} // Reduced from 600 to keep text visible
          min={100} // Increased from 0 to keep text visible
          step={1}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Font Size</Label>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
          max={210}
          min={12}
          step={1}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Font Weight</Label>
        <Slider
          value={[fontWeight]}
          onValueChange={(value) => setFontWeight(value[0])}
          max={900}
          min={100}
          step={100}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Opacity</Label>
        <Slider
          value={[opacity]}
          onValueChange={(value) => setOpacity(value[0])}
          max={1}
          min={0}
          step={0.1}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Rotation</Label>
        <Slider
          value={[rotation]}
          onValueChange={(value) => setRotation(value[0])}
          max={360}
          min={0}
          step={1}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          Horizontal Tilt
        </Label>
        <Slider
          value={[horizontalTilt]}
          onValueChange={(value) => setHorizontalTilt(value[0])}
          max={45}
          min={-45}
          step={1}
          className="my-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          Vertical Tilt
        </Label>
        <Slider
          value={[verticalTilt]}
          onValueChange={(value) => setVerticalTilt(value[0])}
          max={45}
          min={-45}
          step={1}
          className="my-2"
        />
      </div>
    </div>
  );
};
