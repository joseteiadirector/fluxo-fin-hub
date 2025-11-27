import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Home, FileText, Lightbulb, Target, Gift, Briefcase, Settings, CreditCard, Smartphone, CircleDollarSign, Coins, Shield, PiggyBank, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  onOpenService?: (service: string) => void;
}

export const ChatBot = ({ onOpenService }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const initialMessage: Message = {
    role: "assistant",
    content: "Olá! 👋 Sou o assistente do Équilibra. Como posso ajudar você hoje? Posso te dar atalhos, explicar funcionalidades ou responder suas dúvidas sobre o app!"
  };
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Limpar mensagens quando fechar o chat
  const handleClose = () => {
    setIsOpen(false);
    // Resetar para mensagem inicial após um pequeno delay
    setTimeout(() => {
      setMessages([initialMessage]);
    }, 300);
  };

  const handleShortcut = (shortcut: string) => {
    const shortcuts: Record<string, () => void> = {
      dashboard: () => navigate("/"),
      extrato: () => navigate("/extrato"),
      insights: () => navigate("/insights"),
      metas: () => navigate("/metas"),
      ofertas: () => navigate("/ofertas"),
      servicos: () => navigate("/servicos"),
      preferencias: () => navigate("/preferencias"),
      pix: () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("pix"), 300);
      },
      recarga: () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("recarga"), 300);
      },
      beneficios: () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("beneficios"), 300);
      },
      cashback: () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("cashback"), 300);
      },
      seguros: () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("seguros"), 300);
      },
      emprestimos: () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("emprestimos"), 300);
      },
      "payment-link": () => {
        navigate("/servicos");
        setTimeout(() => onOpenService?.("payment-link"), 300);
      }
    };

    const action = shortcuts[shortcut];
    if (action) {
      action();
      toast.success("Navegando...");
    }
  };

  const parseMessageWithShortcuts = (content: string) => {
    const shortcutRegex = /\[ATALHO:(\w+-?\w*)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    const shortcutIcons: Record<string, JSX.Element> = {
      dashboard: <Home className="w-3 h-3" />,
      extrato: <FileText className="w-3 h-3" />,
      insights: <Lightbulb className="w-3 h-3" />,
      metas: <Target className="w-3 h-3" />,
      ofertas: <Gift className="w-3 h-3" />,
      servicos: <Briefcase className="w-3 h-3" />,
      preferencias: <Settings className="w-3 h-3" />,
      pix: <CreditCard className="w-3 h-3" />,
      recarga: <Smartphone className="w-3 h-3" />,
      beneficios: <CircleDollarSign className="w-3 h-3" />,
      cashback: <Coins className="w-3 h-3" />,
      seguros: <Shield className="w-3 h-3" />,
      emprestimos: <PiggyBank className="w-3 h-3" />,
      "payment-link": <Link2 className="w-3 h-3" />
    };

    while ((match = shortcutRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const shortcutName = match[1];
      const icon = shortcutIcons[shortcutName] || <MessageCircle className="w-3 h-3" />;

      parts.push(
        <Button
          key={match.index}
          variant="outline"
          size="sm"
          className="mx-1 h-7 text-xs"
          onClick={() => handleShortcut(shortcutName)}
        >
          {icon}
          <span className="ml-1 capitalize">{shortcutName.replace("-", " ")}</span>
        </Button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            message: input,
            conversationHistory: []
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro da API:", errorData);
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Assistente Équilibra</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {parseMessageWithShortcuts(msg.content)}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
