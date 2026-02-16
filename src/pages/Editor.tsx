import { TextBehindEditor } from "@/components/TextBehindEditor";

const Editor = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 leading-relaxed pb-2 animate-fade-in">
          Text Behind Object
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Upload an image—the object is isolated automatically. Add text and
          drag to position it behind the subject
        </p>
        <TextBehindEditor />
      </div>
    </div>
  );
};

export default Editor;