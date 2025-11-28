import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PresentationAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayPresentation = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-presentation-audio");

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error("Áudio não gerado");
      }

      // Converter base64 para Blob
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );

      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);

      newAudio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      newAudio.onerror = () => {
        setIsPlaying(false);
        toast.error("Erro ao reproduzir áudio");
        URL.revokeObjectURL(audioUrl);
      };

      await newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
      toast.success("Reproduzindo apresentação");

    } catch (error) {
      console.error("Erro ao gerar apresentação:", error);
      toast.error("Erro ao gerar áudio de apresentação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            🎙️ Apresentação do Équilibra
          </h3>
          <p className="text-sm text-muted-foreground">
            Ouça uma apresentação completa sobre todas as funcionalidades do Équilibra
          </p>
        </div>
        <Button
          onClick={handlePlayPresentation}
          disabled={isLoading}
          size="lg"
          className="gap-2 min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando...
            </>
          ) : isPlaying ? (
            <>
              <VolumeX className="h-5 w-5" />
              Parar
            </>
          ) : (
            <>
              <Volume2 className="h-5 w-5" />
              Ouvir
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
