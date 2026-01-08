import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Package, ImageIcon, Loader2, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logError } from '@/lib/errorLogger';
import { productSchema, categorySchema } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface GerenciarCardapioProps {
  onBack: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string | null;
  is_active: boolean;
  stock: number;
  organization_id: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  organization_id: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function GerenciarCardapio({ onBack }: GerenciarCardapioProps) {
  const [search, setSearch] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['uncategorized']));
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    stock: '100',
  });
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-admin', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentOrganization,
  });

  // Fetch categories (global + organization)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-admin', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`organization_id.eq.${currentOrganization?.id},organization_id.is.null`)
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentOrganization,
  });

  const isLoading = productsLoading || categoriesLoading;

  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = products.filter(p => p.category_id === category.id);
    return acc;
  }, {} as Record<string, Product[]>);

  // Products without category
  const uncategorizedProducts = products.filter(p => !p.category_id);

  // Filter by search
  const filterProducts = (prods: Product[]) => 
    prods.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Product handlers
  const openNewProduct = (categoryId?: string) => {
    setEditingProduct(null);
    setProductFormData({ name: '', price: '', description: '', category_id: categoryId || '', stock: '100' });
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category_id: product.category_id || '',
      stock: product.stock.toString(),
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productFormData.name || !productFormData.price) {
      toast.error('Preencha nome e preço');
      return;
    }

    const productData = {
      name: productFormData.name.trim(),
      price: parseFloat(productFormData.price),
      description: productFormData.description?.trim() || null,
      category_id: productFormData.category_id || null,
      stock: parseInt(productFormData.stock) || 100,
      is_active: true,
      organization_id: currentOrganization?.id,
    };

    const validation = productSchema.safeParse(productData);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado');
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        toast.success('Produto adicionado');
      }
      
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductDialogOpen(false);
    } catch (error) {
      logError(error, 'Error saving product');
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productToDelete.id);
      if (error) throw error;
      
      toast.success('Produto removido');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      logError(error, 'Error deleting product');
      toast.error('Erro ao remover produto');
    } finally {
      setDeleteProductDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Category handlers
  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '' });
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    // Only allow editing custom categories
    if (!category.organization_id) {
      toast.error('Categorias padrão não podem ser editadas');
      return;
    }
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    const categoryData = {
      name: categoryFormData.name.trim(),
      type: 'cafeteria',
      organization_id: currentOrganization?.id,
    };

    const validation = categorySchema.safeParse(categoryData);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: categoryData.name })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoria atualizada');
      } else {
        const { error } = await supabase.from('categories').insert(categoryData);
        if (error) throw error;
        toast.success('Categoria adicionada');
      }
      
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryDialogOpen(false);
    } catch (error) {
      logError(error, 'Error saving category');
      toast.error('Erro ao salvar categoria');
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    if (!category.organization_id) {
      toast.error('Categorias padrão não podem ser removidas');
      return;
    }
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      // Remove category reference from products first
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryToDelete.id);
      
      const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
      if (error) throw error;
      
      toast.success('Categoria removida');
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    } catch (error) {
      logError(error, 'Error deleting category');
      toast.error('Erro ao remover categoria');
    } finally {
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // OCR Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie uma imagem do cardápio.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB.');
      return;
    }

    setIsProcessingOCR(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('ocr-menu', {
        body: { image: base64 },
      });

      if (error) throw error;

      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        const normalize = (str: string) => 
          str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
        
        const uniqueCategories = [...new Set(data.items.map((item: any) => item.category || 'Geral'))];
        const categoryMap: Record<string, string> = {};

        for (const categoryName of uniqueCategories) {
          const catName = (categoryName as string).trim();
          const normalizedCatName = normalize(catName);
          
          const existingCat = categories.find(c => normalize(c.name) === normalizedCatName);
          
          if (existingCat) {
            categoryMap[catName] = existingCat.id;
          } else {
            const { data: cat, error: catError } = await supabase
              .from('categories')
              .insert({
                name: catName,
                type: 'cafeteria',
                organization_id: currentOrganization?.id,
              })
              .select()
              .single();

            if (!catError && cat) {
              categoryMap[catName] = cat.id;
            }
          }
        }

        const productsToInsert = data.items.map((item: any) => ({
          name: item.name,
          price: parseFloat(item.price) || 0,
          description: item.description || null,
          category_id: categoryMap[item.category || 'Geral'] || null,
          organization_id: currentOrganization?.id,
          is_active: true,
          stock: 100,
        }));

        const { error: prodError } = await supabase.from('products').insert(productsToInsert);
        if (prodError) throw prodError;

        queryClient.invalidateQueries({ queryKey: ['products-admin'] });
        queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });

        toast.success(`${data.items.length} itens importados do cardápio!`);
      } else {
        toast.error('Nenhum item encontrado. Tente uma imagem mais clara.');
      }
    } catch (error) {
      logError(error, 'OCR Error');
      toast.error('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsProcessingOCR(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderProductItem = (product: Product) => (
    <div
      key={product.id}
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground truncate">{product.description}</p>
        )}
      </div>
      <p className="text-sm font-semibold text-primary shrink-0">{formatCurrency(product.price)}</p>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProduct(product)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive hover:text-destructive" 
          onClick={() => { setProductToDelete(product); setDeleteProductDialogOpen(true); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Cardápio</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categorias · {products.length} produtos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => openNewProduct()} size="sm" className="flex-1">
          <Plus className="h-4 w-4 mr-1" /> Produto
        </Button>
        <Button onClick={openNewCategory} size="sm" variant="outline" className="flex-1">
          <Tag className="h-4 w-4 mr-1" /> Categoria
        </Button>
      </div>

      {/* Upload Menu */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer",
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
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando cardápio com IA...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Importar cardápio via foto (IA)</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories & Products */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-2">
          {/* Categorized products */}
          {categories.map((category) => {
            const categoryProducts = filterProducts(productsByCategory[category.id] || []);
            const isExpanded = expandedCategories.has(category.id);
            const isGlobal = !category.organization_id;
            
            return (
              <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{category.name}</p>
                          {isGlobal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">padrão</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{(productsByCategory[category.id] || []).length} produtos</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isGlobal && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={(e) => { e.stopPropagation(); openEditCategory(category); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive" 
                              onClick={(e) => { e.stopPropagation(); confirmDeleteCategory(category); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => { e.stopPropagation(); openNewProduct(category.id); }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border/50 px-3 pb-2">
                      {categoryProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-3 text-center">Nenhum produto nesta categoria</p>
                      ) : (
                        categoryProducts.map(renderProductItem)
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {/* Uncategorized products */}
          {uncategorizedProducts.length > 0 && (
            <Collapsible open={expandedCategories.has('uncategorized')} onOpenChange={() => toggleCategory('uncategorized')}>
              <div className="bg-card rounded-xl border border-dashed border-border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="p-2 rounded-lg bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-muted-foreground">Sem categoria</p>
                      <p className="text-xs text-muted-foreground">{uncategorizedProducts.length} produtos</p>
                    </div>
                    {expandedCategories.has('uncategorized') ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-dashed border-border px-3 pb-2">
                    {filterProducts(uncategorizedProducts).map(renderProductItem)}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {products.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              <p className="text-sm text-muted-foreground">Adicione produtos ou importe via foto</p>
            </div>
          )}
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={productFormData.stock}
                  onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select 
                value={productFormData.category_id} 
                onValueChange={(v) => setProductFormData({ ...productFormData, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveProduct}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveCategory}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={deleteProductDialogOpen} onOpenChange={setDeleteProductDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{productToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{categoryToDelete?.name}"? Produtos desta categoria ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
