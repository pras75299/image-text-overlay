import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 animate-fade-in">
          Text Behind Object
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
          Place text behind people or objects in your images. Upload a photo, remove the background, and create striking designs in seconds.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={() => navigate("/editor")}
            className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 transition-colors animate-scale-in hover:scale-105 transform transition-transform duration-200"
          >
            Get Started
          </Button>
          
          <p className="text-sm text-gray-500">
            No account required. Start creating right away!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;