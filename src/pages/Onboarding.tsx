import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
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
  Minus,
  Building2
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

const DEFAULT_THEME_COLOR = '#2563EB';

const tiposEstabelecimento = [
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'lanchonete', label: 'Lanchonete' },
  { value: 'padaria', label: 'Padaria' },
  { value: 'bar', label: 'Bar' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'outro', label: 'Outro' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization, isLoading, refetchOrganizations } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if this is edit mode (onboarding already completed)
  const isEditMode = currentOrganization?.onboarding_completed === true;

  // Step 1: Company info - pre-fill with existing data
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const [step, setStep] = useState(1);
  const [tableCount, setTableCount] = useState(10);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualItem, setManualItem] = useState<MenuItem>({ name: '', price: '', category: '' });

  // Pre-fill data from current organization when in edit mode
  React.useEffect(() => {
    if (currentOrganization && !hasInitialized) {
      const org = currentOrganization as any;
      setCompanyName(org.name || '');
      setCompanyType(org.type || '');
      setOwnerName(org.owner_name || '');
      setPhone(org.phone || '');
      setTableCount(org.table_count || 10);
      setHasInitialized(true);
    }
  }, [currentOrganization, hasInitialized]);

  // 4 steps for new setup, 1 step for edit mode (just company data)
  const totalSteps = isEditMode ? 1 : 4;

  // Show loading while fetching organization
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if no organization
  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Organização não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Por favor, faça login novamente para continuar.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle edit mode - show edit form instead of blocking
  const handleSaveEdit = async () => {
    if (!currentOrganization) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          name: companyName || currentOrganization.name,
          type: companyType || null,
          owner_name: ownerName || null,
          phone: phone || null,
          table_count: tableCount,
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      await refetchOrganizations();

      toast({
        title: 'Dados atualizados!',
        description: 'As configurações do seu estabelecimento foram salvas.',
      });

      navigate('/configuracoes', { replace: true });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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
      // Update organization with all collected data (using default theme color)
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          name: companyName || currentOrganization.name,
          type: companyType || null,
          owner_name: ownerName || null,
          phone: phone || null,
          theme_color: DEFAULT_THEME_COLOR,
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

      toast({
        title: 'Configuração concluída!',
        description: 'Seu estabelecimento está pronto para uso.',
      });

      // Navigate directly - the state flag tells Dashboard not to redirect back
      navigate('/dashboard', { replace: true, state: { fromOnboarding: true } });
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

  // Step 1: Company Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Seu Estabelecimento</h2>
        <p className="text-muted-foreground mt-2">Conte-nos sobre seu negócio</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Nome do estabelecimento *</Label>
          <Input
            id="companyName"
            placeholder="Ex: Cafeteria do João"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyType">Tipo de estabelecimento</Label>
          <Select value={companyType} onValueChange={setCompanyType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {tiposEstabelecimento.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ownerName">Nome do responsável</Label>
          <Input
            id="ownerName"
            placeholder="Seu nome"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone/WhatsApp</Label>
          <Input
            id="phone"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Menu (was step 3)
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
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4" />
            Adicionar item manualmente
          </div>
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

  // Step 3: Tables (was step 4)
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
                className="aspect-square rounded-lg bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground"
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

  // Step 4: Summary (was step 5)
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
          <div>
            <p className="text-sm text-muted-foreground">Estabelecimento</p>
            <p className="font-medium">{companyName || 'Meu Negócio'}</p>
            {companyType && (
              <p className="text-sm text-muted-foreground">
                {tiposEstabelecimento.find(t => t.value === companyType)?.label}
              </p>
            )}
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

  // Edit mode - simplified form
  if (isEditMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Personalização</h2>
                <p className="text-muted-foreground mt-2">Atualize os dados do seu estabelecimento</p>
              </div>

              {renderStep1()}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/configuracoes')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting || !companyName.trim()}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                  disabled={step === 1 && !companyName.trim()}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleFinish}
                  disabled={isSubmitting}
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
