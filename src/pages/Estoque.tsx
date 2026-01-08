import { Package } from 'lucide-react';

export default function Estoque() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Estoque</h1>
        <p className="text-muted-foreground">Em breve</p>
      </div>
    </div>
  );
}
