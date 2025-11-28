import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SimpleLayout from "@/components/SimpleLayout";

export default function FAQ() {
  const faqItems = [
    {
      question: "O que é o Équilibra?",
      answer: "Équilibra é um assistente financeiro universitário que ajuda estudantes e trabalhadores a gerenciar suas finanças pessoais e profissionais com inteligência artificial. Separe gastos de trabalho e vida pessoal facilmente."
    },
    {
      question: "Como funciona o modo Trabalho vs Pessoal?",
      answer: "O toggle no topo da aplicação permite separar suas transações entre Trabalho e Pessoal. Todas as visualizações (Dashboard, Extrato, Insights) são filtradas automaticamente baseado no modo selecionado."
    },
    {
      question: "Como adiciono transações?",
      answer: "Clique no botão '+' no Dashboard ou acesse a página Extrato. Você pode adicionar entradas (receitas) ou saídas (despesas), escolher a categoria, valor e modo (Trabalho ou Pessoal)."
    },
    {
      question: "O que são Insights?",
      answer: "Insights são análises automáticas geradas por três sistemas de IA: Regressão Linear (previsões), Árvore de Decisão (alertas) e Heurísticas (padrões). O sistema identifica riscos, oportunidades e tendências nos seus gastos."
    },
    {
      question: "Como funcionam as Metas?",
      answer: "Na página Metas, você define limites de gastos por categoria e por modo (Trabalho/Pessoal). O sistema alerta quando você se aproxima ou ultrapassa os limites definidos."
    },
    {
      question: "O que são as Ofertas Personalizadas?",
      answer: "Baseado nos seus padrões de gastos, o sistema gera ofertas de cashback, empréstimos e seguros personalizadas. Por exemplo, se você gasta muito em Transporte, pode receber oferta de seguro auto com desconto."
    },
    {
      question: "Quais serviços financeiros estão disponíveis?",
      answer: "PIX, Recarga de celular, Benefícios (VR/VA/VT), Cashback, Seguros, Empréstimos e Links de Pagamento. Todos os serviços são simulados para demonstração."
    },
    {
      question: "Como funciona o Chatbot?",
      answer: "O chatbot analisa seus dados financeiros em tempo real e identifica riscos, alertas de gastos altos, prazos de pagamento e gera insights contextualizados sobre sua situação financeira."
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim! Usamos Row Level Security (RLS) no Supabase, garantindo que você só acesse seus próprios dados. Todas as políticas de segurança são aplicadas no nível do banco de dados."
    },
    {
      question: "Como funciona a previsão financeira?",
      answer: "O sistema usa Regressão Linear para analisar seus gastos diários e projetar seu saldo até o fim do mês. A análise mostra se você está em zona de risco (vermelho), atenção (amarelo) ou segurança (verde/azul)."
    }
  ];

  return (
    <SimpleLayout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Perguntas Frequentes
            </h1>
          </div>
          <p className="text-muted-foreground">
            Tire suas dúvidas sobre o Équilibra
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-2">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-4 bg-card"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-foreground">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Footer */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Não encontrou o que procurava?{" "}
            <span className="text-primary font-medium">
              Entre em contato com o suporte
            </span>
          </p>
        </div>
      </div>
    </SimpleLayout>
  );
}
