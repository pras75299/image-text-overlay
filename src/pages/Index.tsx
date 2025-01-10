import { ImageEditor } from "@/components/ImageEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 leading-relaxed pb-2">
          Image Text Editor
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Upload an image, add custom text, and create beautiful designs
        </p>
        <ImageEditor />
      </div>
    </div>
  );
};

export default Index;
