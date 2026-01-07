import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Palette, 
  Upload, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  Sparkles,
  FileText,
  LayoutGrid,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  name: string;
  price: string;
  category: string;
}

const EXAMPLE_ITEMS: MenuItem[] = [
  { name: 'Café Expresso', price: '5.00', category: 'Bebidas' },
  { name: 'Cappuccino', price: '8.50', category: 'Bebidas' },
  { name: 'Pão de Queijo', price: '4.00', category: 'Salgados' },
  { name: 'Coxinha', price: '6.00', category: 'Salgados' },
  { name: 'Bolo de Chocolate', price: '7.50', category: 'Doces' },
  { name: 'Suco Natural', price: '9.00', category: 'Bebidas' },
];

const PRESET_COLORS = [
  '#2563EB', // Blue
  '#16A34A', // Green
  '#9333EA', // Purple
  '#DC2626', // Red
  '#EA580C', // Orange
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#DB2777', // Pink
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization, refetchOrganizations } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [themeColor, setThemeColor] = useState('#2563EB');
  const [customColor, setCustomColor] = useState('#2563EB');
  const [tableCount, setTableCount] = useState(10);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualItem, setManualItem] = useState<MenuItem>({ name: '', price: '', category: '' });

  const totalSteps = 4;

  const handleColorSelect = (color: string) => {
    setThemeColor(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setThemeColor(color);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, envie uma imagem do cardápio.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingOCR(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call OCR edge function
      const { data, error } = await supabase.functions.invoke('ocr-menu', {
        body: { image: base64 },
      });

      if (error) throw error;

      if (data?.items && Array.isArray(data.items)) {
        setMenuItems(prev => [...prev, ...data.items]);
        toast({
          title: 'Cardápio processado!',
          description: `${data.items.length} itens identificados.`,
        });
      } else {
        toast({
          title: 'Nenhum item encontrado',
          description: 'Tente uma imagem mais clara ou adicione os itens manualmente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'Erro ao processar imagem',
        description: 'Tente novamente ou adicione os itens manualmente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingOCR(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.price) {
      toast({
        title: 'Preencha os campos',
        description: 'Nome e preço são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setMenuItems(prev => [...prev, { ...manualItem }]);
    setManualItem({ name: '', price: '', category: '' });
  };

  const removeItem = (index: number) => {
    setMenuItems(prev => prev.filter((_, i) => i !== index));
  };

  const loadExampleItems = () => {
    setMenuItems(EXAMPLE_ITEMS);
    toast({
      title: 'Itens de exemplo carregados!',
      description: 'Você pode editá-los ou removê-los depois.',
    });
  };

  const handleFinish = async () => {
    if (!currentOrganization) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update organization with theme color and table count
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          theme_color: themeColor,
          table_count: tableCount,
          onboarding_completed: true,
        })
        .eq('id', currentOrganization.id);

      if (orgError) throw orgError;

      // Create categories from menu items
      const uniqueCategories = [...new Set(menuItems.map(item => item.category || 'Geral'))];
      const categoryMap: Record<string, string> = {};

      for (const categoryName of uniqueCategories) {
        const { data: cat, error: catError } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            type: 'product',
            organization_id: currentOrganization.id,
          })
          .select()
          .single();

        if (catError) {
          console.error('Category creation error:', catError);
          continue;
        }
        categoryMap[categoryName] = cat.id;
      }

      // Create products
      const itemsToInsert = menuItems.map(item => ({
        name: item.name,
        price: parseFloat(item.price) || 0,
        category_id: categoryMap[item.category || 'Geral'] || null,
        organization_id: currentOrganization.id,
        is_active: true,
        stock: 100,
      }));

      if (menuItems.length === 0) {
        // Load example items if none were added
        const defaultCategory = await supabase
          .from('categories')
          .insert({
            name: 'Geral',
            type: 'product',
            organization_id: currentOrganization.id,
          })
          .select()
          .single();

        const exampleProducts = EXAMPLE_ITEMS.map(item => ({
          name: item.name,
          price: parseFloat(item.price),
          category_id: defaultCategory.data?.id || null,
          organization_id: currentOrganization.id,
          is_active: true,
          stock: 100,
        }));

        await supabase.from('products').insert(exampleProducts);
      } else if (itemsToInsert.length > 0) {
        const { error: prodError } = await supabase
          .from('products')
          .insert(itemsToInsert);

        if (prodError) throw prodError;
      }

      await refetchOrganizations();

      toast({
        title: 'Configuração concluída!',
        description: 'Seu estabelecimento está pronto para uso.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Erro ao finalizar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Personalize seu Sistema</h2>
        <p className="text-muted-foreground mt-2">Escolha a cor principal do seu estabelecimento</p>
      </div>

      <div className="space-y-4">
        <Label>Cores pré-definidas</Label>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={cn(
                "w-full aspect-square rounded-xl border-2 transition-all",
                themeColor === color
                  ? "border-foreground scale-105 shadow-lg"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
            >
              {themeColor === color && (
                <Check className="w-6 h-6 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>

        <div className="pt-4">
          <Label>Cor personalizada</Label>
          <div className="flex items-center gap-3 mt-2">
            <div
              className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer overflow-hidden"
              style={{ backgroundColor: customColor }}
            >
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setCustomColor(val);
                  if (val.length === 7) setThemeColor(val);
                }
              }}
              placeholder="#2563EB"
              className="w-32 font-mono"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30">
          <Label className="text-xs text-muted-foreground">Prévia</Label>
          <div className="mt-3 flex items-center gap-3">
            <Button
              className="text-white"
              style={{ backgroundColor: themeColor }}
            >
              Botão Principal
            </Button>
            <div
              className="h-10 px-4 rounded-lg flex items-center text-white font-medium"
              style={{ backgroundColor: themeColor }}
            >
              Cabeçalho
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Configure seu Cardápio</h2>
        <p className="text-muted-foreground mt-2">Envie uma foto do cardápio ou adicione itens manualmente</p>
      </div>

      {/* Upload Area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
          isProcessingOCR 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onClick={() => !isProcessingOCR && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        {isProcessingOCR ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando cardápio com IA...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Enviar foto do cardápio</p>
              <p className="text-sm text-muted-foreground">A IA identificará os itens automaticamente</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Add */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar item manualmente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Nome do item"
              value={manualItem.name}
              onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
            />
            <Input
              placeholder="Preço"
              type="number"
              step="0.01"
              value={manualItem.price}
              onChange={(e) => setManualItem({ ...manualItem, price: e.target.value })}
            />
            <Input
              placeholder="Categoria"
              value={manualItem.category}
              onChange={(e) => setManualItem({ ...manualItem, category: e.target.value })}
            />
          </div>
          <Button onClick={addManualItem} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      {/* Items List */}
      {menuItems.length > 0 && (
        <div className="space-y-2">
          <Label>{menuItems.length} itens adicionados</Label>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {parseFloat(item.price).toFixed(2)} • {item.category || 'Sem categoria'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Items Button */}
      {menuItems.length === 0 && (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={loadExampleItems}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Carregar itens de exemplo
        </Button>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <LayoutGrid className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Configure suas Mesas</h2>
        <p className="text-muted-foreground mt-2">Quantas mesas seu estabelecimento possui?</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setTableCount(Math.max(1, tableCount - 1))}
            disabled={tableCount <= 1}
          >
            <Minus className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <p className="text-5xl font-bold text-foreground">{tableCount}</p>
            <p className="text-sm text-muted-foreground mt-1">mesas</p>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setTableCount(Math.min(99, tableCount + 1))}
            disabled={tableCount >= 99}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap justify-center gap-2">
          {[5, 10, 15, 20, 30].map((num) => (
            <Button
              key={num}
              variant={tableCount === num ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTableCount(num)}
              style={tableCount === num ? { backgroundColor: themeColor } : {}}
            >
              {num} mesas
            </Button>
          ))}
        </div>

        {/* Visual grid preview */}
        <div className="p-4 rounded-xl border border-border bg-muted/30">
          <Label className="text-xs text-muted-foreground mb-3 block">Prévia do layout</Label>
          <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
            {Array.from({ length: Math.min(tableCount, 25) }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: themeColor }}
              >
                {i + 1}
              </div>
            ))}
            {tableCount > 25 && (
              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{tableCount - 25}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tudo Pronto!</h2>
        <p className="text-muted-foreground mt-2">Revise as configurações e comece a usar</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg"
              style={{ backgroundColor: themeColor }}
            />
            <div>
              <p className="text-sm text-muted-foreground">Cor do sistema</p>
              <p className="font-medium">{themeColor}</p>
            </div>
          </div>
          
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Mesas</p>
            <p className="font-medium">{tableCount} mesas configuradas</p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Cardápio</p>
            <p className="font-medium">
              {menuItems.length > 0 
                ? `${menuItems.length} itens cadastrados`
                : 'Itens de exemplo serão adicionados'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-center text-muted-foreground">
        Você pode alterar essas configurações a qualquer momento em <strong>Configurações</strong>.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-colors text-sm",
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  className="flex-1"
                  onClick={() => setStep(step + 1)}
                  style={{ backgroundColor: themeColor }}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  style={{ backgroundColor: themeColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Começar a usar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip */}
        {step < totalSteps && (
          <p className="text-center mt-4 text-sm text-muted-foreground">
            <button
              onClick={() => setStep(totalSteps)}
              className="hover:underline"
            >
              Pular configuração inicial
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
