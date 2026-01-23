import { Loader, SendHorizonal } from "lucide-react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://back:3000";

  const getMessages = async () => {
    await axios.get(`${API_URL}/ai/messages`).then((res) => {
      setMessageList(res.data.messages);
    });
  };

  const generateText = async () => {
    setIsPrompting(true);
    await axios.post(`${API_URL}/ai/generate`, { prompt }).then((res) => {
      setMessageList((prev) => [...prev, prompt, res.data.text]);
      setPrompt("");
    });
    setIsPrompting(false);
  };

  useEffect(() => {
    getMessages();
  }, []);

  return (
    <div className="w-screen h-screen bg-background text-secondary-foreground">
      <div className="w-4/6 min-w-150 h-full mx-auto py-2 flex flex-col justify-between items-center">
        <div className="w-full flex-1 space-y-2 overflow-y-scroll mb-4">
          {messageList.map((message, index) => (
            <p
              key={index}
              className={`${index % 2 === 0 ? "bg-primary" : "ml-auto bg-primary-foreground text-secondary"} w-3/4 border-neutral-600 px-2 py-1 rounded-lg`}
            >
              {message}
            </p>
          ))}
        </div>
        <form
          className="w-full flex gap-x-2 justify-center items-center"
          onSubmit={(e) => {
            e.preventDefault();
            generateText();
          }}
        >
          <Input
            disabled={isPrompting}
            className="w-full bg-card"
            placeholder="Prompt.."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            disabled={isPrompting}
            className="cursor-pointer"
            type="submit"
          >
            {isPrompting ? (
              <Loader className="animate-spin" />
            ) : (
              <SendHorizonal />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default App;
