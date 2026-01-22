import { SendHorizonal } from "lucide-react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<string[]>([]);

  const getMessages = async () => {
    axios.get("http://localhost:3000/ai/messages").then((res) => {
      setMessageList(res.data.messages);
    });
  };

  const generateText = async () => {
    axios.post("http://localhost:3000/ai/generate", { prompt }).then((res) => {
      setMessageList((prev) => [...prev, prompt, res.data.text]);
      setPrompt("");
    });
  };

  useEffect(() => {
    getMessages();
  }, []);

  return (
    <div className="h-screen bg-background text-secondary-foreground">
      <div className="w-4/6 min-w-150 h-full mx-auto py-2 flex flex-col justify-between items-center">
        <div className="w-full">
          <h1 className="font-bold text-primary text-5xl text-center py-2">
            IA Chat - Prototype
          </h1>
          <div className="w-full flex flex-col gap-y-2 justify-center">
            {messageList.map((message, index) => (
              <p
                key={index}
                className={`${index % 2 === 0 ? "bg-primary" : "ml-auto bg-primary-foreground text-secondary"} w-3/4 border-neutral-600 px-2 py-1 rounded-lg`}
              >
                {message}
              </p>
            ))}
          </div>
        </div>
        <div className="w-full flex gap-x-2 justify-center items-center">
          <Input
            className="w-full bg-card"
            placeholder="Prompt.."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button className="cursor-pointer" onClick={() => generateText()}>
            <SendHorizonal />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
