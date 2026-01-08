import { Check, Minus, Crown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Feature {
  name: string;
  start: boolean | string;
  pro: boolean | string;
  isCategory?: boolean;
  highlight?: boolean;
}

const features: Feature[] = [
  { name: "O Básico para Rodar", start: "", pro: "", isCategory: true },
  { name: "PDV e Comanda Digital", start: true, pro: true },
  { name: "KDS (Tela de Produção)", start: true, pro: true },
  
  { name: "Controle & Segurança", start: "", pro: "", isCategory: true },
  { name: "Usuários do Sistema", start: "Apenas 2", pro: "Ilimitados", highlight: true },
  { name: "Permissões de Acesso (Gerente vs Garçom)", start: false, pro: true, highlight: true },
  { name: "Auditoria de Cancelamentos", start: false, pro: true, highlight: true },
  { name: "Histórico de Edições de Pedido", start: false, pro: true, highlight: true },
  
  { name: "Inteligência de Lucro", start: "", pro: "", isCategory: true },
  { name: "Relatório de Vendas Simples", start: true, pro: true },
  { name: "Dashboard Financeiro (DRE)", start: false, pro: true, highlight: true },
  { name: "Ranking de Produtos (Curva ABC)", start: false, pro: true, highlight: true },
  { name: "Mapa de Calor (Horários de Pico)", start: false, pro: true, highlight: true },
  
  { name: "Suporte", start: "", pro: "", isCategory: true },
  { name: "Canal Exclusivo WhatsApp", start: false, pro: true, highlight: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  }
  
  if (value) {
    return <Check className="h-5 w-5 text-green-500 mx-auto" />;
  }
  
  return <Minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
}

export function PlanComparison() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Compare os detalhes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>

        <div className="bg-background rounded-2xl shadow-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[50%] text-foreground font-semibold py-4">
                  Recursos
                </TableHead>
                <TableHead className="text-center text-foreground font-semibold py-4">
                  <div className="flex flex-col items-center gap-1">
                    <span>Start</span>
                    <span className="text-sm font-normal text-muted-foreground">R$ 99,90/mês</span>
                  </div>
                </TableHead>
                <TableHead className="text-center py-4 bg-primary/5 border-l-2 border-r-2 border-primary/20">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span className="text-foreground font-semibold">Pro</span>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">R$ 149,90/mês</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature, index) => (
                <TableRow 
                  key={index}
                  className={`
                    ${feature.isCategory 
                      ? "bg-muted/30 hover:bg-muted/30" 
                      : feature.highlight 
                        ? "bg-amber-50/50 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20" 
                        : "hover:bg-muted/20"
                    }
                  `}
                >
                  <TableCell 
                    className={`py-3 ${feature.isCategory 
                      ? "font-semibold text-foreground text-sm uppercase tracking-wide pt-6" 
                      : "pl-6 text-muted-foreground"
                    }`}
                  >
                    {feature.name}
                  </TableCell>
                  {!feature.isCategory && (
                    <>
                      <TableCell className="text-center py-3">
                        <FeatureValue value={feature.start} />
                      </TableCell>
                      <TableCell className="text-center py-3 bg-primary/5 border-l-2 border-r-2 border-primary/20">
                        <FeatureValue value={feature.pro} />
                      </TableCell>
                    </>
                  )}
                  {feature.isCategory && (
                    <>
                      <TableCell className="py-3"></TableCell>
                      <TableCell className="py-3 bg-primary/5 border-l-2 border-r-2 border-primary/20"></TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
}
