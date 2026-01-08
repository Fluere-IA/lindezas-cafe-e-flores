import { Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Estoque() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/configuracoes')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
      
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Em breve</p>
        </div>
      </div>
    </div>
  );
}
