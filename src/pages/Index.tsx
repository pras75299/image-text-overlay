import { ImageEditor } from "@/components/ImageEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">
          Image Text Editor
        </h1>
        <ImageEditor />
      </div>
    </div>
  );
};

export default Index;